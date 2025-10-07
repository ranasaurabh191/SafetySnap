from rest_framework import serializers
from .models import Detection, PersonDetection, Violation, PPEPolicy
from users.models import Site
from datetime import datetime, timedelta


class PPEPolicySerializer(serializers.ModelSerializer):
    """Serializer for PPE Policy"""
    required_items = serializers.SerializerMethodField()
    
    class Meta:
        model = PPEPolicy
        fields = [
            'id', 'name', 'description', 'zone_type', 'risk_level',
            'helmet_required', 'vest_required', 'boots_required',
            'gloves_required', 'glasses_required', 'mask_required',
            'harness_required', 'is_active', 'required_items'
        ]
    
    def get_required_items(self, obj):
        """Get list of required PPE items"""
        items = []
        if obj.helmet_required:
            items.append('helmet')
        if obj.vest_required:
            items.append('safety_vest')
        if obj.boots_required:
            items.append('safety_boots')
        if obj.gloves_required:
            items.append('gloves')
        if obj.glasses_required:
            items.append('safety_glasses')
        if obj.mask_required:
            items.append('face_mask')
        if obj.harness_required:
            items.append('harness')
        return items


class PersonDetectionSerializer(serializers.ModelSerializer):
    """Serializer for PersonDetection"""
    
    class Meta:
        model = PersonDetection
        fields = [
            'id', 'person_id', 'bbox_x1', 'bbox_y1', 'bbox_x2', 'bbox_y2',
            'confidence', 'is_compliant', 'missing_ppe',
            'helmet_detected', 'helmet_confidence',
            'vest_detected', 'vest_confidence',
            'boots_detected', 'boots_confidence',
            'gloves_detected', 'gloves_confidence',
            'glasses_detected', 'glasses_confidence',
            'mask_detected', 'mask_confidence',
            'harness_detected', 'harness_confidence',
        ]


class ViolationSerializer(serializers.ModelSerializer):
    """Serializer for Violation"""
    
    class Meta:
        model = Violation
        fields = [
            'id', 'violation_type', 'severity', 'status',
            'description', 'recommendation', 'osha_standard',
            'created_at', 'acknowledged_at', 'resolved_at',
        ]


class DetectionSerializer(serializers.ModelSerializer):
    """Full serializer for Detection with nested data"""
    person_detections = PersonDetectionSerializer(many=True, read_only=True)
    violations = ViolationSerializer(many=True, read_only=True)
    site_name = serializers.CharField(source='site.name', read_only=True, allow_null=True)
    policy_name = serializers.CharField(source='policy.name', read_only=True, allow_null=True)
    detected_at = serializers.DateTimeField(source='created_at', read_only=True)  # ✅ ADD THIS
    
    class Meta:
        model = Detection
        fields = [
            'id', 'user', 'site', 'site_name', 'policy', 'policy_name',
            'original_image', 'annotated_image', 'status', 'compliance_status',
            'total_persons_detected', 'compliant_persons', 'non_compliant_persons',
            'confidence_score', 'processing_time', 'notes',
            'location_lat', 'location_lng', 
            'created_at', 'detected_at', 'updated_at',  # ✅ ADD detected_at HERE
            'person_detections', 'violations'
        ]
    
    def get_num_persons(self, obj):
        """Return total persons detected"""
        return obj.total_persons_detected
    
    def get_num_violations(self, obj):
        """Return count of violations"""
        return obj.violations.count()
    
    def get_confidence(self, obj):
        """Return average confidence"""
        return obj.confidence_score
    
    def get_persons_data(self, obj):
        """Return person detection data"""
        persons = []
        for person_det in obj.person_detections.all():
            persons.append({
                'person_id': person_det.person_id,
                'bbox': [person_det.bbox_x1, person_det.bbox_y1, 
                        person_det.bbox_x2, person_det.bbox_y2],
                'confidence': person_det.confidence,
                'ppe': {
                    'helmet': {
                        'detected': person_det.helmet_detected,
                        'confidence': person_det.helmet_confidence
                    },
                    'safety_vest': {
                        'detected': person_det.vest_detected,
                        'confidence': person_det.vest_confidence
                    },
                    'safety_boots': {
                        'detected': person_det.boots_detected,
                        'confidence': person_det.boots_confidence
                    },
                    'gloves': {
                        'detected': person_det.gloves_detected,
                        'confidence': person_det.gloves_confidence
                    },
                    'safety_glasses': {
                        'detected': person_det.glasses_detected,
                        'confidence': person_det.glasses_confidence
                    },
                    'face_mask': {
                        'detected': person_det.mask_detected,
                        'confidence': person_det.mask_confidence
                    },
                    'harness': {
                        'detected': person_det.harness_detected,
                        'confidence': person_det.harness_confidence
                    }
                }
            })
        return persons
    
    def get_violations(self, obj):
        """Return violation data"""
        violations = []
        for violation in obj.violations.all():
            violations.append({
                'id': violation.id,
                'person_id': violation.person_detection.person_id if violation.person_detection else None,
                'violation_type': violation.violation_type,
                'severity': violation.severity,
                'description': violation.description,
                'recommendation': violation.recommendation
            })
        return violations
    
    def get_policy(self, obj):
        """Return policy data"""
        if obj.policy:
            return {
                'name': obj.policy.name,
                'requires_helmet': obj.policy.helmet_required,
                'requires_vest': obj.policy.vest_required
            }
        return {
            'name': 'Default Policy',
            'requires_helmet': True,
            'requires_vest': True
        }


class DetectionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a Detection"""
    
    class Meta:
        model = Detection
        fields = ['original_image', 'site', 'policy', 'location_lat', 'location_lng', 'notes']
    
    


class DetectionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for detection list view"""
    detected_at = serializers.DateTimeField(source='created_at', read_only=True)
    num_violations = serializers.SerializerMethodField()
    
    class Meta:
        model = Detection
        fields = [
            'id', 'original_image', 'annotated_image', 'detected_at',
            'total_persons_detected', 'num_violations', 'confidence_score',
            'processing_time', 'status', 'compliance_status'
        ]
    
    def get_num_violations(self, obj):
        """Return count of violations"""
        return obj.violations.count()


class DetectionDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer with all nested data for detail view"""
    person_detections = PersonDetectionSerializer(many=True, read_only=True)
    violations = ViolationSerializer(many=True, read_only=True)
    detected_at = serializers.DateTimeField(source='created_at', read_only=True)
    num_violations = serializers.SerializerMethodField()
    persons_data = serializers.SerializerMethodField()
    policy = serializers.SerializerMethodField()
    
    class Meta:
        model = Detection
        fields = [
            'id', 'original_image', 'annotated_image', 'detected_at',
            'total_persons_detected', 'compliant_persons', 'non_compliant_persons',
            'num_violations', 'confidence_score', 'processing_time',
            'persons_data', 'violations', 'policy', 'status', 'compliance_status',
            'location_lat', 'location_lng', 'notes'
        ]
    
    def get_num_violations(self, obj):
        """Return count of violations"""
        return obj.violations.count()
    
    def get_persons_data(self, obj):
        """Convert person_detections to frontend format"""
        persons = []
        for pd in obj.person_detections.all():
            persons.append({
                'person_id': pd.person_id,
                'bbox': [pd.bbox_x1, pd.bbox_y1, pd.bbox_x2, pd.bbox_y2],
                'confidence': pd.confidence,
                'ppe': {
                    'helmet': {
                        'detected': pd.helmet_detected, 
                        'confidence': pd.helmet_confidence
                    },
                    'safety_vest': {
                        'detected': pd.vest_detected, 
                        'confidence': pd.vest_confidence
                    },
                    'safety_boots': {
                        'detected': pd.boots_detected, 
                        'confidence': pd.boots_confidence
                    },
                    'gloves': {
                        'detected': pd.gloves_detected, 
                        'confidence': pd.gloves_confidence
                    },
                    'safety_glasses': {
                        'detected': pd.glasses_detected, 
                        'confidence': pd.glasses_confidence
                    },
                    'face_mask': {
                        'detected': pd.mask_detected, 
                        'confidence': pd.mask_confidence
                    },
                    'harness': {
                        'detected': pd.harness_detected, 
                        'confidence': pd.harness_confidence
                    }
                }
            })
        return persons
    
    def get_policy(self, obj):
        """Return policy info - hardcoded since we removed policy feature"""
        return {
            'name': 'Default Policy',
            'requires_helmet': True,
            'requires_vest': True,
            'requires_mask': True
        }


class SiteSerializer(serializers.ModelSerializer):
    """Serializer for Site"""
    
    class Meta:
        model = Site
        fields = ['id', 'name', 'location', 'description', 'is_active']


class NotificationSerializer(serializers.Serializer):
    """Serializer for notifications"""
    id = serializers.CharField()
    type = serializers.CharField()
    title = serializers.CharField()
    message = serializers.CharField()
    timestamp = serializers.DateTimeField()
    read = serializers.BooleanField()
    detection_id = serializers.UUIDField(required=False, allow_null=True)
    violation_id = serializers.IntegerField(required=False, allow_null=True)
