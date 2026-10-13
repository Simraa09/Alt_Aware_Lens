import csv
from concurrent.futures import ThreadPoolExecutor
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, render
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from .models import Audit, ImageFinding
from .services.auditor_service import audit_single_image
from .services.crawler import extract_images_from_url


def limit_to_five_lines(text):
    """Enforces that suggested_action stays within 5 lines."""
    if not text:
        return ''
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    if len(lines) <= 5:
        return '\n'.join(lines)
    return '\n'.join(lines[:5])


def process_item_worker(item):
    """Evaluates an image while strictly maintaining its webpage DOM sequence index."""
    order_idx = item.get('order_index', 1)
    img_url = item.get('image_url', '')
    current_alt = item.get('current_alt', 'No alt attribute present')
    alt_state = item.get('alt_state', 'populated')
    is_functional = item.get('is_functional', False)
    functional_target = item.get('functional_target', '')
    context = item.get('nearby_context', '')
    alt_present = item.get('alt_present', True)

    if item.get('is_placeholder'):
        issue_override = 'Vague description'
    else:
        issue_override = None

    try:
        ai_result = audit_single_image(
            image_url=img_url,
            current_alt=current_alt,
            alt_state=alt_state,
            is_functional=is_functional,
            functional_target=functional_target,
            context_text=context,
        )

        issue = issue_override or ai_result.get('issue_category', 'None')
        raw_action = ai_result.get('suggested_action', '').strip()

        if issue == 'None':
            suggested_action = (
                raw_action
                or 'Existing alt text fulfills the image purpose under WCAG 2.2 SC 1.1.1.\nRetain current description.'
            )
        else:
            suggested_action = (
                raw_action
                or f'Action required ({issue}) to meet WCAG 2.2 SC 1.1.1.\nUpdate alt text to match the non-text content purpose.'
            )

        suggested_action = limit_to_five_lines(suggested_action)

        raw_proposed = ai_result.get('proposed_alt_text', '').strip()
        purpose = ai_result.get('image_purpose', 'informative')

        if purpose == 'decorative':
            proposed_alt = 'alt=""'
        elif not raw_proposed or raw_proposed.lower() in ['', 'none', 'null']:
            proposed_alt = 'alt=""'
        elif not raw_proposed.startswith('alt='):
            proposed_alt = f'alt="{raw_proposed}"'
        else:
            proposed_alt = raw_proposed

        return {
            'order_index': order_idx,
            'image_url': img_url,
            'alt_attribute_present': alt_present,
            'current_alt': current_alt,
            'alt_state': alt_state,
            'is_functional': is_functional,
            'functional_target': functional_target,
            'suggested_action': suggested_action,
            'proposed_alt_text': proposed_alt,
            'issue_type': issue,
            'image_purpose': purpose,
            'heuristic_score': 50,
            'confidence': ai_result.get('confidence', 'medium'),
            'human_review_required': ai_result.get('human_review_required', False),
            'need_for_long_description': ai_result.get('need_for_long_description', False),
            'nearby_context': context,
        }

    except Exception as e:
        err_msg = str(e)
        if '500' in err_msg or 'INTERNAL' in err_msg:
            clean_action = (
                'Image format or dimensions could not be parsed by the vision model.\n'
                'Under WCAG 2.2 SC 1.1.1, if this visual is an icon or divider, set alt="".\n'
                'If it conveys critical informative content, supply manual alt text.'
            )
        else:
            clean_action = (
                'Automated analysis was limited for this asset.\n'
                'Inspect the visual context manually.\n'
                'Ensure informative non-text content has equivalent alt text under WCAG 2.2 SC 1.1.1.'
            )

        return {
            'order_index': order_idx,
            'image_url': img_url,
            'alt_attribute_present': alt_present,
            'current_alt': current_alt,
            'alt_state': alt_state,
            'is_functional': is_functional,
            'functional_target': functional_target,
            'suggested_action': limit_to_five_lines(clean_action),
            'proposed_alt_text': 'alt="" <!-- Review required -->',
            'issue_type': 'Human review required',
            'image_purpose': 'uncertain',
            'heuristic_score': 30,
            'confidence': 'low',
            'human_review_required': True,
            'need_for_long_description': False,
            'nearby_context': context,
        }


@csrf_exempt
def audit_url_endpoint(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)

    target_url = request.POST.get('url', '').strip()
    if not target_url:
        return JsonResponse({'error': 'URL is required'}, status=400)

    audit = Audit.objects.create(page_url=target_url, status='pending')

    try:
        images_data = extract_images_from_url(target_url, max_images=10)
        audit.total_images = len(images_data)
        audit.save()

        if not images_data:
            audit.status = 'completed'
            audit.save()
            return JsonResponse({
                'audit_id': audit.id,
                'page_url': audit.page_url,
                'total_images': 0,
                'analysed_images': 0,
                'findings': [],
                'disclaimer': 'No analyzable content images found on this page.',
            })

        with ThreadPoolExecutor(max_workers=5) as executor:
            findings = list(executor.map(process_item_worker, images_data))

        # Sort strictly by the original DOM sequence index
        findings.sort(key=lambda x: x['order_index'])

        for f in findings:
            ImageFinding.objects.create(
                audit=audit,
                image_url=f['image_url'],
                alt_attribute_present=f['alt_attribute_present'],
                original_alt=f['current_alt'],
                alt_state=f['alt_state'],
                is_functional=f['is_functional'],
                functional_target=f['functional_target'],
                explanation=f['suggested_action'],
                suggested_alt=f['proposed_alt_text'],
                issue_type=f['issue_type'],
                image_purpose=f['image_purpose'],
                confidence=f['confidence'],
                human_review_required=f['human_review_required'],
                need_for_long_description=f['need_for_long_description'],
                nearby_context=f['nearby_context'],
                review_status='pending',
            )
            audit.analysed_images += 1

        audit.status = 'completed'
        audit.save()

        return JsonResponse({
            'audit_id': audit.id,
            'page_url': audit.page_url,
            'total_images': audit.total_images,
            'analysed_images': audit.analysed_images,
            'findings': findings,
            'disclaimer': (
                'Heuristic audit informed by WCAG 2.2 and GIGW 3.0 principles. '
                'Automated evaluation results do not certify legal compliance.'
            ),
        })

    except Exception as e:
        audit.status = 'failed'
        audit.save()
        return JsonResponse({'error': f'Failed to process audit: {str(e)}'}, status=500)


@csrf_exempt
def review_finding_endpoint(request, finding_id):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)

    finding = get_object_or_404(ImageFinding, id=finding_id)
    updated_alt = request.POST.get('updated_alt')

    if updated_alt is not None:
        finding.suggested_alt = updated_alt
        finding.review_status = 'edited'
        finding.reviewed_at = timezone.now()
        finding.save()
        return JsonResponse({
            'success': True,
            'finding_id': finding.id,
            'updated_alt': finding.suggested_alt,
        })

    return JsonResponse({'error': 'No updated alt text provided'}, status=400)


def export_audit_csv(request, audit_id):
    audit = get_object_or_404(Audit, id=audit_id)
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="audit_{audit.id}_report.csv"'

    writer = csv.writer(response)
    writer.writerow([
        'ID',
        'Image URL',
        'Current Alt',
        'Suggested Action',
        'Proposed Code Alt',
        'Issue Type',
        'Purpose',
        'Confidence',
        'Need Long Description',
    ])
    for f in audit.findings.all():
        writer.writerow([
            f.id,
            f.image_url,
            f.original_alt,
            f.explanation,
            f.suggested_alt,
            f.issue_type,
            f.image_purpose,
            f.confidence,
            f.need_for_long_description,
        ])

    return response


def dashboard_view(request):
    return render(request, 'test.html') 