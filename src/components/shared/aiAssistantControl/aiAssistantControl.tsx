'use client';

import React, { useState } from 'react';
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	Menu,
	MenuItem,
	Paper,
	Stack,
	Tooltip,
	Typography,
} from '@mui/material';
import {
	AutoAwesome as AutoAwesomeIcon,
	Language as LanguageIcon,
	Spellcheck as SpellcheckIcon,
	WorkOutlined as WorkOutlineIcon,
} from '@mui/icons-material';
import { useAssistTextMutation } from '@/store/services/project';
import type { AiAssistAction, AiAssistRequest, AiAssistResponse } from '@/types/aiTypes';
import { extractApiErrorMessage } from '@/utils/helpers';
import { useLanguage } from '@/utils/hooks';

type AiAssistantControlProps = {
	value: string;
	onApply: (value: string) => void;
	context: string;
	disabled?: boolean;
	compact?: boolean;
};

const isEnabled = () => process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED === 'true';

const EnabledAiAssistantControl: React.FC<AiAssistantControlProps> = ({
	value,
	onApply,
	context,
	disabled = false,
	compact = false,
}) => {
	const { t } = useLanguage();
	const [assistText, { isLoading }] = useAssistTextMutation();
	const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
	const [result, setResult] = useState<AiAssistResponse | null>(null);
	const [lastRequest, setLastRequest] = useState<AiAssistRequest | null>(null);
	const [error, setError] = useState('');

	const run = async (action: AiAssistAction, target_language?: 'fr' | 'en') => {
		setMenuAnchor(null);
		if (!value.trim()) {
			setError(t.aiAssistant.emptyText);
			return;
		}
		const request: AiAssistRequest = {
			action,
			text: value,
			source_language: 'auto',
			target_language,
			context,
		};
		setLastRequest(request);
		setError('');
		try {
			setResult(await assistText(request).unwrap());
		} catch (requestError) {
			setError(extractApiErrorMessage(requestError, t.aiAssistant.requestError));
		}
	};

	const retry = async () => {
		if (!lastRequest) return;
		setError('');
		try {
			setResult(await assistText(lastRequest).unwrap());
		} catch (requestError) {
			setError(extractApiErrorMessage(requestError, t.aiAssistant.requestError));
		}
	};

	const controlsDisabled = disabled || isLoading || !value.trim();
	const menu = (
		<Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
			<MenuItem onClick={() => void run('translate', 'fr')}>{t.aiAssistant.translateToFrench}</MenuItem>
			<MenuItem onClick={() => void run('translate', 'en')}>{t.aiAssistant.translateToEnglish}</MenuItem>
			{compact && <MenuItem onClick={() => void run('fix_grammar')}>{t.aiAssistant.fixGrammar}</MenuItem>}
			{compact && <MenuItem onClick={() => void run('professionalize')}>{t.aiAssistant.professionalize}</MenuItem>}
		</Menu>
	);

	return (
		<>
			{compact ? (
				<>
					<Tooltip title={t.aiAssistant.previewTitle}>
						<span>
							<IconButton
								size="small"
								disabled={controlsDisabled}
								onClick={(event) => setMenuAnchor(event.currentTarget)}
								aria-label={t.aiAssistant.previewTitle}
							>
								{isLoading ? <CircularProgress size={18} /> : <AutoAwesomeIcon fontSize="small" />}
							</IconButton>
						</span>
					</Tooltip>
					{menu}
				</>
			) : (
				<Box>
					<Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
						<Button
							size="small"
							variant="text"
							startIcon={<LanguageIcon />}
							disabled={controlsDisabled}
							onClick={(event) => setMenuAnchor(event.currentTarget)}
						>
							{t.aiAssistant.translate}
						</Button>
						<Button
							size="small"
							variant="text"
							startIcon={<SpellcheckIcon />}
							disabled={controlsDisabled}
							onClick={() => void run('fix_grammar')}
						>
							{t.aiAssistant.fixGrammar}
						</Button>
						<Button
							size="small"
							variant="text"
							startIcon={<WorkOutlineIcon />}
							disabled={controlsDisabled}
							onClick={() => void run('professionalize')}
						>
							{isLoading ? <CircularProgress size={18} /> : t.aiAssistant.professionalize}
						</Button>
					</Stack>
					{menu}
				</Box>
			)}

			<Dialog
				open={Boolean(result || error)}
				onClose={() => {
					setResult(null);
					setError('');
				}}
				fullWidth
				maxWidth="md"
			>
				<DialogTitle>{t.aiAssistant.previewTitle}</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ mt: 1 }}>
						{result && (
							<Box>
								<Typography variant="subtitle2" gutterBottom>
									{t.aiAssistant.original}
								</Typography>
								<Paper variant="outlined" sx={{ p: 2, whiteSpace: 'pre-wrap' }}>
									{result?.original_text}
								</Paper>
							</Box>
						)}
						{result && (
							<Box>
								<Typography variant="subtitle2" gutterBottom>
									{t.aiAssistant.suggestion}
								</Typography>
								<Paper variant="outlined" sx={{ p: 2, whiteSpace: 'pre-wrap' }}>
									{result?.suggested_text}
								</Paper>
							</Box>
						)}
						{error && <Alert severity="error">{error}</Alert>}
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => {
							setResult(null);
							setError('');
						}}
					>
						{t.aiAssistant.cancel}
					</Button>
					<Button onClick={() => void retry()} disabled={isLoading}>
						{t.aiAssistant.tryAgain}
					</Button>
					<Button
						variant="contained"
						disabled={!result}
						onClick={() => {
							if (result) onApply(result.suggested_text);
							setResult(null);
						}}
					>
						{t.aiAssistant.useSuggestion}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

const AiAssistantControl: React.FC<AiAssistantControlProps> = (props) => {
	if (!isEnabled()) return null;
	return <EnabledAiAssistantControl {...props} />;
};

export default AiAssistantControl;
