import re
from urllib.parse import urljoin, unquote
from bs4 import BeautifulSoup
import requests

SKIP_KEYWORDS = [
    'favicon', 'badge', 'icon', 'avatar', 'social', 'sponsor',
    'magnify', 'clip', 'arrow', 'button', 'sprite', 'pixel', 'logo', 'loader'
]

VALID_IMAGE_EXTENSIONS = ('.jpg', '.jpeg', '.png', '.webp', '.avif')

PLACEHOLDER_PATTERN = re.compile(
    r'^(image|img|picture|photo|graphic|screenshot|\S+\.(png|jpe?g|webp|gif|svg))$',
    re.I
)

def extract_clean_image_src(img_tag):
    """Picks only a valid raster image URL from an <img> tag."""
    for attr in ['srcset', 'data-srcset']:
        srcset = img_tag.get(attr)
        if srcset:
            candidates = [c.strip().split(' ')[0] for c in srcset.split(',') if c.strip()]
            for cand in reversed(candidates):
                cleaned = cand.split('?')[0].lower()
                if cleaned.endswith(VALID_IMAGE_EXTENSIONS):
                    return cand

    if img_tag.parent and img_tag.parent.name == 'picture':
        for source in img_tag.parent.find_all('source'):
            s_srcset = source.get('srcset') or source.get('data-srcset') or ''
            if s_srcset:
                candidates = [c.strip().split(' ')[0] for c in s_srcset.split(',') if c.strip()]
                for cand in reversed(candidates):
                    cleaned = cand.split('?')[0].lower()
                    if cleaned.endswith(VALID_IMAGE_EXTENSIONS):
                        return cand

    for attr in ['src', 'data-src', 'data-lazy-src', 'data-original', 'data-full-url']:
        val = img_tag.get(attr, '').strip()
        if not val or val.startswith('data:'):
            continue
        cleaned = val.split('?')[0].lower()
        if any(cleaned.endswith(ext) for ext in VALID_IMAGE_EXTENSIONS):
            return val

    val = img_tag.get('src', '').strip()
    if val and not val.startswith('data:') and not val.endswith('.svg'):
        return val

    return ''


def extract_context(img_tag):
    """Extracts meaningful context from captions, parents, or preceding headings."""
    # 1. Check figure caption
    parent_fig = img_tag.find_parent(['figure', 'div'])
    if parent_fig:
        caption = parent_fig.find(class_=re.compile(r'caption|thumbcaption|gallerytext', re.I))
        if caption:
            text = caption.get_text(strip=True)
            if text:
                return text

    # 2. Check figcaption directly
    figcaption = img_tag.find_parent('figure')
    if figcaption and figcaption.find('figcaption'):
        text = figcaption.find('figcaption').get_text(strip=True)
        if text:
            return text

    # 3. Check image or parent title / aria-label
    title = img_tag.get('title') or (img_tag.parent.get('title') if img_tag.parent else '')
    if title and len(title) > 3:
        return title

    # 4. Check preceding section heading
    prev_h = img_tag.find_previous(['h1', 'h2', 'h3', 'h4'])
    if prev_h:
        h_text = prev_h.get_text(strip=True)
        if h_text and len(h_text) > 2:
            return f"Section: {h_text}"

    return ''


def extract_images_from_url(target_url, max_images=10):
    headers = {
        'User-Agent': 'MeaningCheckAuditor/1.0 (Accessibility Evaluator; mailto:contact@meaningcheck.org)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
    }

    try:
        response = requests.get(target_url, headers=headers, timeout=12)
        response.raise_for_status()
    except Exception:
        return []

    soup = BeautifulSoup(response.text, 'html.parser')

    # Remove non-content UI blocks
    for tag in soup(['header', 'footer', 'nav', 'aside', 'script', 'style', 'noscript']):
        tag.decompose()

    extracted = []
    seen_urls = set()
    order_counter = 1

    for img in soup.find_all('img'):
        src = extract_clean_image_src(img)
        if not src:
            continue

        img_url = urljoin(target_url, src).strip()
        decoded_url = unquote(img_url).lower()

        # Strip pure SVGs and skip keywords
        if '.svg' in decoded_url or any(kw in decoded_url for kw in SKIP_KEYWORDS):
            continue

        # Skip micro thumbnail icons (< 60px)
        if re.search(r'/(?:[1-5][0-9])px-', decoded_url):
            continue

        w = img.get('width', '')
        h = img.get('height', '')
        if w.isdigit() and int(w) < 60:
            continue
        if h.isdigit() and int(h) < 60:
            continue

        # Clean query parameters for deduplication
        base_clean_url = img_url.split('?')[0]
        if base_clean_url in seen_urls:
            continue
        seen_urls.add(base_clean_url)

        # Alt state classification
        raw_alt = img.get('alt')
        if raw_alt is None:
            alt_state = 'absent'
            current_alt_display = 'No alt attribute present'
            alt_present = False
        elif raw_alt.strip() == '':
            alt_state = 'empty'
            current_alt_display = 'Empty alt (alt="")'
            alt_present = True
        else:
            alt_state = 'populated'
            current_alt_display = raw_alt.strip()
            alt_present = True

        is_suspicious_placeholder = bool(PLACEHOLDER_PATTERN.match(raw_alt.strip())) if raw_alt else False

        parent_link = img.find_parent('a')
        parent_btn = img.find_parent('button')
        is_functional = bool(parent_link or parent_btn)
        functional_target = ''

        if parent_link:
            functional_target = f"Link destination: {parent_link.get('href', '')}"
        elif parent_btn:
            functional_target = f"Button action: {parent_btn.get('type', 'button')}"

        context = extract_context(img)

        extracted.append({
            'order_index': order_counter,
            'image_url': img_url,
            'alt_present': alt_present,
            'alt_state': alt_state,
            'current_alt': current_alt_display,
            'is_placeholder': is_suspicious_placeholder,
            'is_functional': is_functional,
            'functional_target': functional_target,
            'nearby_context': context,
        })
        order_counter += 1

        if len(extracted) >= max_images:
            break

    return extracted