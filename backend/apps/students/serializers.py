from rest_framework import serializers
from .models import Student


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = '__all__'

    def validate_university_id(self, value):
        if '/' in value:
            raise serializers.ValidationError(
                "Do not use slashes in university ID. Use format like UOG-2021-045."
            )
        return value


class StudentDetailSerializer(serializers.ModelSerializer):
    visits = serializers.SerializerMethodField()
    referrals = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            'university_id',
            'first_name',
            'last_name',
            'department',
            'year_of_study',
            'phone',
            'photo',
            'emergency_contact',
            'university',
            'created_at',
            'updated_at',
            'visits',
            'referrals',
        ]

    def get_visits(self, obj):
        from apps.visits.serializers import ClinicalVisitSerializer
        return ClinicalVisitSerializer(
            obj.visits.all().order_by('-visit_date'),
            many=True
        ).data

    def get_referrals(self, obj):
        from apps.referrals.serializers import ReferralSerializer
        return ReferralSerializer(
            obj.referrals.all().order_by('-created_at'),
            many=True
        ).data