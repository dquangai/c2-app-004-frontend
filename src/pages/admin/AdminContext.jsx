import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { getAdminApiKey, saveAdminApiKey } from '../../services/adminService';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [apiKey, setApiKeyState] = useState(getAdminApiKey());
  const [toast, setToast] = useState(null);

  const setApiKey = useCallback((key) => {
    saveAdminApiKey(key);
    setApiKeyState(key);
  }, []);

  const showSuccess = useCallback((text) => {
    setToast({ type: 'ok', text });
  }, []);

  const showError = useCallback((text) => {
    setToast({ type: 'error', text });
  }, []);

  const clearToast = useCallback(() => setToast(null), []);

  const value = useMemo(
    () => ({
      apiKey,
      setApiKey,
      toast,
      showSuccess,
      showError,
      clearToast,
    }),
    [apiKey, setApiKey, toast, showSuccess, showError, clearToast],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return ctx;
}
