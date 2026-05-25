from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReferralViewSet, students_referred_this_month

router = DefaultRouter()
router.register(r'', ReferralViewSet, basename='referrals')

urlpatterns = [
    path('', include(router.urls)),
    path('reports/students-this-month/', students_referred_this_month, name='students-referred-this-month'),
]