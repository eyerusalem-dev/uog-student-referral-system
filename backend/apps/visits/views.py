from django.utils import timezone
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

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

from apps.audit.logger import AuditLogger
from apps.audit.models import ACTION_TYPES, RESOURCE_TYPES


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
        
        # Audit log for lab request completion
        if self.action in ['update', 'partial_update']:
            AuditLogger.log(
                action=ACTION_TYPES.VISIT_UPDATED,
                resource_type=RESOURCE_TYPES.VISIT,
                resource_id=str(instance.id),
                resource_repr=f"Lab Request: {instance.test_name}",
                actor=self.request.user,
                request=self.request,
                extra={
                    'lab_request_id': instance.id,
                    'status': instance.status,
                    'test_name': instance.test_name,
                    'student_name': instance.clinical_visit.student.university_id if instance.clinical_visit and instance.clinical_visit.student else None,
                }
            )
    
    def update(self, request, *args, **kwargs):
        """Override update to add validation for lab result completion."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Only lab technicians can complete lab requests
        if request.user.role != 'lab_technician' and request.user.role != 'admin':
            return Response(
                {'detail': 'Only lab technicians can update lab requests.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validate result_note when marking as completed
        if request.data.get('status') == 'completed':
            result_note = request.data.get('result_note', '').strip()
            if not result_note:
                return Response(
                    {'result_note': 'Results cannot be empty. Please enter valid lab results.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return super().update(request, *args, partial=partial, **kwargs)


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
        if instance.status in ['dispensed', 'out_of_stock'] and instance.dispensed_at is None:
            instance.dispensed_at = timezone.now()
            instance.save(update_fields=['dispensed_at'])
        
        # Audit log for prescription status change
        if self.action in ['update', 'partial_update']:
            AuditLogger.log(
                action=ACTION_TYPES.VISIT_UPDATED,
                resource_type=RESOURCE_TYPES.VISIT,
                resource_id=str(instance.id),
                resource_repr=f"Prescription: {instance.medication_name}",
                actor=self.request.user,
                request=self.request,
                extra={
                    'prescription_id': instance.id,
                    'status': instance.status,
                    'medication_name': instance.medication_name,
                    'student_id': instance.clinical_visit.student.university_id if instance.clinical_visit and instance.clinical_visit.student else None,
                }
            )
    
    def update(self, request, *args, **kwargs):
        """Override update to add validation for prescription status change."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Only pharmacists can update prescription status
        if request.user.role != 'pharmacist' and request.user.role != 'admin':
            return Response(
                {'detail': 'Only pharmacists can update prescription status.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Only allow status changes to dispensed or out_of_stock
        new_status = request.data.get('status')
        if new_status and new_status not in ['dispensed', 'out_of_stock']:
            return Response(
                {'status': 'Invalid status. Only "dispensed" or "out_of_stock" allowed.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Remove dispense_note from request data (pharmacist workflow simplified - no notes)
        if 'dispense_note' in request.data:
            del request.data['dispense_note']
        
        return super().update(request, *args, partial=partial, **kwargs)
