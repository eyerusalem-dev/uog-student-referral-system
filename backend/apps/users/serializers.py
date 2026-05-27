import re
from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


ETHIOPIAN_PHONE_REGEX = re.compile(r'^(\+2519\d{8}|2519\d{8})$')


class UserSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'password',
            'email',
            'first_name',
            'last_name',
            'phone',
            'role',
            'department',
            'department_name',
            'is_active',
        ]
        extra_kwargs = {
            'password': {'write_only': True, 'required': False}
        }

    def validate_phone(self, value):
        if value:
            if not ETHIOPIAN_PHONE_REGEX.match(value):
                raise serializers.ValidationError(
                    "Phone must be in Ethiopian international format: +2519XXXXXXXX or 2519XXXXXXXX"
                )
        return value

    def validate(self, attrs):
        role = attrs.get('role', getattr(self.instance, 'role', None))
        department = attrs.get('department', getattr(self.instance, 'department', None))

        if role == 'intake_team' and department is None:
            raise serializers.ValidationError(
                "Intake Team users must have a department."
            )

        if role != 'intake_team':
            attrs['department'] = None

        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        # Debug: Log the data being used to create the user
        print(f"[DEBUG] Creating user with data: {validated_data}")
        user = User(**validated_data)

        if password:
            user.set_password(password)

        user.save()
        print(f"[DEBUG] User created successfully: {user.username}, role={user.role}, id={user.id}")
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        # Debug: Log the updates being applied
        print(f"[DEBUG] Updating user {instance.username} (id={instance.id}) with data: {validated_data}")

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        print(f"[DEBUG] User updated successfully: {instance.username}, role={instance.role}")
        return instance
