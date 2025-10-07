import { format, formatDistanceToNow } from 'date-fns';

export const formatDate = (dateString: string): string => {
  return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
};

export const formatDateShort = (dateString: string): string => {
  return format(new Date(dateString), 'MMM dd, yyyy');
};

export const formatRelativeTime = (dateString: string): string => {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
};

export const formatDuration = (seconds: number): string => {
  if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
  if (seconds < 60) return `${seconds.toFixed(2)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
};

export const getComplianceColor = (status: string): string => {
  switch (status) {
    case 'compliant':
      return 'text-green-600 bg-green-100';
    case 'partial':
      return 'text-yellow-600 bg-yellow-100';
    case 'non_compliant':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'critical':
      return 'text-red-700 bg-red-100 border-red-300';
    case 'high':
      return 'text-orange-700 bg-orange-100 border-orange-300';
    case 'medium':
      return 'text-yellow-700 bg-yellow-100 border-yellow-300';
    case 'low':
      return 'text-blue-700 bg-blue-100 border-blue-300';
    default:
      return 'text-gray-700 bg-gray-100 border-gray-300';
  }
};

export const getPPEIcon = (ppeName: string): string => {
  const icons: Record<string, string> = {
    helmet: '🪖',
    safety_vest: '🦺',
    safety_boots: '👢',
    gloves: '🧤',
    safety_glasses: '🥽',
    face_mask: '😷',
    harness: '🪢',
  };
  return icons[ppeName] || '🔧';
};

export const getPPELabel = (ppeName: string): string => {
  const labels: Record<string, string> = {
    helmet: 'Hard Hat',
    safety_vest: 'Safety Vest',
    safety_boots: 'Safety Boots',
    gloves: 'Gloves',
    safety_glasses: 'Safety Glasses',
    face_mask: 'Face Mask',
    harness: 'Safety Harness',
  };
  return labels[ppeName] || ppeName;
};

export const calculateComplianceRate = (compliant: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((compliant / total) * 100);
};

export const getStatusBadge = (status: string): { color: string; label: string } => {
  const badges: Record<string, { color: string; label: string }> = {
    pending: { color: 'bg-gray-200 text-gray-700', label: 'Pending' },
    processing: { color: 'bg-blue-200 text-blue-700', label: 'Processing' },
    completed: { color: 'bg-green-200 text-green-700', label: 'Completed' },
    failed: { color: 'bg-red-200 text-red-700', label: 'Failed' },
  };
  return badges[status] || badges.pending;
};

export const downloadImage = (url: string, filename: string): void => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};
