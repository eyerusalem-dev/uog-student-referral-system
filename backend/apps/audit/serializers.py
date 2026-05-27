from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    actor_display = serializers.SerializerMethodField()
    timestamp_utc = serializers.SerializerMethodField()
    action_display = serializers.SerializerMethodField()
    resource_display = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            'id',
            'timestamp',
            'timestamp_utc',
            'actor',
            'actor_username',
            'actor_role',
            'actor_display',
            'action',
            'action_display',
            'resource_type',
            'resource_display',
            'resource_id',
            'resource_repr',
            'before_state',
            'after_state',
            'extra',
            'ip_address',
            'user_agent',
        ]
        read_only_fields = fields  # everything is read-only

    def get_actor_display(self, obj):
        if obj.actor_username:
            return f"{obj.actor_username} ({obj.actor_role})"
        return 'System'

    def get_timestamp_utc(self, obj):
        """ISO-8601 with microsecond precision, always Z-terminated."""
        return obj.timestamp.strftime('%Y-%m-%dT%H:%M:%S.%f') + 'Z'

    def get_action_display(self, obj):
        return obj.get_action_display()

    def get_resource_display(self, obj):
        return obj.get_resource_type_display()
