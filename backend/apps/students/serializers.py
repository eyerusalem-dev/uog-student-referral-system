import re
from rest_framework import serializers
from .models import Student


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = '__all__'

    def validate_university_id(self, value):
        # Validate GUR-YYYY-XX format (GUR-YYYY-XX where YYYY is year and XX is 2-digit number)
        pattern = r'^GUR-\d{4}-\d{2}$'
        if not re.match(pattern, value):
            raise serializers.ValidationError(
                "University ID must be in GUR-YYYY-XX format (e.g., GUR-2024-01)."
            )
        # Check for duplicate university ID
        if Student.objects.filter(university_id=value).exists():
            raise serializers.ValidationError(
                "A student with this university ID already exists."
            )
        return value

    def validate_phone(self, value):
        if value:
            # Validate phone number format: 09XXXXXXXX (10 digits starting with 09)
            pattern = r'^09\d{8}$'
            if not re.match(pattern, value):
                raise serializers.ValidationError(
                    "Phone number must be in 09XXXXXXXX format (e.g., 0912345678)."
                )
        return value

    def validate(self, data):
        # During creation, ensure required fields are not blank (only allergies and emergency_contact are optional)
        if not self.instance:  # Only for creation, not update
            required_fields = ['first_name', 'last_name', 'department', 'year_of_study', 'phone', 'dorm_number']
            for field in required_fields:
                value = data.get(field)
                if value is None or (isinstance(value, str) and value.strip() == ''):
                    raise serializers.ValidationError({
                        field: f"This field is required and cannot be blank."
                    })
        return data


class StudentDetailSerializer(serializers.ModelSerializer):
    visits = serializers.SerializerMethodField()
    referrals = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            'university_id',
            'first_name',
            'last_name',
            'gender',
            'department',
            'year_of_study',
            'phone',
            'photo',
            'emergency_contact',
            'university',
            'allergies',
            'dorm_number',
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