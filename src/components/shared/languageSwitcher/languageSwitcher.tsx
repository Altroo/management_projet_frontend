'use client';

import React from 'react';
import { Button, IconButton, Tooltip } from '@mui/material';
import { useLanguage } from '@/utils/hooks';
import { Desktop, TabletAndMobile } from '@/utils/clientHelpers';

const LanguageSwitcher: React.FC = () => {
	const { language, setLanguage } = useLanguage();

	const toggleLanguage = () => {
		setLanguage(language === 'fr' ? 'en' : 'fr');
	};

	const flag = language === 'fr' ? '🇬🇧' : '🇫🇷';
	const label = language === 'fr' ? 'English' : 'Français';

	return (
		<>
			<Desktop>
				<Tooltip title={label}>
					<Button variant="text" color="inherit" onClick={toggleLanguage} startIcon={<>{flag}</>}>
						{language === 'fr' ? 'EN' : 'FR'}
					</Button>
				</Tooltip>
			</Desktop>
			<TabletAndMobile>
				<Tooltip title={label}>
					<IconButton color="inherit" onClick={toggleLanguage} aria-label={label}>
						<>{flag}</>
					</IconButton>
				</Tooltip>
			</TabletAndMobile>
		</>
	);
};

export default LanguageSwitcher;
