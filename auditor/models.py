from django.db import models
from django.utils import timezone


class Audit(models.Model):
    page_url = models.URLField(max_length=1000)
    status = models.CharField(
        max_length=50,
        choices=[
            ('pending', 'Pending'),
            ('completed', 'Completed'),
            ('failed', 'Failed'),
        ],
        default='pending',
    )
    total_images = models.IntegerField(default=0)
    analysed_images = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Audit {self.id} - {self.page_url}'


class ImageFinding(models.Model):
    ISSUE_CHOICES = [
        ('None', 'None (Passes Criteria)'),
        ('Missing alternative', 'Missing alternative'),
        ('Possibly redundant alternative', 'Possibly redundant alternative'),
        ('Vague description', 'Vague description'),
        ('Possible factual mismatch', 'Possible factual mismatch'),
        ('Functional-purpose mismatch', 'Functional-purpose mismatch'),
        ('Possible information omission', 'Possible information omission'),
        ('Complex image needs review', 'Complex image needs review'),
        (
            'Possible unnecessary description',
            'Possible unnecessary description',
        ),
        ('Human review required', 'Human review required'),
        ('Analysis Error', 'Analysis Error'),
    ]

    PURPOSE_CHOICES = [
        ('informative', 'Informative'),
        ('functional', 'Functional'),
        ('decorative', 'Decorative'),
        ('complex', 'Complex Graphic/Chart'),
        ('uncertain', 'Uncertain / Needs Review'),
    ]

    CONFIDENCE_CHOICES = [
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]

    REVIEW_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('edited', 'Edited'),
        ('rejected', 'Rejected'),
    ]

    audit = models.ForeignKey(
        Audit, on_delete=models.CASCADE, related_name='findings'
    )
    image_url = models.URLField(max_length=2000)
    alt_attribute_present = models.BooleanField(default=True)
    original_alt = models.TextField(blank=True, default='')
    alt_state = models.CharField(max_length=20, default='populated')
    is_functional = models.BooleanField(default=False)
    functional_target = models.CharField(max_length=500, blank=True, default='')

    image_purpose = models.CharField(
        max_length=30, choices=PURPOSE_CHOICES, default='informative'
    )
    issue_type = models.CharField(
        max_length=50, choices=ISSUE_CHOICES, default='None'
    )
    heuristic_score = models.IntegerField(default=50)
    suggested_alt = models.TextField(blank=True, default='')
    explanation = models.TextField(blank=True, default='')
    supporting_evidence = models.TextField(blank=True, default='')
    need_for_long_description = models.BooleanField(default=False)
    confidence = models.CharField(
        max_length=10, choices=CONFIDENCE_CHOICES, default='medium'
    )
    human_review_required = models.BooleanField(default=False)

    nearby_context = models.TextField(blank=True, default='')
    review_status = models.CharField(
        max_length=20, choices=REVIEW_CHOICES, default='pending'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f'Finding {self.id} for Audit {self.audit_id}'