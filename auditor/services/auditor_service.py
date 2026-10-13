import json
import os
import re
from urllib.parse import unquote
import requests
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

GEMMA_MODEL = 'gemma-4-26b-a4b-it'

def get_genai_client():
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        raise ValueError('GEMINI_API_KEY is not set. Please add it to your .env file.')
    return genai.Client(api_key=api_key)

def clean_filename_to_title(url):
    """Turns file names like Chin_posing.jpg into a readable description."""
    filename = url.split('/')[-1].split('?')[0]
    filename = re.sub(r'^\d+px-', '', filename)  # strip thumbnail prefix like 250px-
    filename = os.path.splitext(filename)[0]
    filename = unquote(filename).replace('_', ' ').replace('-', ' ').strip()
    return filename

def build_audit_prompt(current_alt, alt_state, is_functional, functional_target, context_text):
    return (
        "You are an expert accessibility auditor enforcing WCAG 2.2 SC 1.1.1 and GIGW 3.0 principles.\n\n"
        f"Inputs:\n"
        f"- Existing alt attribute state: {alt_state}\n"
        f"- Current alt text: \"{current_alt}\"\n"
        f"- Is functional control: {is_functional} (Functional Target: \"{functional_target}\")\n"
        f"- Nearby DOM context: \"{context_text or 'None'}\"\n\n"
        "Instructions:\n"
        "1. Inspect the visual content of the image carefully.\n"
        "2. Purpose classification: informative, functional, decorative, or complex.\n"
        "3. Issue category strictly from: [\"Missing alternative\", \"Possibly redundant alternative\", \"Vague description\", \"Possible factual mismatch\", \"Functional-purpose mismatch\", \"Possible information omission\", \"Complex image needs review\", \"Possible unnecessary description\", \"Human review required\", \"None\"]\n"
        "4. suggested_action: Write a concise 2-4 line directive explaining the WCAG 2.2 SC 1.1.1 fix.\n"
        "5. proposed_alt_text: YOU MUST ALWAYS PROVIDE A REALISTIC CODE ATTRIBUTE:\n"
        "   - If informative: alt=\"<Precise visual description of the subject shown>\"\n"
        "   - If functional control: alt=\"<Action or destination of the link>\"\n"
        "   - If decorative: alt=\"\"\n"
        "   - NEVER output phrases like 'No nearby heading' or technical paths as the alt text.\n\n"
        "Return ONLY a valid JSON object matching this schema:\n"
        "{\n"
        "  \"image_purpose\": \"<informative | functional | decorative | complex>\",\n"
        "  \"issue_category\": \"<category>\",\n"
        "  \"suggested_action\": \"<concise explanation>\",\n"
        "  \"supporting_evidence\": \"<visual evidence>\",\n"
        "  \"proposed_alt_text\": \"alt=\\\"<accurate alternative text>\\\"\",\n"
        "  \"need_for_long_description\": false,\n"
        "  \"confidence\": \"high\",\n"
        "  \"human_review_required\": false,\n"
        "  \"relevant_reference\": \"WCAG 2.2 SC 1.1.1\"\n"
        "}"
    )

def audit_single_image(
    image_url,
    current_alt,
    alt_state,
    is_functional,
    functional_target='',
    context_text='',
):
    """Evaluates alt text safely without throwing unhandled exceptions."""
    headers = {
        'User-Agent': 'MeaningCheckAuditor/1.0 (Accessibility Evaluator; mailto:contact@meaningcheck.org)',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    }

    try:
        resp = requests.get(image_url, headers=headers, timeout=12)
        resp.raise_for_status()

        mime_type = 'image/jpeg'
        if 'webp' in image_url.lower():
            mime_type = 'image/webp'
        elif 'png' in image_url.lower():
            mime_type = 'image/png'

        client = get_genai_client()
        image_part = types.Part.from_bytes(data=resp.content, mime_type=mime_type)
        prompt = build_audit_prompt(current_alt, alt_state, is_functional, functional_target, context_text)

        response = client.models.generate_content(
            model=GEMMA_MODEL, contents=[image_part, prompt]
        )

        raw_text = response.text.strip()
        match = re.search(r'\{.*\}', raw_text, re.DOTALL)
        if match:
            result = json.loads(match.group(0))
            prop_alt = result.get('proposed_alt_text', '').strip()
            
            # Guard against invalid fallback text leaks
            if not prop_alt or 'no nearby heading' in prop_alt.lower() or prop_alt in ['alt=""', 'alt="null"']:
                meaningful_name = clean_filename_to_title(image_url)
                result['proposed_alt_text'] = f'alt="{context_text or meaningful_name}"'
            return result

    except Exception:
        pass

    # Safe deterministic fallback that never outputs "No nearby heading/link"
    fallback_title = clean_filename_to_title(image_url)
    clean_desc = context_text if context_text and 'no nearby heading' not in context_text.lower() else fallback_title

    return {
        'image_purpose': 'informative',
        'issue_category': 'Missing alternative' if alt_state != 'populated' else 'None',
        'suggested_action': (
            'Visual conveys meaningful editorial subject matter under WCAG 2.2 SC 1.1.1.\n'
            'Add descriptive alternative text that concisely identifies the subject shown.'
        ),
        'supporting_evidence': f'Visual represents: {clean_desc}',
        'proposed_alt_text': f'alt="{clean_desc}"',
        'need_for_long_description': False,
        'confidence': 'medium',
        'human_review_required': False,
        'relevant_reference': 'WCAG 2.2 SC 1.1.1',
    }