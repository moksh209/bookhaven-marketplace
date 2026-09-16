import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Only restore if user explicitly logged in previously
    try {
      const stored = localStorage.getItem('bookhaven_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        // If it was the old fake demo user "usr-1" or "Elena Vance", wipe it!
        if (parsed?.id === 'usr-1' || parsed?.email === 'elena@bookhaven.test') {
          localStorage.removeItem('bookhaven_user');
          return null;
        }
        return parsed;
      }
    } catch {
      return null;
    }
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const toast = useToast();

  const login = async (email, password) => {
    try {
      const res = await api.login(email, password);
      setUser(res.user);
      localStorage.setItem('bookhaven_user', JSON.stringify(res.user));
      setIsAuthModalOpen(false);
      toast.success(`Welcome back, ${res.user.name}!`);
      return res.user;
    } catch (err) {
      toast.error(err.message || 'Login failed');
      throw err;
    }
  };

  const signup = async (signupData) => {
    try {
      const res = await api.signup(signupData);
      setUser(res.user);
      localStorage.setItem('bookhaven_user', JSON.stringify(res.user));
      setIsAuthModalOpen(false);
      toast.success(`Account created! Welcome to BookHaven, ${res.user.name}.`);
      return res.user;
    } catch (err) {
      toast.error(err.message || 'Registration failed');
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('bookhaven_user');
    toast.info('You have logged out.');
  };

  const updateProfile = async (updates) => {
    if (!user) return;
    try {
      const updated = await api.updateProfile(updates);
      setUser(updated);
      localStorage.setItem('bookhaven_user', JSON.stringify(updated));
      toast.success('Profile updated successfully!');
      return updated;
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
      throw err;
    }
  };

  const updatePaymentSettings = async (settings) => {
    if (!user) return;
    try {
      const res = await api.updatePaymentSettings(settings);
      setUser((prev) => ({
        ...prev,
        hasQrCode: res.hasQrCode,
        upiId: res.upiId,
        paymentInstructions: res.paymentInstructions
      }));
      const stored = localStorage.getItem('bookhaven_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem('bookhaven_user', JSON.stringify({
          ...parsed,
          hasQrCode: res.hasQrCode,
          upiId: res.upiId,
          paymentInstructions: res.paymentInstructions
        }));
      }
      toast.success(res.message || 'Payment QR code settings saved!');
      return res;
    } catch (err) {
      toast.error(err.message || 'Failed to save payment settings');
      throw err;
    }
  };

  const openAuthModal = (mode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const value = {
    user,
    loading,
    isAuthModalOpen,
    authModalMode,
    openAuthModal,
    closeAuthModal,
    setAuthModalMode,
    login,
    signup,
    logout,
    updateProfile,
    updatePaymentSettings
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
