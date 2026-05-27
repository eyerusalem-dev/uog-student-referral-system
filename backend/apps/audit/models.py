from django.db import models
from django.conf import settings


class ACTION_TYPES(models.TextChoices):
    # Auth
    LOGIN          = 'LOGIN',          'Login'
    LOGOUT         = 'LOGOUT',         'Logout'
    LOGIN_FAILED   = 'LOGIN_FAILED',   'Login Failed'
    PASSWORD_CHANGE = 'PASSWORD_CHANGE', 'Password Change'

    # Users
    USER_CREATED   = 'USER_CREATED',   'User Created'
    USER_UPDATED   = 'USER_UPDATED',   'User Updated'
    USER_DELETED   = 'USER_DELETED',   'User Deleted'

    # Students
    STUDENT_CREATED = 'STUDENT_CREATED', 'Student Created'
    STUDENT_UPDATED = 'STUDENT_UPDATED', 'Student Updated'
    STUDENT_DELETED = 'STUDENT_DELETED', 'Student Deleted'

    # Referrals
    REFERRAL_CREATED   = 'REFERRAL_CREATED',   'Referral Created'
    REFERRAL_UPDATED   = 'REFERRAL_UPDATED',   'Referral Updated'
    REFERRAL_ACCEPTED  = 'REFERRAL_ACCEPTED',  'Referral Accepted'
    REFERRAL_DECLINED  = 'REFERRAL_DECLINED',  'Referral Declined'

    # Departments
    DEPT_CREATED = 'DEPT_CREATED', 'Department Created'
    DEPT_UPDATED = 'DEPT_UPDATED', 'Department Updated'
    DEPT_DELETED = 'DEPT_DELETED', 'Department Deleted'

    # Visits
    VISIT_CREATED  = 'VISIT_CREATED',  'Visit Created'
    VISIT_UPDATED  = 'VISIT_UPDATED',  'Visit Updated'

    # System
    DATA_EXPORT    = 'DATA_EXPORT',    'Data Export'
    SYSTEM_ERROR   = 'SYSTEM_ERROR',   'System Error'


class RESOURCE_TYPES(models.TextChoices):
    USER       = 'user',       'User'
    STUDENT    = 'student',    'Student'
    REFERRAL   = 'referral',   'Referral'
    DEPARTMENT = 'department', 'Department'
    VISIT      = 'visit',      'Visit'
    AUTH       = 'auth',       'Authentication'
    SYSTEM     = 'system',     'System'


class AuditLog(models.Model):
    """
    Append-only, immutable audit log.
    - Pre-save / pre-delete signals block any mutation after creation.
    - All timestamps stored in UTC with microsecond precision.
    """

    # ---------- Attribution ----------
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        db_index=True,
    )
    actor_username = models.CharField(max_length=150, blank=True)
    actor_role     = models.CharField(max_length=50, blank=True)

    # ---------- Event classification ----------
    action        = models.CharField(max_length=50, choices=ACTION_TYPES.choices, db_index=True)
    resource_type = models.CharField(max_length=50, choices=RESOURCE_TYPES.choices, db_index=True)
    resource_id   = models.CharField(max_length=255, blank=True)
    resource_repr = models.CharField(max_length=500, blank=True, help_text='Human-readable label of the affected object')

    # ---------- State diffs ----------
    before_state = models.JSONField(null=True, blank=True, help_text='Snapshot BEFORE the change')
    after_state  = models.JSONField(null=True, blank=True, help_text='Snapshot AFTER the change')
    extra        = models.JSONField(null=True, blank=True, help_text='Extra structured metadata')

    # ---------- Request context ----------
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    # ---------- Timestamps (UTC, microsecond precision) ----------
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['actor']),
            models.Index(fields=['action']),
            models.Index(fields=['resource_type']),
            models.Index(fields=['actor', 'timestamp']),
            models.Index(fields=['resource_type', 'action']),
        ]
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'

    def __str__(self):
        return f"[{self.timestamp:%Y-%m-%d %H:%M:%S UTC}] {self.actor_username} → {self.action} {self.resource_type}/{self.resource_id}"

    def save(self, *args, **kwargs):
        """Allow only INSERT; block all updates."""
        if self.pk:
            raise PermissionError("Audit logs are immutable and cannot be updated.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """Block all deletes."""
        raise PermissionError("Audit logs are append-only and cannot be deleted.")
