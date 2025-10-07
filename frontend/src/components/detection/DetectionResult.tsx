import { Detection } from '@/types';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { 
  Users, Clock, CheckCircle, XCircle, AlertTriangle, 
  Download, Share2, RotateCcw, User
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { formatDuration, getPPELabel, getPPEIcon } from '@/utils/helpers';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface DetectionResultProps {
  detection: Detection;
  onReanalyze?: () => void;
}

export const DetectionResult: React.FC<DetectionResultProps> = ({ detection, onReanalyze }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const getComplianceVariant = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'success';
      case 'partial':
        return 'warning';
      case 'non_compliant':
        return 'danger';
      default:
        return 'default';
    }
  };

  const handleDownload = () => {
    if (detection.annotated_image) {
      const link = document.createElement('a');
      link.href = `${API_BASE_URL}${detection.annotated_image}`;
      link.download = `detection_${detection.id}.jpg`;
      link.click();
    }
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '', 'height=800,width=1000');
    const content = `
      <html>
      <head>
        <title>Safety Report - Detection ${detection.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
          .stat-box { border: 2px solid #ddd; padding: 15px; text-align: center; }
          .violation { background: #fee; border-left: 4px solid #f00; padding: 10px; margin: 10px 0; }
          img { max-width: 100%; height: auto; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SafetySnap - PPE Compliance Report</h1>
          <p>Detection ID: ${detection.id}</p>
          <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="stats">
          <div class="stat-box">
            <h3>Total Persons</h3>
            <p style="font-size: 24px;">${detection.total_persons_detected}</p>
          </div>
          <div class="stat-box">
            <h3>Compliant</h3>
            <p style="font-size: 24px; color: green;">${detection.compliant_persons}</p>
          </div>
          <div class="stat-box">
            <h3>Non-Compliant</h3>
            <p style="font-size: 24px; color: red;">${detection.non_compliant_persons}</p>
          </div>
        </div>
        
        ${detection.annotated_image ? `
          <h2>Detection Image</h2>
          <img src="${API_BASE_URL}${detection.annotated_image}" alt="Detection Result" />
        ` : ''}
        
        <h2>Violations</h2>
        ${detection.violations && detection.violations.length > 0 ? 
          detection.violations.map(v => `
            <div class="violation">
              <h3>${v.violation_type} - ${v.severity.toUpperCase()}</h3>
              <p><strong>Description:</strong> ${v.description}</p>
              <p><strong>Recommendation:</strong> ${v.recommendation}</p>
              <p><strong>OSHA Standard:</strong> ${v.osha_standard}</p>
            </div>
          `).join('') 
          : '<p>No violations detected</p>'
        }
      </body>
      </html>
    `;
    
    printWindow?.document.write(content);
    printWindow?.document.close();
    printWindow?.print();
    toast.success('Report ready to print/save as PDF!');
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card padding="md" className="text-center border-l-4 border-orange-500"> {/* Changed */}
            <Users className="h-8 w-8 mx-auto text-orange-600 dark:text-orange-400 mb-2" /> {/* Changed */}
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{detection.total_persons_detected}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Persons Detected</div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card padding="md" className="text-center border-l-4 border-green-500">
            <CheckCircle className="h-8 w-8 mx-auto text-green-600 dark:text-green-400 mb-2" />
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{detection.compliant_persons}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Compliant</div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card padding="md" className="text-center border-l-4 border-red-500">
            <XCircle className="h-8 w-8 mx-auto text-red-600 dark:text-red-400 mb-2" />
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{detection.non_compliant_persons}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Non-Compliant</div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card padding="md" className="text-center border-l-4 border-gray-500">
            <Clock className="h-8 w-8 mx-auto text-gray-600 dark:text-gray-400 mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatDuration(detection.processing_time)}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Processing Time</div>
          </Card>
        </motion.div>
      </div>

      {/* Annotated Image */}
      {detection.annotated_image && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <Card padding="none">
            <div className="relative">
              <img
                src={`${API_BASE_URL}${detection.annotated_image}`}
                alt="Detection Result"
                className="w-full h-auto rounded-lg"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<Download className="h-4 w-4" />}
                  onClick={handleDownload}
                >
                  Download
                </Button>
                {onReanalyze && (
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<RotateCcw className="h-4 w-4" />}
                    onClick={onReanalyze}
                  >
                    Reanalyze
                  </Button>
                )}
              </div>
              <div className="absolute bottom-4 left-4">
                <Badge variant={getComplianceVariant(detection.compliance_status || 'default')} size="lg">
                  {detection.compliance_status?.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Individual Person Analysis */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card padding="lg" className="border-l-4 border-orange-500"> {/* Changed */}
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" /> {/* Changed */}
            Individual Analysis ({detection.person_detections?.length || 0} {detection.person_detections?.length === 1 ? 'Person' : 'Persons'})
          </h2>
          
          {!detection.person_detections || detection.person_detections.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No person detections found</p>
              <p className="text-sm mt-1">This may be due to processing issues or no persons in the image</p>
            </div>
          ) : (
            <div className="space-y-4">
              {detection.person_detections.map((person, idx) => (
                <motion.div
                  key={person.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + idx * 0.1 }}
                  className={`p-4 rounded-lg border-2 ${
                    person.is_compliant
                      ? 'border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-900/20'
                      : 'border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-900/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Person #{person.person_id}
                    </h3>
                    <Badge variant={person.is_compliant ? 'success' : 'danger'}>
                      {person.is_compliant ? 'Compliant' : 'Non-Compliant'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { name: 'Helmet', detected: person.helmet_detected, confidence: person.helmet_confidence },
                      { name: 'Safety Vest', detected: person.vest_detected, confidence: person.vest_confidence },
                      { name: 'Mask', detected: person.mask_detected, confidence: person.mask_confidence },
                    ].map((item) => (
                      <div
                        key={item.name}
                        className={`p-3 rounded text-center text-sm ${
                          item.detected
                            ? 'bg-green-100 dark:bg-green-800/30 text-green-800 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs mt-1">
                          {item.detected ? `✓ ${(item.confidence * 100).toFixed(0)}%` : '✗ Not detected'}
                        </div>
                      </div>
                    ))}
                  </div>

                  {!person.is_compliant && person.missing_ppe && person.missing_ppe.length > 0 && (
                    <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 rounded border border-red-300 dark:border-red-700">
                      <p className="text-sm font-medium text-red-800 dark:text-red-300">
                        Missing PPE: {person.missing_ppe.map(item => item.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ')}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Violations */}
      {detection.violations && detection.violations.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card padding="md" className="border-l-4 border-red-500">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-600 dark:text-red-400" />
              Violations ({detection.violations.length})
            </h3>
            <div className="space-y-3">
              {detection.violations.map((violation, idx) => (
                <motion.div
                  key={violation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + idx * 0.1 }}
                  className="p-4 border-2 border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-red-900 dark:text-red-300">{violation.violation_type}</h4>
                      <p className="text-sm text-red-700 dark:text-red-400">{violation.description}</p>
                    </div>
                    <Badge variant="danger" size="sm">
                      {violation.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                    <strong>Recommendation:</strong> {violation.recommendation}
                  </p>
                  <p className="text-xs text-red-500 dark:text-red-500 mt-1">
                    OSHA Standard: {violation.osha_standard}
                  </p>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};
