from django.urls import path
from .views import (
    AuditLogListView,
    AuditLogDetailView,
    audit_metrics,
    audit_export_csv,
    audit_enums,
)

urlpatterns = [
    path('',          AuditLogListView.as_view(),  name='audit-log-list'),
    path('<int:pk>/', AuditLogDetailView.as_view(), name='audit-log-detail'),
    path('metrics/',  audit_metrics,                name='audit-metrics'),
    path('export/',   audit_export_csv,             name='audit-export-csv'),
    path('enums/',    audit_enums,                  name='audit-enums'),
]
