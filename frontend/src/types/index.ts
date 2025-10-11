export interface PersonDetection {
  id: number;
  person_id: string;
  compliance_status: 'compliant' | 'partial' | 'non_compliant';
  missing_ppe: string[];
  detected_ppe: string[];
  confidence: number;
}

export interface Detection {
  id: number;
  original_image: string;
  annotated_image: string;
  detection_count: number;
  compliant_persons: number;
  non_compliant_persons: number;
  partial_compliant_persons: number;
  num_violations: number;
  total_violations: number;
  compliance_rate: number;
  created_at: string;
  person_detections?: PersonDetection[];  // Add this
} 

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'supervisor' | 'worker' | 'viewer';
  phone?: string;
  profile_image?: string;
  site_id?: string;
}

export interface Site {
  id: number;
  name: string;
  location: string;
  description: string;
  manager: number;
  manager_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PPEPolicy {
  id: number;
  name: string;
  zone_type: 'construction' | 'welding' | 'electrical' | 'height' | 'confined' | 'general';
  site?: number;
  risk_level: 'high' | 'medium' | 'low';
  helmet_required: boolean;
  vest_required: boolean;
  boots_required: boolean;
  gloves_required: boolean;
  glasses_required: boolean;
  mask_required: boolean;
  harness_required: boolean;
  description: string;
  is_active: boolean;
  required_items?: string[];
  created_at: string;
  updated_at: string;
}

export interface PPEDetectionInfo {
  detected: boolean;
  confidence: number;
}

export interface PersonPPE {
  helmet: PPEDetectionInfo;
  safety_vest: PPEDetectionInfo;
  safety_boots: PPEDetectionInfo;
  gloves: PPEDetectionInfo;
  safety_glasses: PPEDetectionInfo;
  face_mask: PPEDetectionInfo;
  harness: PPEDetectionInfo;
}

export interface PersonDetection {
  id: number;
  person_id: number;
  bbox_x1: number;
  bbox_y1: number;
  bbox_x2: number;
  bbox_y2: number;
  confidence: number;
  helmet_detected: boolean;
  helmet_confidence: number;
  vest_detected: boolean;
  vest_confidence: number;
  boots_detected: boolean;
  boots_confidence: number;
  gloves_detected: boolean;
  gloves_confidence: number;
  glasses_detected: boolean;
  glasses_confidence: number;
  mask_detected: boolean;
  mask_confidence: number;
  harness_detected: boolean;
  harness_confidence: number;
  is_compliant: boolean;
  missing_ppe: string[];
  created_at: string;
}

export interface Violation {
  id: number;
  detection: string;
  person_detection: PersonDetection;
  violation_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'acknowledged' | 'resolved' | 'dismissed';
  description: string;
  recommendation: string;
  osha_standard: string;
  acknowledged_by?: number;
  acknowledged_at?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Detection {
  id: string;
  user: number;
  user_name: string;
  site?: number;
  site_name?: string;
  policy?: number;
  policy_name?: string;
  original_image: string;
  annotated_image?: string;
  is_video: boolean;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  compliance_status?: 'compliant' | 'partial' | 'non_compliant';
  total_persons_detected: number;
  compliant_persons: number;
  non_compliant_persons: number;
  confidence_score: number;
  processing_time: number;
  notes: string;
  location_lat?: number;
  location_lng?: number;
  persons: PersonDetection[];
  violations: Violation[];
  created_at: string;
  updated_at: string;
}

export interface DetectionStats {
  total_detections: number;
  total_persons_scanned: number;
  total_violations: number;
  compliant: number;
  partial_compliant: number;
  non_compliant: number;
  compliance_rate: number;
}

export interface UploadData {
  original_image: File;
  site?: number;
  policy?: number;
  notes?: string;
  location_lat?: number;
  location_lng?: number;
}
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name?: string;
  last_name?: string;
  role?: 'admin' | 'supervisor' | 'worker' | 'viewer';
  phone?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}
