from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import HospitalDepartment

User = get_user_model()

class IntakeTeamMemberSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'phone', 'department_name']

class DepartmentSerializer(serializers.ModelSerializer):
    intake_team_members = serializers.SerializerMethodField()

    class Meta:
        model = HospitalDepartment
        fields = ['id', 'name', 'building_location', 'description', 'is_active', 'intake_team_members']

    def get_intake_team_members(self, obj):
        intake_users = User.objects.filter(role='intake_team', department=obj, is_active=True)
        return IntakeTeamMemberSerializer(intake_users, many=True).data