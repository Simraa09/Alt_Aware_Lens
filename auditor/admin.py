from django.contrib import admin
from .models import Audit, ImageFinding

@admin.register(Audit)
class AuditAdmin(admin.ModelAdmin):
    list_display = ('id', 'page_url', 'status', 'total_images', 'analysed_images', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('page_url',)

@admin.register(ImageFinding)
class ImageFindingAdmin(admin.ModelAdmin):
    list_display = ('id', 'audit', 'issue_type', 'heuristic_score', 'review_status')
    list_filter = ('issue_type', 'review_status')
    search_fields = ('image_url', 'original_alt', 'suggested_alt')