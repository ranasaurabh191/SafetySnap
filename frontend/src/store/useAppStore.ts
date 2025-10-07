import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Detection, PPEPolicy, Site } from '@/types';

interface AppState {
  // User & Auth
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (user: User, token: string) => void;
  logout: () => void;

  // Current detection
  currentDetection: Detection | null;
  setCurrentDetection: (detection: Detection | null) => void;

  // Policies
  policies: PPEPolicy[];
  setPolicies: (policies: PPEPolicy[]) => void;
  selectedPolicy: PPEPolicy | null;
  setSelectedPolicy: (policy: PPEPolicy | null) => void;

  // Sites
  sites: Site[];
  setSites: (sites: Site[]) => void;
  selectedSite: Site | null;
  setSelectedSite: (site: Site | null) => void;
  
  // UI State
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

// Detect system preference
const getInitialTheme = (): 'light' | 'dark' => {
  const stored = localStorage.getItem('safetysnap-storage');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.state?.theme) {
        return parsed.state.theme;
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }
  
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light';
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // User & Auth - Initialize from localStorage
      user: null,
      token: null,
      isAuthenticated: false,
      
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setToken: (token) => {
        if (token) {
          localStorage.setItem('token', token);
        } else {
          localStorage.removeItem('token');
        }
        set({ token, isAuthenticated: !!token });
      },
      
      login: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
      },
      
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      // Current detection
      currentDetection: null,
      setCurrentDetection: (detection) => set({ currentDetection: detection }),

      // Policies
      policies: [],
      setPolicies: (policies) => set({ policies }),
      selectedPolicy: null,
      setSelectedPolicy: (policy) => set({ selectedPolicy: policy }),

      // Sites
      sites: [],
      setSites: (sites) => set({ sites }),
      selectedSite: null,
      setSelectedSite: (site) => set({ selectedSite: site }),

      // UI State
      isSidebarOpen: true,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      theme: getInitialTheme(),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'safetysnap-storage',
      partialize: (state) => ({
        theme: state.theme,
        isSidebarOpen: state.isSidebarOpen,
        token: state.token,
        user: state.user,
      }),
      // THIS IS CRITICAL - restore isAuthenticated based on token
      onRehydrateStorage: () => (state) => {
        if (state && state.token && state.user) {
          state.isAuthenticated = true;
        }
      },
    }
  )
);

// Listen for system theme changes
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const { setTheme } = useAppStore.getState();
    setTheme(e.matches ? 'dark' : 'light');
  });
}
