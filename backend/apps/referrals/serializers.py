from rest_framework import serializers
from .models import Referral
from apps.visits.models import ClinicalVisit
from apps.students.models import Student


class ClinicalVisitSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = ClinicalVisit
        fields = [
            'id', 'symptoms', 'diagnosis', 'treatment', 'advice',
            'lab_used', 'lab_note', 'pharmacy_used', 'medication_given', 'visit_date'
        ]


class ReferralSerializer(serializers.ModelSerializer):
    student_university_id = serializers.CharField(source='student.university_id', read_only=True)
    student_name = serializers.SerializerMethodField()
    receiving_department_name = serializers.CharField(source='receiving_department.name', read_only=True)
    referred_by_username = serializers.CharField(source='referred_by.username', read_only=True)
    
    # NEW: Include the clinical visit details
    clinical_visit_details = ClinicalVisitSummarySerializer(source='clinical_visit', read_only=True)
    
    # Accept university_id as an alternative to student database ID
    student_university_id_input = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Referral
        fields = [
            'referral_id', 'student', 'student_university_id', 'student_university_id_input', 'student_name',
            'clinical_visit', 'clinical_visit_details', 'referred_by', 'referred_by_username',
            'receiving_department', 'receiving_department_name',
            'urgency', 'reason', 'referral_note', 'status', 'response_note', 'responded_at', 'created_at',
        ]
        read_only_fields = [
            'referral_id', 'referred_by', 'responded_at', 'created_at',
            'referred_by_username', 'student_university_id', 'student_name',
            'receiving_department_name', 'clinical_visit_details'
        ]

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"

    def validate_student(self, value):
        """Allow student to be passed as university_id string or database ID."""
        if value is None:
            raise serializers.ValidationError("Student is required.")
        return value

    def validate(self, attrs):
        # Check if student_university_id_input was provided (from frontend)
        student_university_id_input = attrs.pop('student_university_id_input', None)
        
        # If the student field wasn't properly set but we have a university_id input
        if student_university_id_input and not attrs.get('student'):
            try:
                student = Student.objects.get(university_id=student_university_id_input)
                attrs['student'] = student
            except Student.DoesNotExist:
                raise serializers.ValidationError({
                    'student': f'Student with university ID "{student_university_id_input}" not found.'
                })
        
        # Also check if the regular student field contains a university_id string
        student = attrs.get('student')
        if student and isinstance(student, str):
            try:
                # Try to find by university_id first
                attrs['student'] = Student.objects.get(university_id=student)
            except Student.DoesNotExist:
                try:
                    # Try to find by primary key
                    attrs['student'] = Student.objects.get(pk=student)
                except Student.DoesNotExist:
                    raise serializers.ValidationError({
                        'student': f'Student "{student}" not found.'
                    })
        
        return attrs

    def create(self, validated_data):
        # Handle student lookup by university_id if needed
        student_data = validated_data.get('student')
        if isinstance(student_data, str):
            try:
                validated_data['student'] = Student.objects.get(university_id=student_data)
            except Student.DoesNotExist:
                try:
                    validated_data['student'] = Student.objects.get(pk=student_data)
                except Student.DoesNotExist:
                    raise serializers.ValidationError({'student': 'Student not found.'})
        
        return super().create(validated_data)
