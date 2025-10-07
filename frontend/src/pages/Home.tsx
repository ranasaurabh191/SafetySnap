import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/common/Button';
import { 
  Shield, 
  Zap, 
  Users, 
  CheckCircle, 
  ArrowRight, 
  BarChart,
  Lock,
  Eye,
  Sun,
  Moon,
  TrendingUp
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export const Home = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useAppStore();

  const features = [
    {
      icon: Shield,
      title: 'AI-Powered Detection',
      description: 'Advanced YOLOv11 model with industry-leading 92% accuracy for reliable PPE detection',
    },
    {
      icon: Zap,
      title: 'Real-Time Processing',
      description: 'Lightning-fast analysis with results in under 500ms for immediate compliance checks',
    },
    {
      icon: Users,
      title: 'Per-Person Tracking',
      description: 'Individual compliance monitoring with detailed reports for each detected worker',
    },
    {
      icon: BarChart,
      title: 'Analytics Dashboard',
      description: 'Comprehensive insights and trends to improve workplace safety over time',
    },
    {
      icon: Eye,
      title: 'Live Monitoring',
      description: 'Real-time webcam detection for continuous workplace safety monitoring',
    },
    {
      icon: Lock,
      title: 'Privacy Focused',
      description: 'Optional face blurring and secure data handling to protect worker privacy',
    }
  ];

  const stats = [
    { value: '92%', label: 'Detection Accuracy', icon: TrendingUp },
    { value: '<500ms', label: 'Processing Time', icon: Zap },
    { value: '10+', label: 'PPE Categories', icon: Shield },
    { value: '24/7', label: 'Monitoring', icon: Eye }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors">
      {/* Subtle Background Pattern */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950"></div>
        <div 
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.02]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(251, 146, 60) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}
        ></div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">SafetySnap</span>
            </motion.div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-700" />
                )}
              </button>
              <Button
                onClick={() => navigate('/login')}
                variant="secondary"
              >
                Sign In
              </Button>
              <Button
                onClick={() => navigate('/register')}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-6 border border-orange-200 dark:border-orange-800">
              <CheckCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                Enterprise-Grade AI Detection
              </span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Automated PPE Compliance Monitoring
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              Protect your workforce with AI-powered detection. Monitor safety equipment compliance in real-time and prevent workplace violations.
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <Button
                onClick={() => navigate('/register')}
                size="lg"
                className="shadow-lg shadow-orange-500/20"
              >
                Create Account
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button
                onClick={() => navigate('/about')}
                variant="secondary"
                size="lg"
              >
                Learn More
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-6 pt-8 border-t border-gray-200 dark:border-gray-800">
              {stats.map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + idx * 0.1 }}
                  className="text-center"
                >
                  <stat.icon className="h-6 w-6 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative">
              {/* Main Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Compliance Status</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">94.2%</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">Workers Scanned</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900 dark:text-white">1,247</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">Avg. Speed</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900 dark:text-white">420ms</span>
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-6 -right-6 bg-orange-500 text-white px-6 py-3 rounded-full shadow-xl font-semibold"
              >
                ✓ Real-time
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 dark:bg-gray-900/50 py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Comprehensive Safety Solution
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need to monitor and maintain workplace safety compliance
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all"
              >
                <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="h-7 w-7 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700"
  >
    {/* Subtle Background Pattern */}
    <div className="absolute inset-0 opacity-5 dark:opacity-10">
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(251, 146, 60) 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }}
      ></div>
    </div>

    {/* Gradient Accent */}
    <div className="absolute top-0 left-0 right-0 h-1.5  via-orange-600 to-orange-500"></div>

    <div className="relative p-12 lg:p-16 text-center">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-6 border border-orange-200 dark:border-orange-800">
        <Shield className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
          Start Protecting Your Team Today
        </span>
      </div>

      <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
        Ready to Enhance Workplace Safety?
      </h2>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
        Join organizations worldwide using SafetySnap to automate PPE compliance and protect their workforce
      </p>

      <div className="flex flex-wrap gap-4 justify-center mb-8">
        <Button
          onClick={() => navigate('/register')}
          size="lg"
          className="shadow-lg shadow-orange-500/20"
        >
          <Users className="h-5 w-5 mr-2" />
          Create Free Account
        </Button>
        <Button
          onClick={() => navigate('/login')}
          variant="secondary"
          size="lg"
        >
          Sign In
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>

    </div>
  </motion.div>
</section>


      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            © 2025 SafetySnap. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
