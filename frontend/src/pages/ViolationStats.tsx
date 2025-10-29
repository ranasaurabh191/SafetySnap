import { useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PageTransition } from '@/components/common/PageTransition';
import { Download, AlertTriangle, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface ViolationStats {
  total_violations: number;
  recent_violations: number;
  compliance_rate: number;
  by_severity: { [key: string]: number };
  by_status: { [key: string]: number };
  top_violations: Array<{ violation_type: string; count: number }>;
}

export const ViolationStats = () => {
  const [stats, setStats] = useState<ViolationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/ppe/violation-stats/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/ppe/export-violations/`, {
        headers: { Authorization: `Token ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `violations_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('CSV exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export CSV');
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </PageTransition>
    );
  }

  if (!stats) return null;

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Violation Statistics</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Comprehensive analysis of PPE violations
            </p>
          </div>
          
          <Button onClick={downloadCSV} variant="secondary">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Violations"
            value={stats.total_violations}
            icon={<AlertTriangle className="h-6 w-6" />}
            color="red"
          />
          
          <StatCard
            label="Recent (24h)"
            value={stats.recent_violations}
            icon={<Clock className="h-6 w-6" />}
            color="orange"
          />
          
          <StatCard
            label="Compliance Rate"
            value={`${stats.compliance_rate}%`}
            icon={<CheckCircle className="h-6 w-6" />}
            color="green"
          />
          
          <StatCard
            label="Open Cases"
            value={stats.by_status.open || 0}
            icon={<TrendingUp className="h-6 w-6" />}
            color="blue"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Severity Breakdown */}
          <Card padding="md">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Violations by Severity
            </h3>
            
            <div className="space-y-3">
              {Object.entries(stats.by_severity).map(([severity, count]) => (
                <div key={severity} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getSeverityColor(severity)}`}></div>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {severity}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getSeverityBg(severity)}`}
                        style={{ width: `${(count / stats.total_violations) * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Violations */}
          <Card padding="md">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Top Violation Types
            </h3>
            
            <div className="space-y-2">
              {stats.top_violations.map((violation, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-600 text-white text-sm font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-gray-900 dark:text-white">{violation.violation_type}</span>
                  </div>
                  <span className="px-3 py-1 bg-red-600 text-white rounded-full text-sm font-bold">
                    {violation.count}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Status Breakdown */}
        <Card padding="md">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Violations by Status
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(stats.by_status).map(([status, count]) => (
              <div
                key={status}
                className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1 capitalize">
                  {status}
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {count}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageTransition>
  );
};

// Helper Components
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'red' | 'orange' | 'green' | 'blue';
}

const StatCard = ({ label, value, icon, color }: StatCardProps) => {
  const colorClasses = {
    red: 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600',
    orange: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600',
    green: 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600',
    blue: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
  };

  return (
    <Card padding="md" className={`border-2 ${colorClasses[color]}`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
        </div>
        <div className={colorClasses[color]}>{icon}</div>
      </div>
    </Card>
  );
};

// Helper functions
const getSeverityColor = (severity: string) => {
  const colors: { [key: string]: string } = {
    critical: 'bg-red-600',
    high: 'bg-orange-600',
    medium: 'bg-yellow-600',
    low: 'bg-blue-600'
  };
  return colors[severity] || 'bg-gray-600';
};

const getSeverityBg = (severity: string) => {
  const colors: { [key: string]: string } = {
    critical: 'bg-red-600',
    high: 'bg-orange-600',
    medium: 'bg-yellow-600',
    low: 'bg-blue-600'
  };
  return colors[severity] || 'bg-gray-600';
};
