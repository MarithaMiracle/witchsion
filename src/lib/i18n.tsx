// src/lib/i18n.ts
import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'es' | 'fr';

type Translations = {
  [key in Language]: {
    [key: string]: string;
  };
};

const translations: Translations = {
  en: {
    home: 'Home',
    shop: 'Shop',
    consultations: 'Consultations',
    blog: 'Blog',
    resources: 'Resources',
    community: 'Community',
    about: 'About',
    howToOrder: 'How To Order',
  },
  es: {
    home: 'Inicio',
    shop: 'Tienda',
    consultations: 'Consultas',
    blog: 'Blog',
    resources: 'Recursos',
    community: 'Comunidad',
    about: 'Acerca de',
    howToOrder: 'Cómo Pedir',
  },
  fr: {
    home: 'Accueil',
    shop: 'Boutique',
    consultations: 'Consultations',
    blog: 'Blog',
    resources: 'Ressources',
    community: 'Communauté',
    about: 'À propos',
    howToOrder: 'Comment Commander',
  },
};

type I18nContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}