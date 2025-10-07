import { Shield, Users, Zap, Lock, BarChart, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { PageTransition } from '@/components/common/PageTransition';

export const About = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Shield,
      title: 'AI-Powered Detection',
      description: 'YOLOv11-based real-time PPE detection with 92%+ accuracy',
      color: 'from-orange-500 to-orange-600',
    },
    {
      icon: Users,
      title: 'Per-Person Analysis',
      description: 'Individual compliance tracking for each detected person',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: BarChart,
      title: 'Compliance Analytics',
      description: 'Detailed statistics and trends for safety monitoring',
      color: 'from-green-500 to-green-600',
    },
    {
      icon: Bell,
      title: 'Real-Time Alerts',
      description: 'Instant notifications for critical safety violations',
      color: 'from-red-500 to-red-600',
    },
    {
      icon: Lock,
      title: 'Privacy First',
      description: 'Optional face blurring and secure data handling',
      color: 'from-yellow-500 to-yellow-600',
    },
    {
      icon: Zap,
      title: 'Fast Processing',
      description: 'Analyze images in under 500ms on mobile devices',
      color: 'from-orange-500 to-orange-600',
    },
  ];

  const applications = [
    { icon: '🏗️', title: 'Construction Sites', desc: 'Monitor helmet, vest, boots compliance for workers and visitors' },
    { icon: '🏍️', title: 'Road Safety', desc: 'Check motorcycle/bike riders for proper helmet usage' },
    { icon: '🏭', title: 'Manufacturing', desc: 'Factory floor safety with glasses, gloves, and protective gear' },
    { icon: '📦', title: 'Warehouses', desc: 'Loading dock and forklift area compliance monitoring' },
    { icon: '⚡', title: 'Electrical Work', desc: 'High-voltage area with specialized PPE requirements' },
    { icon: '🔥', title: 'Welding Zones', desc: 'Full face protection, gloves, and fire-resistant gear' },
    { icon: '⬆️', title: 'Height Work', desc: 'Fall protection harness and safety equipment verification' },
    { icon: '☣️', title: 'Hazmat Areas', desc: 'Chemical handling with respirators and protective suits' },
  ];

  const techStack = [
    { emoji: '⚛️', name: 'React + TypeScript', desc: 'Modern UI framework' },
    { emoji: '🐍', name: 'Django + DRF', desc: 'Robust backend API' },
    { emoji: '🤖', name: 'YOLOv11', desc: 'State-of-the-art AI' },
    { emoji: '🐘', name: 'PostgreSQL', desc: 'Reliable database' },
  ];

  const stats = [
    { value: '92%', label: 'Detection Accuracy(Apx)' },
    { value: '<500ms', label: 'Processing Time' },
    { value: '3', label: 'PPE Categories' },
    { value: '24/7', label: 'Real-Time Monitoring' },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br rounded-2xl from-orange-50 via-white to-orange-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        {/* Animated Background Blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute top-0 right-0 w-96 h-96 bg-orange-200 dark:bg-orange-900 rounded-full opacity-20 blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [90, 0, 90],
            }}
            transition={{ duration: 25, repeat: Infinity }}
            className="absolute bottom-0 left-0 w-96 h-96 bg-orange-300 dark:bg-orange-800 rounded-full opacity-20 blur-3xl"
          />
        </div>

        <div className="relative container mx-auto px-4 py-16">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-orange-600 to-orange-700 rounded-3xl mb-6 shadow-2xl"
            >
              <Shield className="h-12 w-12 text-white" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-6xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-4"
            >
              SafetySnap
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-2"
            >
              AI-Powered PPE Detection & Compliance Monitoring System
            </motion.p>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
          >
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-center mb-10 text-gray-900 dark:text-white">
              Powerful Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.05, rotate: 1 }}
                >
                  <Card padding="lg" className="h-full border-2 border-transparent hover:border-orange-400 dark:hover:border-orange-600 transition-all">
                    <div className="flex flex-col items-center text-center">
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                        className={`p-4 bg-gradient-to-br ${feature.color} rounded-2xl mb-4 shadow-lg`}
                      >
                        <feature.icon className="h-8 w-8 text-white" />
                      </motion.div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.description}</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Industry Applications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card padding="lg" className="max-w-6xl mx-auto mb-16 backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
              <h2 className="text-3xl font-bold text-center mb-10 text-gray-900 dark:text-white">
                Industry Applications
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {applications.map((app, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ y: -5 }}
                    className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 hover:shadow-lg transition-all"
                  >
                    <div className="text-4xl mb-3">{app.icon}</div>
                    <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                      {app.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{app.desc}</p>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Tech Stack */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card padding="lg" className="max-w-4xl mx-auto backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
              <h2 className="text-3xl font-bold text-center mb-10 text-gray-900 dark:text-white">
                Built With Modern Tech
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {techStack.map((tech, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="text-center"
                  >
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: idx * 0.2 }}
                      className="text-5xl mb-3"
                    >
                      {tech.emoji}
                    </motion.div>
                    <p className="font-semibold text-gray-900 dark:text-white">{tech.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{tech.desc}</p>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default About;
