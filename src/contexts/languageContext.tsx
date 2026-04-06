'use client';

import React, { createContext, useCallback, useState } from 'react';
import type { Language, TranslationDictionary } from '@/types/languageTypes';
import { translations } from '@/translations';
import { setHelpersLanguage } from '@/utils/helpers';

const STORAGE_KEY = 'app-language';
const DEFAULT_LANGUAGE: Language = 'fr';

export type LanguageContextType = {
	language: Language;
	setLanguage: (lang: Language) => void;
	t: TranslationDictionary;
};

export const LanguageContext = createContext<LanguageContextType>({
	language: DEFAULT_LANGUAGE,
	setLanguage: () => {},
	t: translations[DEFAULT_LANGUAGE],
});

const getInitialLanguage = (): Language => {
	if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored === 'fr' || stored === 'en') return stored;
	return DEFAULT_LANGUAGE;
};

export const LanguageContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [language, setLanguageState] = useState<Language>(() => {
		const lang = getInitialLanguage();
		setHelpersLanguage(lang);
		return lang;
	});

	const setLanguage = useCallback((lang: Language) => {
		setLanguageState(lang);
		setHelpersLanguage(lang);
		localStorage.setItem(STORAGE_KEY, lang);
		document.cookie = `${STORAGE_KEY}=${lang};path=/;max-age=31536000`;
	}, []);

	const t = translations[language];

	return (
		<LanguageContext.Provider value={{ language, setLanguage, t }}>
			{children}
		</LanguageContext.Provider>
	);
};
