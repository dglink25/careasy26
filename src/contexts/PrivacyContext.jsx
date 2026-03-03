// src/contexts/PrivacyContext.jsx
import { createContext, useContext, useState } from 'react';

const PrivacyContext = createContext(null);

const STORAGE_KEY = 'careasy-privacy';

const DEFAULT = {
  profile_visibility: 'public',
  show_online_status: true,
};

export function PrivacyProvider({ children }) {
  const [privacy, setPrivacy] = useState(() => {
    // Lecture immédiate depuis localStorage pour éviter tout flash au montage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULT, ...JSON.parse(saved) } : DEFAULT;
    } catch {
      return DEFAULT;
    }
  });

  // Appelé par Settings.jsx à chaque changement
  const updatePrivacy = (newPrivacy) => {
    const merged = { ...privacy, ...newPrivacy };
    setPrivacy(merged);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  };

  // Appelé une fois que les données backend sont chargées (Settings.loadUserData)
  const syncFromBackend = (backendPrivacy) => {
    if (!backendPrivacy) return;
    const merged = { ...DEFAULT, ...backendPrivacy };
    setPrivacy(merged);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  };

  return (
    <PrivacyContext.Provider value={{ privacy, updatePrivacy, syncFromBackend }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const ctx = useContext(PrivacyContext);
  if (!ctx) throw new Error('usePrivacy doit être dans <PrivacyProvider>');
  return ctx;
}