import { useQuery } from '@tanstack/react-query';
import { detectionAPI } from '@/services/api';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ComplianceChart } from '@/components/dashboard/ComplianceChart';
import { RecentDetections } from '@/components/dashboard/RecentDetections';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { PageTransition } from '@/components/common/PageTransition';
import { Users, CheckCircle, TrendingUp, AlertTriangle, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export const Dashboard = () => {
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['detection-stats'],
    queryFn: detectionAPI.getStatistics,
    refetchInterval: 30000,
  });

  const { data: recentDetections, isLoading: detectionsLoading, error: detectionsError } = useQuery({
    queryKey: ['recent-detections'],
    queryFn: () => detectionAPI.getAll({}),
  });

  if (statsLoading || detectionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] sm:min-h-96">
        <div className="text-center px-4">
          <LoadingSpinner size="lg" />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium"
          >
            Loading dashboard data...
          </motion.p>
        </div>
      </div>
    );
  }

  if (statsError || detectionsError) {
    return (
      <PageTransition>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8 sm:py-12 bg-white dark:bg-[#0a0a0a] rounded-xl sm:rounded-2xl shadow-lg border border-red-200 dark:border-red-900/30 p-6 sm:p-8 mx-4"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 sm:h-10 sm:w-10 text-red-500 dark:text-red-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Please try refreshing the page
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 sm:mt-6 px-4 sm:px-6 py-2 sm:py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm sm:text-base font-medium transition-colors"
          >
            Refresh Page
          </button>
        </motion.div>
      </PageTransition>
    );
  }

  const complianceRate = stats?.compliance_rate || 0;
  const recentFive = Array.isArray(recentDetections) ? recentDetections.slice(0, 5) : [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 12,
      },
    },
  };

  return (
    <PageTransition>
      <div className="space-y-6 sm:space-y-8">
        {/* ✅ Responsive Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
            Safety Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Monitor PPE compliance and safety metrics in real-time
          </p>
        </motion.div>

        {/* ✅ Responsive Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6"
        >
          <motion.div variants={itemVariants}>
            <StatsCard
              title="Total Scans"
              value={stats?.total_detections || 0}
              icon={TrendingUp}
              color="orange"
              subtitle="All time detections"
            />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <StatsCard
              title="Persons Scanned"
              value={stats?.total_persons_scanned || 0}
              icon={Users}
              color="blue"
              subtitle="Unique individuals"
            />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <StatsCard
              title="Compliance Rate"
              value={`${complianceRate.toFixed(1)}%`}
              icon={CheckCircle}
              color="green"
              trend={{
                value: 5.2,
                isPositive: true,
              }}
              subtitle="Last 30 days"
            />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <StatsCard
              title="Total Violations"
              value={stats?.total_violations || 0}
              icon={AlertTriangle}
              color="red"
              subtitle="Requires attention"
            />
          </motion.div>
        </motion.div>

        {/* ✅ Responsive Quick Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border border-orange-200 dark:border-orange-900/50 rounded-xl sm:rounded-2xl p-4 sm:p-6"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="p-1.5 sm:p-2 bg-orange-600 dark:bg-orange-700 rounded-lg">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              Safety Insights
            </h3>
          </div>
          
          {/* ✅ Responsive Insights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
                Compliant Workers
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
                {stats?.compliant || 0}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
                Partial Compliance
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats?.partial_compliant || 0}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
                Non-Compliant
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">
                {stats?.non_compliant || 0}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ✅ Responsive Charts Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
        >
          <motion.div variants={itemVariants}>
            <ComplianceChart
              data={{
                compliant: stats?.compliant || 0,
                partial: stats?.partial_compliant || 0,
                nonCompliant: stats?.non_compliant || 0,
              }}
            />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <RecentDetections detections={recentFive} />
          </motion.div>
        </motion.div>

        {/* ✅ Responsive Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 pb-4"
        >
          {/* Footer content if needed */}
        </motion.div>
      </div>
    </PageTransition>
  );
};
