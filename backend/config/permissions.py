from rest_framework.permissions import BasePermission

def has_role(user, role_name):
    return user and user.is_authenticated and getattr(user, 'role', None) == role_name

class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return has_role(request.user, 'admin')

class IsClinicianRole(BasePermission):
    def has_permission(self, request, view):
        return has_role(request.user, 'clinician')

class IsIntakeTeamRole(BasePermission):
    def has_permission(self, request, view):
        return has_role(request.user, 'intake_team')

class IsLabTechnicianRole(BasePermission):
    def has_permission(self, request, view):
        return has_role(request.user, 'lab_technician')

class IsPharmacistRole(BasePermission):
    def has_permission(self, request, view):
        return has_role(request.user, 'pharmacist')

class IsAdminOrClinician(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            getattr(request.user, 'role', None) in ['admin', 'clinician']
        )

class IsAdminOrIntakeTeam(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            getattr(request.user, 'role', None) in ['admin', 'intake_team']
        )