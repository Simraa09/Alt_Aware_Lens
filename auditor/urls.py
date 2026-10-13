from django.urls import path
from . import views

urlpatterns = [
    path('', views.home_view, name='home'),
    path('report/', views.report_view, name='report'),
    path('about/', views.about_view, name='about'),
    path('legal/', views.legal_view, name='legal'),
    path('audit/run/', views.audit_url_endpoint, name='audit_run'),
    path('audit/review/<int:finding_id>/', views.review_finding_endpoint, name='review_finding'),
    path('audit/export/<int:audit_id>/', views.export_audit_csv, name='export_csv'),
]
