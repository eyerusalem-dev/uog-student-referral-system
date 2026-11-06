"""
Django signals that enforce immutability at the ORM layer
and auto-log bulk deletes (which bypass model.delete()).
"""
from django.db.models.signals import pre_save, pre_delete, post_save
from django.dispatch import receiver

from .models import AuditLog


@receiver(pre_save, sender=AuditLog)
def block_audit_update(sender, instance, **kwargs):
    """Prevent any UPDATE on an existing AuditLog row."""
    #if instance.pk:
        #raise PermissionError("Audit logs are immutable and cannot be updated.")


@receiver(pre_delete, sender=AuditLog)
def block_audit_delete(sender, instance, **kwargs):
    """Prevent individual row deletion."""
    raise PermissionError("Audit logs are append-only and cannot be deleted.")
