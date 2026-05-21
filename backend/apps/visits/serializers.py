from rest_framework import serializers
from .models import ClinicalVisit, LabRequest, Prescription


class LabRequestSerializer(serializers.ModelSerializer):
    requested_by_username = serializers.CharField(
        source='requested_by.username',
        read_only=True
    )

    class Meta:
        model = LabRequest
        fields = [
            'id',
            'clinical_visit',
            'test_name',
            'reason',
            'requested_by',
            'requested_by_username',
            'status',
            'created_at',
            'completed_at',
        ]
        read_only_fields = [
            'requested_by',
            'requested_by_username',
            'created_at',
            'completed_at',
        ]


class PrescriptionSerializer(serializers.ModelSerializer):
    prescribed_by_username = serializers.CharField(
        source='prescribed_by.username',
        read_only=True
    )

    class Meta:
        model = Prescription
        fields = [
            'id',
            'clinical_visit',
            'medication_name',
            'dosage',
            'frequency',
            'duration',
            'prescribed_by',
            'prescribed_by_username',
            'status',
            'created_at',
            'dispensed_at',
        ]
        read_only_fields = [
            'prescribed_by',
            'prescribed_by_username',
            'created_at',
            'dispensed_at',
        ]


class ClinicalVisitSerializer(serializers.ModelSerializer):
    student_university_id = serializers.CharField(
        source='student.university_id',
        read_only=True
    )

    student_name = serializers.SerializerMethodField()

    clinician_username = serializers.CharField(
        source='clinician.username',
        read_only=True
    )

    lab_requests = LabRequestSerializer(many=True, read_only=True)
    prescriptions = PrescriptionSerializer(many=True, read_only=True)

    class Meta:
        model = ClinicalVisit

        fields = [
            'id',

            'student',
            'student_university_id',
            'student_name',

            'clinician',
            'clinician_username',

            'symptoms',
            'diagnosis',
            'advice',
            'treatment',
            'note',

            'lab_used',
            'lab_note',

            'pharmacy_used',
            'medication_given',

            'lab_requests',
            'prescriptions',

            'visit_date',
            'is_locked',
        ]

        read_only_fields = [
            'clinician',
            'visit_date',
            'is_locked',
            'lab_requests',
            'prescriptions',
        ]

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"

    def validate(self, attrs):
        lab_used = attrs.get(
            'lab_used',
            getattr(self.instance, 'lab_used', False)
        )

        lab_note = attrs.get(
            'lab_note',
            getattr(self.instance, 'lab_note', '')
        )

        pharmacy_used = attrs.get(
            'pharmacy_used',
            getattr(self.instance, 'pharmacy_used', False)
        )

        medication_given = attrs.get(
            'medication_given',
            getattr(self.instance, 'medication_given', '')
        )

        if lab_used and not lab_note:
            raise serializers.ValidationError(
                "Add a lab note if lab was used."
            )

        if pharmacy_used and not medication_given:
            raise serializers.ValidationError(
                "Add medication details if pharmacy was used."
            )

        return attrs