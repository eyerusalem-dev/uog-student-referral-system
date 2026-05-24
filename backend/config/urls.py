from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from apps.referrals.views import dashboard_stats

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/auth/', include('apps.users.auth_urls')),
    path('api/users/', include('apps.users.urls')),
    path('api/departments/', include('apps.departments.urls')),
    path('api/students/', include('apps.students.urls')),
    path('api/visits/', include('apps.visits.urls')),
    path('api/referrals/', include('apps.referrals.urls')),

    # Reports endpoint
    path('api/reports/dashboard/', dashboard_stats, name='dashboard-stats'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)