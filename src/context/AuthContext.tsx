import React, { createContext, useContext, useState, useEffect } from 'react';
import { CitizenUser } from '../types.js';
import { loginCitizenApi, logoutCitizenApi } from '../services/apiClient.js';

interface AuthContextType {
  currentUser: CitizenUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: CitizenUser, token?: string) => void;
  logout: () => void;
  updateUser: (updatedFields: Partial<CitizenUser>) => void;
  loginAsDemo: () => Promise<void>;
  openAuthModal: (mode?: 'login' | 'signup') => void;
  authModalOpen: boolean;
  authModalMode: 'login' | 'signup';
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_USER = 'intentbridge_citizen_user';
const STORAGE_KEY_TOKEN = 'intentbridge_citizen_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<CitizenUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    try {
      const isExplicitLogout = localStorage.getItem('intentbridge_explicit_logout') === 'true';
      const stored = localStorage.getItem(STORAGE_KEY_USER);
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      } else if (!isExplicitLogout) {
        const defaultUser: CitizenUser = {
          id: 'usr-demo-aarav',
          name: 'Aarav Sharma',
          email: 'aarav@citizen.org',
          phone: '+91 98765 43210',
          city: 'Bengaluru',
          ward: 'Ward 112, Indiranagar',
          isVerified: true,
          twoFactorEnabled: true,
          twoFactorMethod: 'authenticator',
          passkeyEnabled: true,
          autoPurgeDays: 90,
          localEncryptionEnabled: true,
          recoveryKeyGenerated: true,
          createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
          lastLoginAt: new Date().toISOString()
        };
        setCurrentUser(defaultUser);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(defaultUser));
        localStorage.setItem(STORAGE_KEY_TOKEN, 'token-usr-demo-aarav-active');
      }
    } catch (e) {
      console.error('Failed to parse stored user', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (user: CitizenUser, token?: string) => {
    setCurrentUser(user);
    try {
      localStorage.removeItem('intentbridge_explicit_logout');
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      if (token) localStorage.setItem(STORAGE_KEY_TOKEN, token);
    } catch (e) {
      console.error('Failed to persist user session', e);
    }
    setAuthModalOpen(false);
  };

  const logout = () => {
    logoutCitizenApi().catch(err => console.warn('Logout notification error:', err));
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.setItem('intentbridge_explicit_logout', 'true');
    } catch (e) {
      console.error('Failed to clear user session', e);
    }
  };

  const updateUser = (updatedFields: Partial<CitizenUser>) => {
    setCurrentUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedFields };
      try {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to update stored user', e);
      }
      return updated;
    });
  };

  const loginAsDemo = async () => {
    try {
      setIsLoading(true);
      const res = await loginCitizenApi({
        email: 'aarav@citizen.org',
        isDemoBypass: true
      });
      if (res.success && res.user) {
        login(res.user, res.token);
      }
    } catch (err) {
      console.error('Demo login error', err);
    } finally {
      setIsLoading(false);
    }
  };

  const openAuthModal = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        logout,
        updateUser,
        loginAsDemo,
        openAuthModal,
        authModalOpen,
        authModalMode,
        closeAuthModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
