'use client';

import { type FC } from 'react';
import { Close as CloseIcon } from '@mui/icons-material';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { LanguageFlag } from '@/components/shared/languageSwitcher/languageSwitcher';
import { useLanguage } from '@/utils/hooks';

interface PdfLanguageModalProps {
	onSelectLanguage: (language: 'fr' | 'en') => void;
	onClose: () => void;
}

const PdfLanguageModal: FC<PdfLanguageModalProps> = ({ onSelectLanguage, onClose }) => {
	const { t } = useLanguage();

	return (
		<ActionModals
			onClose={onClose}
			title={t.pdf.generatePdf}
			body={t.pdf.chooseLanguage}
			actions={[
				{
					active: false,
					text: t.common.cancel,
					onClick: onClose,
					icon: <CloseIcon />,
					color: '#6B6B6B',
				},
				{
					active: false,
					text: t.pdf.french,
					onClick: () => onSelectLanguage('fr'),
					icon: <LanguageFlag language="fr" />,
					color: '#0D070B',
				},
				{
					active: true,
					text: t.pdf.english,
					onClick: () => onSelectLanguage('en'),
					icon: <LanguageFlag language="en" />,
					color: '#0D070B',
				},
			]}
		/>
	);
};

export default PdfLanguageModal;
