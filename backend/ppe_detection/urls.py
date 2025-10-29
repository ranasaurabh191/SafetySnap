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
    path('test-db/', views.test_db, name='test-db'),
    path('live-feed/', views.live_camera_feed, name='live-camera-feed'),
    path('process-frame-metrics/', views.process_frame_metrics, name='process-frame-metrics'),
    path('export-violations/', views.export_violations_csv, name='export-violations'),
    path('rtsp-camera-stream/', views.rtsp_camera_stream, name='rtsp-camera-stream'),
    # NEW: Video processing endpoints
    path('video/upload/', views.process_video, name='video-upload'),
    path('video/webcam/', views.webcam_stream, name='webcam-stream'),
    path('notifications/', views.get_notifications, name='get-notifications'),
    path('notifications/mark-read/<str:notification_id>/', views.mark_notification_read, name='mark-notification-read'),
    path('notifications/mark-all-read/', views.mark_all_notifications_read, name='mark-all-notifications-read'),
    path('process-frame/', views.process_frame_metrics, name='process-frame'),
    path('violation-stats/', views.violation_statistics, name='violation-stats'),
    path('export-violations/', views.export_violations_csv, name='export-violations'),
    path('live-feed/', views.live_camera_feed, name='live-feed'),
    path('process-frame-annotated/', views.process_frame_with_annotation, name='process-frame-annotated'),
    path('live-webcam-stream/', views.live_webcam_stream, name='live-webcam-stream'),   
    path('force-release-camera/', views.force_release_camera, name='force-release-camera'),
    path('stop-camera/', views.stop_camera, name='stop-camera'),
]