from django.db import models
from django.contrib.auth import get_user_model
from users.models import Site
import uuid

User = get_user_model()


class PPEPolicy(models.Model):
    """PPE requirement policies for different zones/tasks"""
    
    ZONE_CHOICES = [
        ('construction', 'Construction Zone'),
        ('welding', 'Welding Area'),
        ('electrical', 'Electrical Work'),
        ('height', 'Height Work'),
        ('confined', 'Confined Space'),
        ('general', 'General Area'),
    ]
    
    RISK_LEVEL = [
        ('high', 'High Risk'),
        ('medium', 'Medium Risk'),
        ('low', 'Low Risk'),
    ]
    
    name = models.CharField(max_length=200)
    zone_type = models.CharField(max_length=50, choices=ZONE_CHOICES)
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='policies', null=True, blank=True)
    risk_level = models.CharField(max_length=20, choices=RISK_LEVEL, default='medium')
    
    # Required PPE items
    helmet_required = models.BooleanField(default=True)
    vest_required = models.BooleanField(default=True)
    boots_required = models.BooleanField(default=True)
    gloves_required = models.BooleanField(default=False)
    glasses_required = models.BooleanField(default=False)
    mask_required = models.BooleanField(default=False)
    harness_required = models.BooleanField(default=False)
    
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ppe_policies'
        verbose_name_plural = 'PPE Policies'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.zone_type}"
    
    def get_required_items(self):
        """Return list of required PPE items"""
        items = []
        if self.helmet_required: items.append('helmet')
        if self.vest_required: items.append('safety_vest')
        if self.boots_required: items.append('safety_boots')
        if self.gloves_required: items.append('gloves')
        if self.glasses_required: items.append('safety_glasses')
        if self.mask_required: items.append('face_mask')
        if self.harness_required: items.append('harness')
        return items


class Detection(models.Model):
    """Main detection record for uploaded images/videos"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    COMPLIANCE_STATUS = [
        ('compliant', 'Fully Compliant'),
        ('partial', 'Partially Compliant'),
        ('non_compliant', 'Non-Compliant'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='detections')
    site = models.ForeignKey(Site, on_delete=models.SET_NULL, null=True, blank=True, related_name='detections')
    policy = models.ForeignKey(PPEPolicy, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Image/Video details
    original_image = models.ImageField(upload_to='uploads/%Y/%m/%d/')
    annotated_image = models.ImageField(upload_to='results/%Y/%m/%d/', blank=True, null=True)
    is_video = models.BooleanField(default=False)
    
    # Detection results
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    compliance_status = models.CharField(max_length=20, choices=COMPLIANCE_STATUS, null=True, blank=True)
    
    # Metrics
    total_persons_detected = models.IntegerField(default=0)
    compliant_persons = models.IntegerField(default=0)
    non_compliant_persons = models.IntegerField(default=0)
    confidence_score = models.FloatField(default=0.0)
    processing_time = models.FloatField(default=0.0, help_text='Processing time in seconds')
    
    # Additional info
    notes = models.TextField(blank=True)
    location_lat = models.FloatField(null=True, blank=True)
    location_lng = models.FloatField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'detections'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['site', '-created_at']),
        ]
    
    def __str__(self):
        return f"Detection {self.id} - {self.status}"
    
    def calculate_compliance_status(self):
        """Calculate overall compliance status"""
        if self.total_persons_detected == 0:
            return 'compliant'
        
        compliance_rate = (self.compliant_persons / self.total_persons_detected) * 100
        
        if compliance_rate == 100:
            return 'compliant'
        elif compliance_rate >= 50:
            return 'partial'
        else:
            return 'non_compliant'


class PersonDetection(models.Model):
    """Person detection within an image"""
    detection = models.ForeignKey(
        Detection, 
        on_delete=models.CASCADE,
        related_name='person_detections'  # ADD THIS!
    )
    person_id = models.IntegerField(help_text="Person number in the image")
    
    # Bounding box coordinates
    bbox_x1 = models.FloatField()
    bbox_y1 = models.FloatField()
    bbox_x2 = models.FloatField()
    bbox_y2 = models.FloatField()
    
    confidence = models.FloatField(default=0.0)
    
    # PPE Detection Results
    helmet_detected = models.BooleanField(default=False)
    helmet_confidence = models.FloatField(default=0.0)
    
    vest_detected = models.BooleanField(default=False)
    vest_confidence = models.FloatField(default=0.0)
    
    boots_detected = models.BooleanField(default=False)
    boots_confidence = models.FloatField(default=0.0)
    
    gloves_detected = models.BooleanField(default=False)
    gloves_confidence = models.FloatField(default=0.0)
    
    glasses_detected = models.BooleanField(default=False)
    glasses_confidence = models.FloatField(default=0.0)
    
    mask_detected = models.BooleanField(default=False)
    mask_confidence = models.FloatField(default=0.0)
    
    harness_detected = models.BooleanField(default=False)
    harness_confidence = models.FloatField(default=0.0)
    
    # Compliance
    is_compliant = models.BooleanField(default=False)
    missing_ppe = models.JSONField(default=list, blank=True)
    
    class Meta:
        ordering = ['person_id']
        unique_together = ['detection', 'person_id']
    
    def __str__(self):
        return f"Person {self.person_id} in Detection {self.detection.id}"


class Violation(models.Model):
    """PPE violation records"""
    
    SEVERITY_CHOICES = [
        ('critical', 'Critical'),
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]
    
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('acknowledged', 'Acknowledged'),
        ('resolved', 'Resolved'),
        ('dismissed', 'Dismissed'),
    ]
    
    detection = models.ForeignKey(
        Detection, 
        on_delete=models.CASCADE,
        related_name='violations'  # Should already be here
    )
    person_detection = models.ForeignKey(
        PersonDetection,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='violations'  # ADD THIS TOO!
    )  
    violation_type = models.CharField(max_length=100)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    
    description = models.TextField()
    recommendation = models.TextField(blank=True)
    osha_standard = models.CharField(max_length=100, blank=True)
    
    acknowledged_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='acknowledged_violations')
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'violations'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['severity', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.violation_type} - {self.severity}"
class Notification(models.Model):
    """Store user notifications"""
    NOTIFICATION_TYPES = [
        ('success', 'Success'),
        ('warning', 'Warning'),
        ('danger', 'Danger'),
        ('info', 'Info'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    read = models.BooleanField(default=False)
    detection = models.ForeignKey('Detection', on_delete=models.CASCADE, null=True, blank=True)
    violation = models.ForeignKey('Violation', on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
