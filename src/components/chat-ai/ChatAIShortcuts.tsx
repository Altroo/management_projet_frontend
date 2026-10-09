import { Box, ButtonBase, Stack, Typography } from '@mui/material';
import type { ChatShortcut } from './types';

export const ChatAIShortcuts = ({
	draft,
	shortcuts,
	language = 'fr',
	choose,
}: {
	draft: string;
	shortcuts: ChatShortcut[];
	language?: 'fr' | 'en';
	choose: (value: string) => void;
}) => {
	const command = draft.trim().split(/\s+/)[0].toLowerCase();
	const matches = shortcuts.filter((item) => item.command.startsWith(command));
	return (
		<Box sx={{ py: 1 }}>
			<Typography variant="subtitle2">
				{language === 'en' ? 'Assistant shortcuts' : 'Raccourcis de l’assistant'}
			</Typography>
			<Typography variant="caption" color="text.secondary">
				{language === 'en'
					? 'Choose a module or action. You can also write normally without a shortcut.'
					: 'Choisissez un module ou une action. Vous pouvez aussi écrire normalement, sans raccourci.'}
			</Typography>
			<Stack spacing={0.5} sx={{ mt: 1 }}>
				{matches.map((item) => (
					<ButtonBase
						key={item.command}
						onClick={() => choose(item.command + ' ')}
						sx={{
							display: 'block',
							textAlign: 'left',
							p: 1,
							borderRadius: 2,
							border: 1,
							borderColor: 'divider',
							'&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' },
						}}
					>
						<Typography variant="body2" sx={{ fontWeight: 600 }}>
							<Box component="code" sx={{ mr: 1, color: 'primary.main' }}>
								{item.command}
							</Box>
							{item.title}
						</Typography>
						<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
							{item.help}
						</Typography>
						<Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
							{language === 'en' ? 'Example: ' : 'Exemple : '}
							{item.example}
						</Typography>
					</ButtonBase>
				))}
			</Stack>
		</Box>
	);
};
