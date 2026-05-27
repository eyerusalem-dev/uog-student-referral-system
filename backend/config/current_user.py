"""
Thread-local middleware that stores the current request object so it can be
accessed anywhere without passing it through the call stack.
Used by the audit logger to retrieve the acting user/IP from signals.
"""
import threading

_local = threading.local()


def get_current_request():
    return getattr(_local, 'request', None)


def get_current_user():
    req = get_current_request()
    if req is None:
        return None
    user = getattr(req, 'user', None)
    if user and user.is_authenticated:
        return user
    return None


class CurrentUserMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _local.request = request
        try:
            response = self.get_response(request)
        finally:
            _local.request = None
        return response
