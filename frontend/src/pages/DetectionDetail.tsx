import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { detectionAPI } from '@/services/api';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { 
  ArrowLeft, 
  Users, 
  Clock, 
  MapPin, 
  Calendar,
  User,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Award
} from 'lucide-react';

export const DetectionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const { data: detection, isLoading, error } = useQuery({
    queryKey: ['detection', id],
    queryFn: () => detectionAPI.getById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !detection) {
    return (
      <div className="space-y-4">
        <Button onClick={() => navigate('/detections')} variant="secondary">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Detections
        </Button>
        <Card padding="lg">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Detection Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400">
              The detection you're looking for doesn't exist or has been deleted.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button onClick={() => navigate('/detections')} variant="secondary">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Badge
          variant={ 
            detection.compliance_status === 'compliant'
              ? 'success'
              : detection.compliance_status === 'partial'
              ? 'warning'
              : 'danger'
          }
          size="lg"
        >
          {detection.compliance_status?.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card padding="md" className="border-l-4 border-orange-500">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">Original Image</h2>
          {detection.original_image ? (
            <div className="h-56 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden bg-gray-100 dark:bg-gray-800">
              <img
                src={detection.original_image.startsWith('http') 
                  ? detection.original_image 
                  : `${API_BASE_URL}${detection.original_image}`}
                alt="Original"
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="h-56 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-500 text-sm">
              No original image available
            </div>
          )}
        </Card>

        <Card padding="md" className="border-l-4 border-orange-500">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">Detection Results</h2>
          {detection.annotated_image ? (
            <div className="h-56 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden bg-gray-100 dark:bg-gray-800">
              <img
                src={detection.annotated_image.startsWith('http') 
                  ? detection.annotated_image 
                  : `${API_BASE_URL}${detection.annotated_image}`}
                alt="Annotated"
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="h-56 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-500 text-sm">
              No detection results available
            </div>
          )}
          
          <div className="mt-4 p-5 dark:bg-gray-800  rounded-lg">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Color Legends:</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-gray-700 text-md dark:text-gray-300">PPE ✓</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-gray-700 text-md dark:text-gray-300">PPE ✗</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span className="text-gray-700 text-md dark:text-gray-300">Person</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <span className="text-gray-700 text-md dark:text-gray-300">Vehicle</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card padding="md" className="border-l-4 border-orange-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 ">Total Persons</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {detection.total_persons_detected}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Compliant</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {detection.compliant_persons}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Non-Compliant</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {detection.non_compliant_persons}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Processing Time</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {detection.processing_time?.toFixed(2)}s
                </p>
              </div>
            </div>
          </Card>

          <Card padding="md" className="border-l-4 border-orange-500">
            <h3 className="text-md font-bold text-gray-900 dark:text-white mb-3">Detection Info</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400 text-sm">Detected at:</span>
                <span className="text-gray-900 dark:text-white font-medium text-[14px]">
                  {new Date(detection.created_at).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400 text-sm">Confidence:</span>
                <span className="text-gray-900 dark:text-white font-medium text-[14px]">
                  {(detection.confidence_score * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400 text-sm">Policy:</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {detection.policy_name || 'Default'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  {/* Individual Analysis */}
  <Card padding="md" className="border-l-4 border-orange-500">
    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
      <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
      Individual Analysis ({detection.person_detections?.length || 0})
    </h2>

    {!detection.person_detections || detection.person_detections.length === 0 ? (
      <div className="text-center py-6 text-gray-500 dark:text-gray-400">
        <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No person detections found</p>
      </div>
    ) : (
      <div className="space-y-3">
        {detection.person_detections.map((person) => (
          <div
            key={person.id}
            className={`p-3 rounded-lg border ${
              person.is_compliant
                ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20'
                : 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/20'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="h-4 w-4" />
                Person #{person.person_id}
              </h3>
              <Badge variant={person.is_compliant ? 'success' : 'danger'} size="sm">
                {person.is_compliant ? '✓' : '✗'}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { name: 'Helmet', detected: person.helmet_detected, confidence: person.helmet_confidence },
                { name: 'Vest', detected: person.vest_detected, confidence: person.vest_confidence },                    
                { name: 'Mask', detected: person.mask_detected, confidence: person.mask_confidence },
              ].map((item) => (
                <div
                  key={item.name}
                  className={` rounded text-center ${
                    item.detected
                      ? 'bg-green-100 dark:bg-green-800/30 text-green-800 dark:text-green-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <div className="text-lg font-bold">{item.name}</div>
                  <div className="text-md ">
                    {item.detected ? `✓ ${(item.confidence * 100).toFixed(0)}%` : '✗'}
                  </div>
                </div>
              ))}
            </div>

            {!person.is_compliant && person.missing_ppe && person.missing_ppe.length > 0 && (
              <div className="mt-2 p-1 bg-red-100 dark:bg-red-900 rounded border border-red-300 dark:border-red-700">
                <p className="text-md  font-medium text-red-800 dark:text-red-300">
                  Missing: {person.missing_ppe.map((item) => item.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())).join(', ')}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </Card>

  {/* Violations */}
  {detection.violations && detection.violations.length > 0 ? (
    <Card padding="md" className="border-l-4 border-red-500">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
        Violations ({detection.violations.length})
      </h2>
      <div className="space-y-5">
        {detection.violations.map((violation) => (
          <div
            key={violation.id}
            className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-md font-semibold text-red-900 dark:text-red-300">
                {violation.violation_type}
              </h3>
              <Badge
                variant={violation.severity === 'critical' ? 'danger' : violation.severity === 'high' ? 'warning' : 'default'}
                size="md"
              >
                {violation.severity}
              </Badge>
            </div>
            <p className="text-md font-smibold text-gray-700 dark:text-gray-300 mb-3">{violation.description}</p>
            {violation.recommendation && (
              <p className="text-md text-gray-600 text-centre font-bold dark:text-gray-400 italic">
                **{violation.recommendation}**
              </p>
            )}
          </div>
        ))}
      </div>
    </Card>
  ) : (
    <Card padding="md" className="border-l-4 border-green-500">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
        Violations
      </h2>
      <div className="text-center py-6 text-gray-500 dark:text-gray-400">
        <CheckCircle className="h-10 w-10 mx-auto mb-2 text-green-500 opacity-50" />
        <p className="text-sm">No violations detected</p>
      </div>
    </Card>
  )}
</div>

    </div>
  );
};
