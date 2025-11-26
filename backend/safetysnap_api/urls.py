
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib import admin
from django.urls import path, include, re_path  
from django.views.static import serve 
from ppe_detection.views import health_check


@api_view(['GET'])
def api_root(request):
    """API root endpoint"""
    return Response({
        'message': 'SafetySnap API',
        'version': '1.0',
        'endpoints': {
            'auth': '/api/auth/',
            'ppe': '/api/ppe/',
            'admin': '/admin/',
        }
    })
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api_root, name='api-root'),
    path('api/auth/', include('users.urls')),
    path('api/ppe/', include('ppe_detection.urls')),
    path('api/health/', health_check, name='health_check'),
    
]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', serve, {
            'document_root': settings.MEDIA_ROOT,
        }),
    ]
