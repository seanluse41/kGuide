import i18next from 'i18next';

import en from '../locales/en.json';
import ja from '../locales/ja.json';

const getUserLanguage = () => {
  try {
    const { language } = kintone.getLoginUser();
    if (language) {
      return language;
    }
  } catch (error) {
    console.error('Error getting user language:', error);
  }

  // Fallback to the domain if the user language is not available
  return kintone.api.url('/k/v1/records.json').includes('kintone.com') ? 'en' : 'ja';
};

i18next.init({
  lng: getUserLanguage(),
  fallbackLng: 'en',
  initImmediate: false,
  interpolation: { escapeValue: false },
  resources: {
    en: { translation: en },
    ja: { translation: ja },
  },
});

export const t = i18next.t.bind(i18next);
