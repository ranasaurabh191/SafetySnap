import { motion } from 'framer-motion';
import { Card } from '@/components/common/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface ComplianceChartProps {
  data: {
    compliant: number;
    partial: number;
    nonCompliant: number;
  };
}

export const ComplianceChart: React.FC<ComplianceChartProps> = ({ data }) => {
  const pieData = [
    { name: 'Compliant', value: data.compliant, color: '#10b981', icon: CheckCircle },
    { name: 'Partial', value: data.partial, color: '#f97316', icon: AlertTriangle }, // Changed to orange
    { name: 'Non-Compliant', value: data.nonCompliant, color: '#ef4444', icon: XCircle },
  ];

  const total = data.compliant + data.partial + data.nonCompliant;

  return (
    <Card padding="lg" className="border-l-4 border-orange-500"> {/* Added orange border */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Compliance Overview</h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Total: <span className="font-bold text-gray-900 dark:text-white">{total}</span> detections
        </div>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400">No compliance data yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Upload images to see compliance statistics
          </p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent as number) * 100).toFixed(0)}%`}
                outerRadius={100}
                innerRadius={60} // Added donut style
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px 12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-3 gap-4 mt-6">
            {pieData.map((item, index) => {
              const Icon = item.icon;
              const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
              
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-center mb-2">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: item.color }}
                    />
                    <Icon className="h-4 w-4 mr-1" style={{ color: item.color }} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {item.name}
                    </span>
                  </div>
                  <p className="text-3xl font-bold mb-1" style={{ color: item.color }}>
                    {item.value}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                        className="h-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 min-w-[3rem]">
                      {percentage}%
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Summary Section */}
          <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/10 dark:to-orange-800/10 rounded-lg border border-orange-200 dark:border-orange-800"> {/* Orange gradient */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Compliance Rate</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400"> {/* Orange text */}
                  {total > 0 ? ((data.compliant / total) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Safety Score</p>
                <p className={`text-2xl font-bold ${
                  (data.compliant / total) * 100 >= 80 ? 'text-green-600' : 
                  (data.compliant / total) * 100 >= 50 ? 'text-orange-600' : 'text-red-600'
                }`}>
                  {total > 0 ? ((data.compliant / total) * 100 >= 80 ? 'Excellent' : 
                    (data.compliant / total) * 100 >= 50 ? 'Good' : 'Needs Improvement') : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};
