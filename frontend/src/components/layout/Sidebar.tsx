import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Upload, FileText, Settings, Info, Video, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/video-monitor', label: 'Video Monitor', icon: Video },
  { path: '/upload', label: 'Upload', icon: Upload },
  { path: '/detections', label: 'Detections', icon: FileText },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/about', label: 'About', icon: Info },
];

// Custom hook to detect if screen is desktop size
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    
    // Set initial value
    setIsDesktop(media.matches);

    const listener = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
    };

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  return isDesktop;
};

export const Sidebar = () => {
  const { isSidebarOpen, toggleSidebar } = useAppStore();
  const isDesktop = useIsDesktop();

  // On desktop, sidebar is always visible (x: 0)
  // On mobile, animate based on isSidebarOpen state
  const sidebarX = isDesktop ? 0 : (isSidebarOpen ? 0 : -280);

  return (
    <>
      <AnimatePresence>
        {isSidebarOpen && !isDesktop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: sidebarX }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 left-0 bottom-0 w-64 lg:top-4 lg:left-4 lg:bottom-4 bg-white dark:bg-gray-800 lg:rounded-2xl shadow-2xl border-r lg:border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="relative overflow-hidden p-4 sm:p-5 lg:p-6 border-b border-orange-400/30">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700"></div>
            
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-10">
              <div 
                className="absolute inset-0" 
                style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                  backgroundSize: '24px 24px'
                }}
              ></div>
            </div>

            {/* Animated glow orb */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Logo */}
                <div className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 bg-white/20 backdrop-blur-md rounded-xl lg:rounded-2xl flex items-center justify-center shadow-xl ring-2 ring-white/30 hover:scale-105 transition-transform">
                  <svg 
                    className="w-6 h-6 sm:w-6.5 sm:h-6.5 lg:w-7 lg:h-7 text-white drop-shadow-lg" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2.5} 
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" 
                    />
                  </svg>
                </div>
                
                <div>
                  <h1 className="text-xl sm:text-xl lg:text-2xl font-bold text-white drop-shadow-md tracking-tight">
                    SafetySnap
                  </h1>
                </div>
              </div>
              
              {/* Close button - only show on mobile */}
              {!isDesktop && (
                <button 
                  onClick={toggleSidebar} 
                  className="text-white/90 hover:text-white hover:bg-white/20 p-1.5 sm:p-2 rounded-lg transition-all backdrop-blur-sm"
                  aria-label="Close sidebar"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 sm:p-3.5 lg:p-4 space-y-1.5 sm:space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/dashboard'}
                onClick={() => !isDesktop && toggleSidebar()}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 sm:gap-3 px-3 sm:px-3.5 lg:px-4 py-2.5 sm:py-3 lg:py-3.5 rounded-lg lg:rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`h-4.5 w-4.5 sm:h-5 sm:w-5 flex-shrink-0 ${isActive ? 'drop-shadow-sm' : ''}`} />
                    <span className={`text-sm sm:text-base ${isActive ? 'font-semibold' : ''}`}>
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-3 sm:p-3.5 lg:p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              ©2025 SafetySnap SRB
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
};
