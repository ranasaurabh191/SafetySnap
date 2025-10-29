import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  FileSearch, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  Calendar,
  Trash2,
  Users,
  AlertTriangle,
  Award,
  CheckSquare,
  Square
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PageTransition } from '@/components/common/PageTransition';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface Detection {
  id: string;
  original_image: string;
  annotated_image: string;
  detected_at?: string;
  created_at?: string;
  num_persons?: number;
  total_persons_detected?: number;
  num_violations?: number;
  total_violations?: number;
  compliant_persons?: number;
  non_compliant_persons?: number;
  confidence?: number;
  confidence_score?: number;
  processing_time?: number;
}

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Date unavailable';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return 'Date unavailable';
  }
};

export const Detections = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const { data: detections, isLoading } = useQuery<Detection[]>({
    queryKey: ['detections'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/ppe/detections/`, {
        headers: { Authorization: `Token ${token}` }
      });
      return response.data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_BASE_URL}/api/ppe/detections/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['detections'] });
      queryClient.invalidateQueries({ queryKey: ['detection-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-detections'] });
      toast.success('Detection deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete detection');
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const token = localStorage.getItem('token');
      await Promise.all(
        ids.map(id => 
          axios.delete(`${API_BASE_URL}/api/ppe/detections/${id}/`, {
            headers: { Authorization: `Token ${token}` }
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['detections'] });
      queryClient.invalidateQueries({ queryKey: ['detection-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-detections'] });
      setSelectedIds([]);
      setIsSelectionMode(false);
      toast.success('Selected detections deleted successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to delete some detections');
    }
  });

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this detection? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {
      toast.error('No detections selected');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} detection(s)? This action cannot be undone.`)) {
      bulkDeleteMutation.mutate(selectedIds);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === detections?.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(detections?.map(d => d.id) || []);
    }
  };

  const handleCardClick = (id: string) => {
    if (isSelectionMode) {
      toggleSelection(id);
    } else {
      navigate(`/detections/${id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-4 sm:space-y-6">
        {/* ✅ Responsive Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Detection History
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              {detections?.length || 0} total detections
              {isSelectionMode && selectedIds.length > 0 && (
                <span className="ml-2 text-orange-600 dark:text-orange-400">
                  ({selectedIds.length} selected)
                </span>
              )}
            </p>
          </div>
          
          {/* ✅ Responsive Action Buttons */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {isSelectionMode ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsSelectionMode(false);
                    setSelectedIds([]);
                  }}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  onClick={toggleSelectAll}
                  className="flex-1 sm:flex-none"
                >
                  <CheckSquare className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">
                    {selectedIds.length === detections?.length ? 'Deselect All' : 'Select All'}
                  </span>
                  <span className="sm:hidden">
                    {selectedIds.length === detections?.length ? 'None' : 'All'}
                  </span>
                </Button>
                <Button
                  variant="danger"
                  onClick={handleBulkDelete}
                  disabled={selectedIds.length === 0 || bulkDeleteMutation.isPending}
                  className="flex-1 sm:flex-none"
                >
                  <Trash2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Delete Selected ({selectedIds.length})</span>
                  <span className="sm:hidden">Delete ({selectedIds.length})</span>
                </Button>
              </>
            ) : (
              <>
                {detections && detections.length > 0 && (
                  <Button
                    variant="secondary"
                    onClick={() => setIsSelectionMode(true)}
                    className="flex-1 sm:flex-none"
                  >
                    <CheckSquare className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Select</span>
                  </Button>
                )}
                <Button 
                  onClick={() => navigate('/upload')}
                  className="flex-1 sm:flex-none"
                >
                  <FileSearch className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">New Detection</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* ✅ Empty State */}
        {detections && detections.length === 0 ? (
          <Card padding="lg">
            <div className="text-center py-8 sm:py-12">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileSearch className="h-8 w-8 sm:h-10 sm:w-10 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
                No detections yet
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
                Upload your first image to start detecting PPE compliance
              </p>
              <Button onClick={() => navigate('/upload')}>
                Get Started
              </Button>
            </div>
          </Card>
        ) : (
          /* ✅ Responsive Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
            {detections?.map((detection) => {
              const numPersons = detection.num_persons || detection.total_persons_detected || 0;
              const nonCompliantPersons = detection.non_compliant_persons || 0;
              const compliantPersons = detection.compliant_persons || 0;
              const numViolations = detection.num_violations || detection.total_violations || 0;
              
              const isCompliant = nonCompliantPersons === 0 && numPersons > 0;
              const isSelected = selectedIds.includes(detection.id);
              
              const confidence = detection.confidence || detection.confidence_score || 0;
              const detectedDate = detection.detected_at || detection.created_at || '';

              return (
                <Card 
                  key={detection.id} 
                  padding="none" 
                  className={`overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2 ${
                    isSelected 
                      ? 'border-orange-500 dark:border-orange-500 ring-2 ring-orange-300 dark:ring-orange-700' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-600'
                  }`}
                  onClick={() => handleCardClick(detection.id)}
                >
                  {/* ✅ Responsive Image Container */}
                  <div className="relative h-48 sm:h-56 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                    {detection.annotated_image ? (
                      <img
                        src={
                          detection.annotated_image.startsWith('http') 
                            ? detection.annotated_image 
                            : `${API_BASE_URL}${detection.annotated_image}`
                        }
                        alt="Detection"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <FileSearch className="h-12 w-12 sm:h-16 sm:w-16" />
                      </div>
                    )}
                    
                    {/* Selection checkbox */}
                    {isSelectionMode && (
                      <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelection(detection.id);
                          }}
                          className="p-1.5 sm:p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg transition-all hover:scale-110"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                          ) : (
                            <Square className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-400" />
                          )}
                        </button>
                      </div>
                    )}
                    
                    {/* Delete button */}
                    {!isSelectionMode && (
                      <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                        <button
                          onClick={(e) => handleDelete(e, detection.id)}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 sm:p-2 bg-red-600/90 backdrop-blur-sm hover:bg-red-700 text-white rounded-full transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete detection"
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ✅ Responsive Card Content */}
                  <div className="p-5 sm:p-2 space-y-3 sm:space-y-4 bg-white dark:bg-gray-800">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      <div className="text-center p-2 sm:p-3 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg sm:rounded-xl border border-orange-200 dark:border-orange-800">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400 mx-auto " />
                        <div className="text-lg sm:text-xl font-bold text-orange-700 dark:text-orange-400">
                          {numPersons}
                        </div>
                        <div className="text-[9px] sm:text-[10px] text-orange-600 dark:text-orange-500 font-medium">Workers</div>
                      </div>
                      
                      <div className="text-center p-2 sm:p-3 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg sm:rounded-xl border border-red-200 dark:border-red-800">
                        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400 mx-auto mb-1" />
                        <div className="text-lg sm:text-xl font-bold text-red-700 dark:text-red-400">
                          {nonCompliantPersons}
                        </div>
                        <div className="text-[9px] sm:text-[10px] text-red-600 dark:text-red-500 font-medium">Violations</div>
                      </div>
                      
                      <div className="text-center p-2 sm:p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg sm:rounded-xl border border-green-200 dark:border-green-800">
                        <Award className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
                        <div className="text-lg sm:text-xl font-bold text-green-700 dark:text-green-400">
                          {confidence ? (confidence * 100).toFixed(0) : 0}%
                        </div>
                        <div className="text-[9px] sm:text-[10px] text-green-600 dark:text-green-500 font-medium">Accuracy</div>
                      </div>
                    </div>

                    {/* Info Section */}
                    <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{formatDate(detectedDate)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                        <span>Processed in {detection.processing_time?.toFixed(2) || '0.00'}s</span>
                      </div>
                      <div className="flex">
                        <div
                          className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1 sm:gap-1.5 shadow-md ${
                            isCompliant
                              ? 'bg-green-600 text-white'
                              : 'bg-red-600 text-white'
                          }`}
                        >
                          {isCompliant ? (
                            <>
                              <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              COMPLIANT
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              NON-COMPLIANT
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* View Button */}
                    {!isSelectionMode && (
                      <Button
                        variant="secondary"
                        className="w-full text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/detections/${detection.id}`);
                        }}
                      >
                        <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                        <span className="hidden sm:inline">View Full Report</span>
                        <span className="sm:hidden">View Report</span>
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
};
