'use client';
import { useColorMode } from '@/providers/themeProvider';
import type { DialogProps } from '@mui/material';
import { type FC, type ReactNode } from 'react';
import { Avatar, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';

type Action = {
	active: boolean;
	text: string;
	onClick: () => void;
	color?: string;
	icon?: ReactNode;
	disabled?: boolean;
};

type Props = {
	maxWidth?: DialogProps['maxWidth'];
	fullWidth?: boolean;
	title: string;
	actions: Action[];
	actionsStyle?: string[];
	body?: string;
	children?: ReactNode;
	titleIcon?: ReactNode;
	titleIconColor?: string;
	/** Called when the dialog is dismissed via backdrop click or Escape key. */
	onClose?: () => void;
};

const ActionModals: FC<Props> = ({
	title,
	actions,
	actionsStyle,
	body,
	children,
	titleIcon,
	titleIconColor,
	onClose,
	maxWidth,
	fullWidth,
}) => {
	const { mode } = useColorMode();
	const handleClose = () => {
		if (onClose) {
			onClose();
			return;
		}
		// Fallback: find the first non-active action (typically the cancel button)
		const cancelAction = actions.find((a) => !a.active);
		if (cancelAction) {
			cancelAction.onClick();
		}
	};

	return (
		<Dialog open onClose={handleClose} maxWidth={maxWidth} fullWidth={fullWidth}>
			<DialogTitle>
				<Stack
					direction="row"
					spacing={1}
					sx={{
						alignItems: 'center',
					}}
				>
					{titleIcon && (
						<Avatar
							variant="rounded"
							sx={{
								bgcolor: titleIconColor ?? 'transparent',
								color: titleIconColor ? '#fff' : 'inherit',
								width: 36,
								height: 36,
							}}
						>
							{titleIcon}
						</Avatar>
					)}
					<Typography variant="h6">{title}</Typography>
				</Stack>
			</DialogTitle>
			<DialogContent dividers>
				{body && <Typography variant="body2">{body}</Typography>}
				{children}
			</DialogContent>
			<DialogActions className={actionsStyle?.join(' ') ?? undefined} sx={{ padding: 2 }}>
				{actions.map((action, index) => {
					const solid = action.color ?? 'var(--app-solid, #0D070B)';
					const bg = action.active ? solid : 'var(--app-surface, #FFFFFF)';
					const outlineColor = action.color
						? mode === 'dark'
							? 'color-mix(in srgb, ' + action.color + ' 65%, white)'
							: action.color
						: 'var(--app-text, #0D070B)';
					const textColor = action.active ? (action.color ? '#FFFFFF' : 'var(--app-on-solid, #FFFFFF)') : outlineColor;
					const hoverBg = action.active ? solid : 'var(--app-button-hover-bg, #F5F5F5)';

					return (
						<Button
							key={index}
							variant={action.active ? 'contained' : 'outlined'}
							onClick={action.onClick}
							disabled={action.disabled}
							startIcon={action.icon}
							aria-label={action.text}
							sx={{
								backgroundColor: bg,
								color: textColor,
								borderColor: action.active ? solid : undefined,
								textTransform: 'none',
								'&:hover': {
									backgroundColor: hoverBg,
								},
								// ensure good contrast for outlined state
								'&.MuiButton-outlined': {
									borderColor: outlineColor,
								},
							}}
						>
							{action.text}
						</Button>
					);
				})}
			</DialogActions>
		</Dialog>
	);
};

export default ActionModals;
