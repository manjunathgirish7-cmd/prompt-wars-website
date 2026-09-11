import React, { useState } from 'react';
import { LoginPage } from './LoginPage.js';
import { SignupSecurityPage } from './SignupSecurityPage.js';
import { useAuth } from '../context/AuthContext.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialMode = 'login' 
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);

  // Sync mode when initialMode changes
  React.useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-xl my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors text-sm font-bold shadow-md"
          title="Close dialog"
        >
          ✕
        </button>

        {mode === 'login' ? (
          <LoginPage
            onSwitchToSignup={() => setMode('signup')}
            onSuccess={onClose}
          />
        ) : (
          <SignupSecurityPage
            onSwitchToLogin={() => setMode('login')}
            onSuccess={onClose}
          />
        )}
      </div>
    </div>
  );
};
