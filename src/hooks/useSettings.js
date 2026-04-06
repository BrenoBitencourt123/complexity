// ═══════════════════════════════════════════════════
// useSettings — API key e preferências
// ═══════════════════════════════════════════════════

import { useState, useCallback, useEffect } from 'react';
import { initGemini, isGeminiReady } from '../services/gemini.js';

const STORAGE_KEY = 'atlas-agency-settings';

const defaultSettings = {
  apiKey: '',
  elevenLabsVoice: 'Mateus',
  preferirOpcaoA: true,
};

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : defaultSettings;
      // Inicializar Gemini se tem API key
      if (parsed.apiKey) {
        initGemini(parsed.apiKey);
      }
      return parsed;
    } catch {
      return defaultSettings;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Erro ao salvar settings:', e);
    }
  }, [settings]);

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'apiKey') {
        if (value) {
          initGemini(value);
        }
      }
      return next;
    });
  }, []);

  const setApiKey = useCallback((key) => {
    updateSetting('apiKey', key);
  }, [updateSetting]);

  return {
    settings,
    updateSetting,
    setApiKey,
    hasApiKey: !!settings.apiKey,
    isReady: isGeminiReady(),
  };
}
