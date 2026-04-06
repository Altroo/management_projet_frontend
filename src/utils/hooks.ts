'use client';

import { useContext, useSyncExternalStore } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '@/store/store';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

import { getProfilState } from '@/store/selectors';
import { ToastContext, type ToastContextType } from '@/contexts/toastContext';
import { LanguageContext, type LanguageContextType } from '@/contexts/languageContext';

/** Returns the current user's permission flags. Staff always bypass individual flags. */
export const usePermission = () => {
	const { is_staff, can_view, can_print, can_create, can_edit, can_delete } = useAppSelector(getProfilState);
	const staff = !!is_staff;
	return {
		is_staff: staff,
		can_view: staff || !!can_view,
		can_print: staff || !!can_print,
		can_create: staff || !!can_create,
		can_edit: staff || !!can_edit,
		can_delete: staff || !!can_delete,
	};
};

export const useIsClient = () => {
	return useSyncExternalStore(
		() => () => {},
		() => true,
		() => false,
	);
};

export const useToast = (): ToastContextType => {
	const ctx = useContext(ToastContext);
	if (!ctx) throw new Error('useToast must be used within ToastProvider');
	return ctx;
};

export const useLanguage = (): LanguageContextType => {
	return useContext(LanguageContext);
};
