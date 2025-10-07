import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Detection } from '@/types';
import { formatRelativeTime, getComplianceColor } from '@/utils/helpers';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, Users, Clock } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { FileQuestion } from 'lucide-react';

interface RecentDetectionsProps {
  detections: Detection[];
}

export const RecentDetections: React.FC<RecentDetectionsProps> = ({ detections }) => {
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  if (detections.length === 0) {
    return (
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Recent Detections</h3>
        <EmptyState
          icon={FileQuestion}
          title="No detections yet"
          description="Upload your first safety image to start detecting PPE compliance"
          action={{
            label: 'Upload Image',
            onClick: () => navigate('/upload'),
          }}
        />
      </Card>
    );
  }

  return (
    <Card padding="lg" className="border-l-4 border-orange-500"> {/* Added orange border */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Detections</h3>
        <button
          onClick={() => navigate('/detections')}
          className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium" // Changed to orange
        >
          View All →
        </button>
      </div>
      <div className="space-y-4">
        {detections.map((detection, idx) => (
          <motion.div
            key={detection.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ scale: 1.02, x: 4 }} // Added hover animation
            onClick={() => navigate(`/detections/${detection.id}`)}
            className="flex items-center gap-4 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-orange-400 dark:hover:border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all cursor-pointer" // Changed to orange
          >
            {detection.annotated_image ? (
              <div className="relative">
                <img
                  src={detection.original_image.startsWith('http') 
                    ? detection.original_image 
                    : `${API_BASE_URL}${detection.original_image}`}
                  alt="Detection"
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 rounded-lg transition-colors" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <Eye className="h-8 w-8 text-gray-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={detection.compliance_status === 'compliant' ? 'success' : detection.compliance_status === 'partial' ? 'warning' : 'danger'}>
                  {detection.compliance_status?.replace('_', ' ')}
                </Badge>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatRelativeTime(detection.created_at)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" /> {/* Changed to orange */}
                  <span>{detection.total_persons_detected} persons</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" /> {/* Changed to orange */}
                  <span>{detection.processing_time.toFixed(2)}s</span>
                </div>
              </div>
              {detection.site_name && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Site: {detection.site_name}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
};
