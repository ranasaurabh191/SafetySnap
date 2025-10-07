from django.db import models
from users.models import Site
from django.contrib.auth import get_user_model

User = get_user_model()


class ComplianceMetrics(models.Model):
    """Daily compliance metrics aggregation"""
    
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='metrics')
    date = models.DateField()
    
    total_scans = models.IntegerField(default=0)
    total_persons = models.IntegerField(default=0)
    compliant_persons = models.IntegerField(default=0)
    non_compliant_persons = models.IntegerField(default=0)
    
    helmet_violations = models.IntegerField(default=0)
    vest_violations = models.IntegerField(default=0)
    boots_violations = models.IntegerField(default=0)
    gloves_violations = models.IntegerField(default=0)
    glasses_violations = models.IntegerField(default=0)
    
    compliance_rate = models.FloatField(default=0.0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'compliance_metrics'
        unique_together = ['site', 'date']
        ordering = ['-date']
        indexes = [
            models.Index(fields=['site', '-date']),
        ]
    
    def __str__(self):
        return f"{self.site.name} - {self.date}"
