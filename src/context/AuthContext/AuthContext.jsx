import { createContext, useState, useEffect, useCallback } from 'react';
import {
  fetchCurrentUser,
  login as loginApi,
  register as registerApi,
  updateProfile as updateProfileApi,
  uploadAvatar as uploadAvatarApi,
  changePassword as changePasswordApi,
} from '../../services/authService';
import { clearDemoSeedCache } from '../../services/messageService';
import { invalidateResidentsCache } from '../../services/residentService';
import { sessionCacheClear } from '../../utils/sessionCache';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const profile = await fetchCurrentUser();
      setUser(profile);
    } catch {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    const onFocus = () => {
      if (localStorage.getItem('token')) {
        loadUser();
      }
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadUser]);

  const login = async (email, password) => {
    const { access_token: token } = await loginApi({ email, password });
    localStorage.setItem('token', token);
    const profile = await fetchCurrentUser();
    setUser(profile);
    return true;
  };

  const register = async (email, password, fullName) => {
    return registerApi({ email, password, full_name: fullName });
  };

  const updateProfile = async (payload) => {
    const profile = await updateProfileApi(payload);
    setUser(profile);
    return profile;
  };

  const uploadAvatar = async (file) => {
    const profile = await uploadAvatarApi(file);
    invalidateResidentsCache();
    setUser(profile);
    return profile;
  };

  const changePassword = async (currentPassword, newPassword) => {
    return changePasswordApi({
      current_password: currentPassword,
      new_password: newPassword,
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    clearDemoSeedCache();
    sessionCacheClear();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    uploadAvatar,
    changePassword,
    refreshUser: loadUser,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
