import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, User, LogOut, Sun, Moon, ShieldCheck, Home, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { NotificationsDropdown } from '@/components/common/NotificationsDropdown';
import { authService } from '@/services/auth';
import toast from 'react-hot-toast';

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
    <header className="mx-2 sm:mx-4 mt-2 sm:mt-4 mb-4 sm:mb-6 bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 px-3 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* ✅ Left: Sidebar toggle and safety icon */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleSidebar}
            className="lg:hidden text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-1.5 sm:p-2 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* ✅ Safety icon - responsive visibility */}
          <div
            className="hidden md:flex items-center gap-2 text-orange-600 dark:text-orange-400"
            title="Safety First"
          >
            <ShieldCheck className="h-5 w-5 lg:h-6 lg:w-6" />
            <span className="font-semibold text-base lg:text-lg select-none">AI-powered Personal Protective Equipment (PPE) Detection System</span>
          </div>
        </div>

        

        {/* ✅ Right: Actions - responsive layout */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* ✅ Home Link - hidden on small screens */}
          <button
            onClick={() => navigate('/home')}
            className="hidden lg:flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg sm:rounded-xl transition-all font-semibold"
            title="Go to Home"
          >
            <Home className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-xs sm:text-sm">Home</span>
          </button>

          {/* ✅ About Link - hidden on small screens */}
          <button
            onClick={() => navigate('/about')}
            className="hidden lg:flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg sm:rounded-xl transition-all font-semibold"
            title="Go to About"
          >
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-xs sm:text-sm">About</span>
          </button>

          {/* ✅ Theme Toggle - responsive size */}
          <button
            onClick={toggleTheme}
            className="relative p-1.5 sm:p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg sm:rounded-xl transition-all group"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 group-hover:text-yellow-400 transition-colors" />
            ) : (
              <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 group-hover:text-orange-700 transition-colors" />
            )}
          </button>

          {/* ✅ Notifications - responsive size */}
          <NotificationsDropdown />

          {/* ✅ User Menu - responsive layout */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 sm:gap-3 ml-1 sm:ml-2 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg sm:rounded-xl transition-colors"
              aria-label="User menu"
            >
              <div className="w-7 h-7 sm:w-9 sm:h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              
              {/* ✅ User info - hidden on small screens */}
              <div className="hidden md:block text-left">
                <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[100px]">
                  {user?.username || 'User'}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user?.role || 'Worker'}
                </p>
              </div>
            </button>

            {/* ✅ Dropdown Menu - responsive positioning */}
            {showUserMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowUserMenu(false)} 
                  aria-hidden="true"
                />
                <div className="absolute right-0 mt-2 w-44 sm:w-48 bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                  <button
                    onClick={() => {
                      navigate('/settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 sm:gap-3 text-gray-900 dark:text-gray-100 transition-colors"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <span className="text-sm sm:text-base font-medium">Profile</span>
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2 sm:gap-3 border-t border-gray-200 dark:border-gray-700 transition-colors"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                      <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <span className="text-sm sm:text-base font-medium">Logout</span>
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
