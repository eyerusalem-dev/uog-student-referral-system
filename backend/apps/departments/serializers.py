from rest_framework import serializers
from .models import HospitalDepartment


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = HospitalDepartment
        fields = '__all__'