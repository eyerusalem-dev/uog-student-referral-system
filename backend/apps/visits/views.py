from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from config.permissions import IsClinicianRole, IsAdminRole

from .models import ClinicalVisit, LabRequest, Prescription
from .serializers import (
    ClinicalVisitSerializer,
    LabRequestSerializer,
    PrescriptionSerializer,
)


class ClinicalVisitViewSet(viewsets.ModelViewSet):
    queryset = ClinicalVisit.objects.select_related(
        'student',
        'clinician'
    ).all().order_by('-visit_date')

    serializer_class = ClinicalVisitSerializer

    def get_queryset(self):
        qs = super().get_queryset()

        student_id = self.request.query_params.get('student')

        if student_id:
            qs = qs.filter(student__university_id=student_id)

        return qs

    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated(), IsClinicianRole()]

        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminRole()]

        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(clinician=self.request.user, is_locked=True)


class LabRequestViewSet(viewsets.ModelViewSet):
    queryset = LabRequest.objects.select_related(
        'clinical_visit',
        'requested_by'
    ).all().order_by('-created_at')

    serializer_class = LabRequestSerializer

    def get_queryset(self):
        qs = super().get_queryset()

        visit_id = self.request.query_params.get('visit')
        student_id = self.request.query_params.get('student')

        if visit_id:
            qs = qs.filter(clinical_visit_id=visit_id)

        if student_id:
            qs = qs.filter(clinical_visit__student__university_id=student_id)

        return qs

    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated(), IsClinicianRole()]

        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminRole()]

        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)


class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.select_related(
        'clinical_visit',
        'prescribed_by'
    ).all().order_by('-created_at')

    serializer_class = PrescriptionSerializer

    def get_queryset(self):
        qs = super().get_queryset()

        visit_id = self.request.query_params.get('visit')
        student_id = self.request.query_params.get('student')

        if visit_id:
            qs = qs.filter(clinical_visit_id=visit_id)

        if student_id:
            qs = qs.filter(clinical_visit__student__university_id=student_id)

        return qs

    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated(), IsClinicianRole()]

        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminRole()]

        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(prescribed_by=self.request.user)