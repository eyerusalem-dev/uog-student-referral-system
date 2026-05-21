from django.urls import path
from .views import (
    ClinicalVisitViewSet,
    LabRequestViewSet,
    PrescriptionViewSet,
)

visit_list = ClinicalVisitViewSet.as_view({
    'get': 'list',
    'post': 'create',
})

visit_detail = ClinicalVisitViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy',
})

lab_request_list = LabRequestViewSet.as_view({
    'get': 'list',
    'post': 'create',
})

lab_request_detail = LabRequestViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy',
})

prescription_list = PrescriptionViewSet.as_view({
    'get': 'list',
    'post': 'create',
})

prescription_detail = PrescriptionViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy',
})

urlpatterns = [
    path('', visit_list, name='visit-list'),
    path('<int:pk>/', visit_detail, name='visit-detail'),

    path('lab-requests/', lab_request_list, name='lab-request-list'),
    path('lab-requests/<int:pk>/', lab_request_detail, name='lab-request-detail'),

    path('prescriptions/', prescription_list, name='prescription-list'),
    path('prescriptions/<int:pk>/', prescription_detail, name='prescription-detail'),
]