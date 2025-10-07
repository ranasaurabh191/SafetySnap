import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, User, LogOut, Sun, Moon, ShieldCheck } from 'lucide-react'; // Add ShieldCheck icon for safety symbol
import { useAppStore } from '@/store/useAppStore';
import { NotificationsDropdown } from '@/components/common/NotificationsDropdown';
import { authService } from '@/services/auth';
import toast from 'react-hot-toast';

// Optional: You can import Lottie for animation if preferred
// import Lottie from 'lottie-react';
// import safetyAnimation from '@/assets/animations/construction-safety.json';

export const Header = () => {
  const { toggleSidebar, user, token, logout, theme, toggleTheme } = useAppStore();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      if (token) {
        await authService.logout(token);
      }
      logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <header className="mx-4 mt-4 mb-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Sidebar toggle and safety icon or animation */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="lg:hidden text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Safety icon */}
          <div
            className="hidden sm:flex items-center gap-2 text-orange-600 dark:text-orange-400"
            title="Safety First"
          >
            <ShieldCheck className="h-6 w-6" />
            <span className="font-semibold text-lg select-none">Safety First</span>
          </div>

          {/* Or use Lottie animation instead of icon */}
          {/* <div className="hidden sm:block w-10 h-10">
            <Lottie animationData={safetyAnimation} loop={true} />
          </div> */}
        </div>

        {/* Middle: Safety quote */}
        <div className="flex-1 text-center px-4">
          <p className="text-md md:text-md font-medium text-gray-700 dark:text-gray-300 italic select-none">
            "Safety doesn't happen by accident."
          </p>
        </div>

        {/* Right part remains the same */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="relative p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all group"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-yellow-500 group-hover:text-yellow-400 transition-colors" />
            ) : (
              <Moon className="h-5 w-5 text-orange-600 group-hover:text-orange-700 transition-colors" />
            )}
          </button>

          <NotificationsDropdown />

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 ml-2 px-3 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {user?.username || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user?.role || 'Worker'}
                </p>
              </div>
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                  <button
                    onClick={() => {
                      navigate('/settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-900 dark:text-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <span className="font-medium">Profile</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-3 border-t border-gray-200 dark:border-gray-700 transition-colors"
                  >
                    <div className="w-8 h-8 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                      <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
