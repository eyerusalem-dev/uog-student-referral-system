"""
AuditLogger – thin utility used throughout the project to record events.

Usage:
    from apps.audit.logger import AuditLogger
    AuditLogger.log(
        action=ACTION_TYPES.REFERRAL_CREATED,
        resource_type=RESOURCE_TYPES.REFERRAL,
        resource_id=referral.referral_id,
        resource_repr=str(referral),
        request=request,           # optional – carries user/IP/agent
        before_state=None,
        after_state=serializer.data,
        extra={'reason': 'created by clinician'},
    )
"""
import logging

from .models import ACTION_TYPES, RESOURCE_TYPES, AuditLog

log = logging.getLogger(__name__)


def _get_client_ip(request):
    if request is None:
        return None
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


class AuditLogger:

    @staticmethod
    def log(
        action: str,
        resource_type: str,
        resource_id: str = '',
        resource_repr: str = '',
        request=None,
        actor=None,
        before_state=None,
        after_state=None,
        extra=None,
    ):
        """
        Non-blocking best-effort log.  Never raises; errors are swallowed
        so audit logging can never degrade primary API latency.
        """
        try:
            # Resolve actor from request if not supplied directly
            if actor is None and request is not None:
                actor = getattr(request, 'user', None)
                if actor and not actor.is_authenticated:
                    actor = None

            actor_username = ''
            actor_role = ''
            if actor:
                actor_username = getattr(actor, 'username', '') or ''
                actor_role     = getattr(actor, 'role', '') or ''

            AuditLog.objects.create(
                actor=actor,
                actor_username=actor_username,
                actor_role=actor_role,
                action=action,
                resource_type=resource_type,
                resource_id=str(resource_id),
                resource_repr=str(resource_repr)[:500],
                before_state=before_state,
                after_state=after_state,
                extra=extra,
                ip_address=_get_client_ip(request),
                user_agent=(request.META.get('HTTP_USER_AGENT', '')[:1024] if request else ''),
            )
        except Exception:
            log.exception("AuditLogger.log failed silently — primary request unaffected.")
