"use client";

import React, { useMemo, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack } from '@mui/material';
import { Close as CloseIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import type { Theme } from '@mui/material/styles';
import type { DropDownType } from '@/types/accountTypes';
import type { ApiErrorResponseType } from '@/types/_initTypes';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import AddEntityModal from '@/components/shared/addEntityModal/addEntityModal';
import { useLanguage } from '@/utils/hooks';

type EntityPayload = Record<string, number | string>;

type EntityCrudControlsProps = {
	label: string;
	icon: React.ReactNode;
	inputTheme: Theme;
	selectedItem: DropDownType | null;
	addEntity: (args: { data: EntityPayload }) => Promise<unknown> & { unwrap?: () => Promise<unknown> };
	editEntity: (args: { id: number; data: EntityPayload }) => Promise<unknown> & { unwrap?: () => Promise<unknown> };
	deleteEntity: (args: { id: number }) => Promise<unknown> & { unwrap?: () => Promise<unknown> };
	buildAddPayload?: (name: string) => EntityPayload;
	buildEditPayload?: (name: string) => EntityPayload;
	onAddSuccess: (id: number) => void;
	onDeleteSuccess?: () => void;
	disabled?: boolean;
	addDisabled?: boolean;
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

const EntityCrudControls: React.FC<EntityCrudControlsProps> = ({
	label,
	icon,
	inputTheme,
	selectedItem,
	addEntity,
	editEntity,
	deleteEntity,
	buildAddPayload,
	buildEditPayload,
	onAddSuccess,
	onDeleteSuccess,
	disabled = false,
	addDisabled = false,
}) => {
	const { t } = useLanguage();
	const [openAddModal, setOpenAddModal] = useState(false);
	const [openEditDialog, setOpenEditDialog] = useState(false);
	const [editName, setEditName] = useState('');
	const [editError, setEditError] = useState<string | null>(null);
	const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
	const [actionLoading, setActionLoading] = useState(false);

	const selectedId = useMemo(() => {
		if (!selectedItem?.value) return null;
		const parsed = Number(selectedItem.value);
		return Number.isFinite(parsed) ? parsed : null;
	}, [selectedItem]);

	const handleEditOpen = () => {
		if (!selectedItem?.code) return;
		setEditName(selectedItem.code);
		setEditError(null);
		setOpenEditDialog(true);
	};

	const handleEditSubmit = async () => {
		if (!selectedId || !editName.trim()) return;
		setActionLoading(true);
		try {
			const request = editEntity({
				id: selectedId,
				data: buildEditPayload ? buildEditPayload(editName.trim()) : { name: editName.trim() },
			});
			if (typeof request.unwrap === 'function') {
				await request.unwrap();
			} else {
				await request;
			}
			setOpenEditDialog(false);
		} catch (error) {
			setEditError(getMutationErrorMessage(error, `${t.common.update} ${label}`));
		} finally {
			setActionLoading(false);
		}
	};

	const handleDeleteConfirm = async () => {
		if (!selectedId) return;
		setActionLoading(true);
		try {
			const request = deleteEntity({ id: selectedId });
			if (typeof request.unwrap === 'function') {
				await request.unwrap();
			} else {
				await request;
			}
			setOpenDeleteDialog(false);
			onDeleteSuccess?.();
		} finally {
			setActionLoading(false);
		}
	};

	return (
		<>
			<Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', ml: 1 }}>
				{selectedItem && (
					<>
						<IconButton size="small" onClick={handleEditOpen} title={t.common.update} disabled={disabled}>
							<EditIcon fontSize="small" />
						</IconButton>
						<IconButton
							size="small"
							onClick={() => setOpenDeleteDialog(true)}
							title={t.common.delete}
							color="error"
							disabled={disabled}
						>
							<DeleteIcon fontSize="small" />
						</IconButton>
					</>
				)}
				<Button size="small" variant="outlined" onClick={() => setOpenAddModal(true)} disabled={disabled || addDisabled}>
					{t.common.add}
				</Button>
			</Stack>

			<AddEntityModal
				open={openAddModal}
				setOpen={setOpenAddModal}
				label={label}
				icon={icon}
				inputTheme={inputTheme}
				mutationFn={addEntity}
				buildPayload={buildAddPayload}
				onSuccess={onAddSuccess}
			/>

			<Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
				<DialogTitle>{`${t.common.update} ${label}`}</DialogTitle>
				<DialogContent>
					<Stack sx={{ mt: 1 }}>
						<CustomTextInput
							id={`edit_${label}`}
							type="text"
							label={label}
							fullWidth
							size="small"
							value={editName}
							onChange={(event) => {
								setEditName(event.target.value);
								if (editError) setEditError(null);
							}}
							error={Boolean(editError)}
							helperText={editError ?? ''}
							theme={inputTheme}
							startIcon={icon}
						/>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpenEditDialog(false)}>{t.common.cancel}</Button>
					<Button onClick={handleEditSubmit} variant="contained" disabled={actionLoading || !editName.trim()}>
						{t.common.update}
					</Button>
				</DialogActions>
			</Dialog>

			{openDeleteDialog && selectedItem && (
				<ActionModals
					title={`${t.common.delete} ${label}`}
					body={`${t.common.delete} ${selectedItem.code} ?`}
					actions={[
						{
							text: t.common.cancel,
							active: false,
							onClick: () => setOpenDeleteDialog(false),
							icon: <CloseIcon />,
							color: '#6B6B6B',
						},
						{
							text: t.common.delete,
							active: true,
							onClick: handleDeleteConfirm,
							icon: <DeleteIcon />,
							color: '#D32F2F',
							disabled: actionLoading,
						},
					]}
					onClose={() => setOpenDeleteDialog(false)}
				/>
			)}
		</>
	);
};

export default EntityCrudControls;
