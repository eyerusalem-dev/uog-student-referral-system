from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display  = ('id', 'timestamp', 'actor_username', 'actor_role', 'action', 'resource_type', 'resource_id', 'ip_address')
    list_filter   = ('action', 'resource_type', 'actor_role')
    search_fields = ('actor_username', 'resource_repr', 'resource_id')
    readonly_fields = [f.name for f in AuditLog._meta.get_fields()]
    ordering = ('-timestamp',)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
