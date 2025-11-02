"""
URL configuration for safetysnap_api project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib import admin
from django.urls import path, include, re_path  # Add re_path here  
from django.views.static import serve  # Add this import
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

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    # Fallback for media files
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', serve, {
            'document_root': settings.MEDIA_ROOT,
        }),
    ]
