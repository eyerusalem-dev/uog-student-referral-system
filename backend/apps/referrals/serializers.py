from rest_framework import serializers
from .models import Referral


class ReferralSerializer(serializers.ModelSerializer):
    student_university_id = serializers.CharField(source='student.university_id', read_only=True)
    student_name = serializers.SerializerMethodField()
    receiving_department_name = serializers.CharField(source='receiving_department.name', read_only=True)
    referred_by_username = serializers.CharField(source='referred_by.username', read_only=True)

    class Meta:
        model = Referral
        fields = [
            'referral_id',
            'student',
            'student_university_id',
            'student_name',
            'clinical_visit',
            'referred_by',
            'referred_by_username',
            'receiving_department',
            'receiving_department_name',
            'reason',
            'referral_note',
            'status',
            'response_note',
            'responded_at',
            'created_at',
        ]
        read_only_fields = [
            'referral_id',
            'referred_by',
            'responded_at',
            'created_at',
            'referred_by_username',
            'student_university_id',
            'student_name',
            'receiving_department_name',
        ]

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"