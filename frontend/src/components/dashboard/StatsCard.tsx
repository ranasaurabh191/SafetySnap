import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'orange' | 'blue' | 'green' | 'red' | 'gray';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
}

const colorConfig = {
  orange: {
    bg: 'bg-orange-500',
    lightBg: 'bg-orange-50 dark:bg-orange-950/30',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-900/30',
    gradient: 'from-orange-500 to-orange-600',
  },
  blue: {
    bg: 'bg-blue-500',
    lightBg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-900/30',
    gradient: 'from-blue-500 to-blue-600',
  },
  green: {
    bg: 'bg-green-500',
    lightBg: 'bg-green-50 dark:bg-green-950/30',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-200 dark:border-green-900/30',
    gradient: 'from-green-500 to-green-600',
  },
  red: {
    bg: 'bg-red-500',
    lightBg: 'bg-red-50 dark:bg-red-950/30',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-900/30',
    gradient: 'from-red-500 to-red-600',
  },
  gray: {
    bg: 'bg-gray-500',
    lightBg: 'bg-gray-50 dark:bg-gray-950/30',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-200 dark:border-gray-900/30',
    gradient: 'from-gray-500 to-gray-600',
  },
};

export const StatsCard = ({ title, value, icon: Icon, color, trend, subtitle }: StatsCardProps) => {
  const colors = colorConfig[color];

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`relative overflow-hidden bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-lg border ${colors.border} p-6 group cursor-pointer`}
    >
      {/* Gradient overlay on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 ${colors.lightBg} rounded-xl group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`h-6 w-6 ${colors.text}`} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
              trend.isPositive 
                ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400' 
                : 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400'
            }`}>
              {trend.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {trend.value}%
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Decorative corner element */}
      <div className={`absolute -bottom-2 -right-2 w-24 h-24 bg-gradient-to-br ${colors.gradient} opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`}></div>
    </motion.div>
  );
};
