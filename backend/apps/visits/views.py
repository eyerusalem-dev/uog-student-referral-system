from django.utils import timezone
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from config.permissions import (
    IsClinicianRole,
    IsAdminRole,
    IsLabTechnicianRole,
    IsPharmacistRole,
    IsAdminOrClinician,
)

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
            # Both admins and clinicians can create clinical visits
            return [IsAuthenticated(), IsAdminOrClinician()]

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
        # Lab Technicians should only see pending requests
        if self.request.user.role == 'lab_technician':
            qs = qs.filter(status='pending')
        if visit_id:
            qs = qs.filter(clinical_visit_id=visit_id)
        if student_id:
            qs = qs.filter(clinical_visit__student__university_id=student_id)
        return qs

    def get_permissions(self):
        if self.action == 'list':
            return [IsAuthenticated(), IsLabTechnicianRole()]
        if self.action == 'retrieve':
            return [IsAuthenticated(), IsLabTechnicianRole()]
        if self.action == 'create':
            # Both admins and clinicians can create lab requests
            return [IsAuthenticated(), IsAdminOrClinician()]
        if self.action in ['update', 'partial_update']:
            return [IsAuthenticated(), IsLabTechnicianRole()]
        if self.action == 'destroy':
            return [IsAuthenticated(), IsAdminRole()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.status == 'completed' and instance.completed_at is None:
            instance.completed_at = timezone.now()
            instance.save(update_fields=['completed_at'])


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
        # Pharmacists should only see pending prescriptions
        if self.request.user.role == 'pharmacist':
            qs = qs.filter(status='pending')
        if visit_id:
            qs = qs.filter(clinical_visit_id=visit_id)
        if student_id:
            qs = qs.filter(clinical_visit__student__university_id=student_id)
        return qs

    def get_permissions(self):
        if self.action == 'list':
            return [IsAuthenticated(), IsPharmacistRole()]
        if self.action == 'retrieve':
            return [IsAuthenticated(), IsPharmacistRole()]
        if self.action == 'create':
            # Both admins and clinicians can create prescriptions
            return [IsAuthenticated(), IsAdminOrClinician()]
        if self.action in ['update', 'partial_update']:
            return [IsAuthenticated(), IsPharmacistRole()]
        if self.action == 'destroy':
            return [IsAuthenticated(), IsAdminRole()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(prescribed_by=self.request.user)

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.status == 'dispensed' and instance.dispensed_at is None:
            instance.dispensed_at = timezone.now()
            instance.save(update_fields=['dispensed_at'])