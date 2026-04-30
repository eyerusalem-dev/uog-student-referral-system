from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClinicalVisitViewSet

router = DefaultRouter()
router.register(r'', ClinicalVisitViewSet, basename='visits')

urlpatterns = [
    path('', include(router.urls)),
]