from rest_framework.permissions import BasePermission


def has_role(user, role_name):
    return user and user.is_authenticated and getattr(user, 'role', None) == role_name


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return has_role(request.user, 'admin')


class IsClinicianRole(BasePermission):
    def has_permission(self, request, view):
        return has_role(request.user, 'clinician')


class IsDepartmentReceiverRole(BasePermission):
    def has_permission(self, request, view):
        return has_role(request.user, 'department_receiver')


class IsAdminOrClinician(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            getattr(request.user, 'role', None) in ['admin', 'clinician']
        )


class IsAdminOrDepartmentReceiver(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            getattr(request.user, 'role', None) in ['admin', 'department_receiver']
        )