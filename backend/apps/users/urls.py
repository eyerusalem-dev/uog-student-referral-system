from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, AdminForcePasswordChangeView

router = DefaultRouter()
router.register(r'', UserViewSet, basename='users')

urlpatterns = [
    path('', include(router.urls)),
    path('<int:user_id>/force-password-change/', AdminForcePasswordChangeView.as_view(), name='admin-force-password-change'),
]