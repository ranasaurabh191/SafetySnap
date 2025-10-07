from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'detections', views.DetectionViewSet, basename='detection')
router.register(r'violations', views.ViolationViewSet, basename='violation')
router.register(r'policies', views.PPEPolicyViewSet, basename='policy')

urlpatterns = [
    path('', include(router.urls)),
    path('notifications/', views.get_notifications, name='notifications'),
    path('notifications/<str:notification_id>/read/', views.mark_notification_read, name='mark-read'),
    
    # NEW: Video processing endpoints
    path('video/upload/', views.process_video, name='video-upload'),
    path('video/webcam/', views.webcam_stream, name='webcam-stream'),
    path('notifications/', views.get_notifications, name='get-notifications'),
    path('notifications/mark-read/<str:notification_id>/', views.mark_notification_read, name='mark-notification-read'),
    path('notifications/mark-all-read/', views.mark_all_notifications_read, name='mark-all-notifications-read'),
]
