"use client";

import React, { useState } from 'react';
import { Box, Button, Modal, Typography } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import type { ApiErrorResponseType } from '@/types/_initTypes';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import { useLanguage } from '@/utils/hooks';

type AddEntityModalProps = {
	open: boolean;
	setOpen: (val: boolean) => void;
	label: string;
	icon: React.ReactNode;
	inputTheme: Theme;
	mutationFn: (args: {
		data: Record<string, number | string>;
	}) => Promise<unknown> & { unwrap?: () => Promise<unknown> };
	onSuccess?: (newEntityId: number) => void;
	buildPayload?: (name: string) => Record<string, number | string>;
};

const getMutationErrorMessage = (error: unknown, fallback: string): string => {
	const payload =
		(error as { error?: ApiErrorResponseType; data?: ApiErrorResponseType }).error ??
		(error as { error?: ApiErrorResponseType; data?: ApiErrorResponseType }).data ??
		(error as ApiErrorResponseType);

	if (payload?.details && typeof payload.details === 'object') {
		const detailsValues = Object.values(payload.details);
		if (detailsValues.length > 0) {
			const firstError = detailsValues[0];
			return String(Array.isArray(firstError) ? firstError[0] : firstError);
		}
	}

	return fallback;
};

const AddEntityModal: React.FC<AddEntityModalProps> = ({
	open,
	setOpen,
	label,
	icon,
	inputTheme,
	mutationFn,
	onSuccess,
	buildPayload,
}) => {
	const { t } = useLanguage();
	const [newName, setNewName] = useState('');
	const [error, setError] = useState<string | null>(null);

	const handleClose = () => {
		setOpen(false);
		setNewName('');
		setError(null);
	};

	const handleSubmit = async () => {
		if (!newName.trim()) {
			setError(`${label} ${t.validation.required}`);
			return;
		}

		try {
			const request = mutationFn({ data: buildPayload ? buildPayload(newName.trim()) : { name: newName.trim() } });
			const response = (typeof request.unwrap === 'function' ? await request.unwrap() : await request) as {
				data?: { id?: number };
				id?: number;
			};
			handleClose();
			const newId = response?.data?.id ?? response?.id;
			if (typeof newId === 'number') {
				onSuccess?.(newId);
			}
		} catch (mutationError) {
			setError(getMutationErrorMessage(mutationError, `${t.common.add} ${label}`));
		}
	};

	return (
		<Modal open={open} onClose={handleClose} disableRestoreFocus>
			<Box
				sx={{
					p: 3,
					bgcolor: 'background.paper',
					borderRadius: 2,
					maxWidth: 420,
					width: '90%',
					mx: 'auto',
					mt: '15vh',
					boxShadow: 24,
				}}
			>
				<Typography variant="h6" sx={{ mb: 2 }}>
					{`${t.common.add} ${label}`}
				</Typography>
				<CustomTextInput
					id={`new_${label}`}
					type="text"
					label={label}
					value={newName}
					onChange={(event) => {
						setNewName(event.target.value);
						if (error) setError(null);
					}}
					error={Boolean(error)}
					helperText={error ?? ''}
					fullWidth
					size="small"
					theme={inputTheme}
					startIcon={icon}
				/>
				<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
					<Button onClick={handleClose}>{t.common.cancel}</Button>
					<Button variant="contained" onClick={handleSubmit}>
						{t.common.add}
					</Button>
				</Box>
			</Box>
		</Modal>
	);
};

export default AddEntityModal;
