from django.db import models
from django.contrib.auth import get_user_model
from users.models import Site
from ppe_detection.models import Detection
import uuid

User = get_user_model()


class Report(models.Model):
    """Compliance and safety reports"""
    
    REPORT_TYPE_CHOICES = [
        ('daily', 'Daily Report'),
        ('weekly', 'Weekly Report'),
        ('monthly', 'Monthly Report'),
        ('incident', 'Incident Report'),
        ('custom', 'Custom Report'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=300)
    report_type = models.CharField(max_length=20, choices=REPORT_TYPE_CHOICES)
    
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='reports')
    generated_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='generated_reports')
    
    # Date range
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    
    # Detections included
    detections = models.ManyToManyField(Detection, related_name='reports')
    
    # Summary statistics
    total_detections = models.IntegerField(default=0)
    total_persons_scanned = models.IntegerField(default=0)
    compliant_count = models.IntegerField(default=0)
    violation_count = models.IntegerField(default=0)
    compliance_rate = models.FloatField(default=0.0)
    
    # Report data (JSON format for flexibility)
    report_data = models.JSONField(default=dict)
    
    # File output
    pdf_file = models.FileField(upload_to='reports/pdf/%Y/%m/', blank=True, null=True)
    excel_file = models.FileField(upload_to='reports/excel/%Y/%m/', blank=True, null=True)
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'reports'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.report_type}"
