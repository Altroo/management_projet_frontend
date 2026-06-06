'use client';

import React, { useRef, useState } from 'react';
import {
	Box,
	Button,
	Card,
	CardContent,
	Divider,
	IconButton,
	List,
	ListItem,
	ListItemText,
	Stack,
	TextField,
	Tooltip,
	Typography,
} from '@mui/material';
import {
	AttachFile as AttachFileIcon,
	Delete as DeleteIcon,
	Download as DownloadIcon,
	Upload as UploadIcon,
} from '@mui/icons-material';
import type { AttachmentType } from '@/types/projectTypes';
import {
	useDeleteExpenseAttachmentMutation,
	useDeleteProjectAttachmentMutation,
	useDeleteRevenueAttachmentMutation,
	useGetExpenseAttachmentsQuery,
	useGetProjectAttachmentsQuery,
	useGetRevenueAttachmentsQuery,
	useUploadExpenseAttachmentMutation,
	useUploadProjectAttachmentMutation,
	useUploadRevenueAttachmentMutation,
} from '@/store/services/project';
import { extractApiErrorMessage, formatDate } from '@/utils/helpers';
import { useLanguage, useToast } from '@/utils/hooks';

type EntityAttachmentsViewProps = {
	attachments: AttachmentType[];
	isLoading: boolean;
	onUpload: (data: FormData) => Promise<unknown>;
	onDelete: (id: number) => Promise<unknown>;
};

const formatFileSize = (size: number | null) => {
	if (!size) return '';
	if (size < 1024) return `${size} B`;
	if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
	return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const EntityAttachmentsView: React.FC<EntityAttachmentsViewProps> = ({
	attachments,
	isLoading,
	onUpload,
	onDelete,
}) => {
	const { t } = useLanguage();
	const { onSuccess, onError } = useToast();
	const inputRef = useRef<HTMLInputElement>(null);
	const [label, setLabel] = useState('');
	const [isPending, setIsPending] = useState(false);

	const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		event.target.value = '';
		if (!file) return;

		const formData = new FormData();
		formData.append('file', file);
		if (label.trim()) {
			formData.append('label', label.trim());
		}

		setIsPending(true);
		try {
			await onUpload(formData);
			setLabel('');
			onSuccess(t.attachments.attachmentUploadedSuccess);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.attachments.attachmentUploadError));
		} finally {
			setIsPending(false);
		}
	};

	const handleDelete = async (attachmentId: number) => {
		setIsPending(true);
		try {
			await onDelete(attachmentId);
			onSuccess(t.attachments.attachmentDeletedSuccess);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.attachments.attachmentDeleteError));
		} finally {
			setIsPending(false);
		}
	};

	return (
		<Card elevation={2} sx={{ borderRadius: 2 }}>
			<CardContent sx={{ p: 3 }}>
				<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
					<AttachFileIcon color="primary" />
					<Typography variant="h6" sx={{ fontWeight: 700 }}>
						{t.attachments.title}
					</Typography>
				</Stack>
				<Divider sx={{ mb: 3 }} />

				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
					<TextField
						size="small"
						label={t.attachments.label}
						value={label}
						onChange={(event) => setLabel(event.target.value)}
						fullWidth
					/>
					<input ref={inputRef} type="file" hidden onChange={handleFileChange} />
					<Button
						variant="contained"
						startIcon={<UploadIcon />}
						disabled={isPending || isLoading}
						onClick={() => inputRef.current?.click()}
						sx={{ whiteSpace: 'nowrap' }}
					>
						{t.attachments.addAttachment}
					</Button>
				</Stack>

				{attachments.length === 0 ? (
					<Box sx={{ py: 2 }}>
						<Typography color="text.secondary">{t.attachments.noAttachments}</Typography>
					</Box>
				) : (
					<List dense disablePadding>
						{attachments.map((attachment, index) => (
							<React.Fragment key={attachment.id}>
								<ListItem
									disableGutters
									secondaryAction={
										<Stack direction="row" spacing={0.5}>
											{attachment.file_url && (
												<Tooltip title={t.common.download}>
													<IconButton
														size="small"
														component="a"
														href={attachment.file_url}
														target="_blank"
														rel="noreferrer"
													>
														<DownloadIcon fontSize="small" />
													</IconButton>
												</Tooltip>
											)}
											<Tooltip title={t.common.delete}>
												<IconButton
													size="small"
													color="error"
													disabled={isPending}
													onClick={() => handleDelete(attachment.id)}
												>
													<DeleteIcon fontSize="small" />
												</IconButton>
											</Tooltip>
										</Stack>
									}
								>
									<ListItemText
										primary={attachment.label || attachment.filename}
										secondary={[
											attachment.label ? attachment.filename : null,
											formatFileSize(attachment.file_size),
											formatDate(attachment.date_created),
										]
											.filter(Boolean)
											.join(' · ')}
										slotProps={{
											primary: { noWrap: true, sx: { pr: 8 } },
											secondary: { noWrap: true, sx: { pr: 8 } },
										}}
									/>
								</ListItem>
								{index < attachments.length - 1 && <Divider component="li" />}
							</React.Fragment>
						))}
					</List>
				)}
			</CardContent>
		</Card>
	);
};

export const ProjectAttachmentsCard: React.FC<{ id: number }> = ({ id }) => {
	const { data = [], isLoading } = useGetProjectAttachmentsQuery({ id });
	const [uploadAttachment] = useUploadProjectAttachmentMutation();
	const [deleteAttachment] = useDeleteProjectAttachmentMutation();

	return (
		<EntityAttachmentsView
			attachments={data}
			isLoading={isLoading}
			onUpload={(formData) => uploadAttachment({ id, data: formData }).unwrap()}
			onDelete={(attachmentId) => deleteAttachment({ id: attachmentId }).unwrap()}
		/>
	);
};

export const ExpenseAttachmentsCard: React.FC<{ id: number }> = ({ id }) => {
	const { data = [], isLoading } = useGetExpenseAttachmentsQuery({ id });
	const [uploadAttachment] = useUploadExpenseAttachmentMutation();
	const [deleteAttachment] = useDeleteExpenseAttachmentMutation();

	return (
		<EntityAttachmentsView
			attachments={data}
			isLoading={isLoading}
			onUpload={(formData) => uploadAttachment({ id, data: formData }).unwrap()}
			onDelete={(attachmentId) => deleteAttachment({ id: attachmentId }).unwrap()}
		/>
	);
};

export const RevenueAttachmentsCard: React.FC<{ id: number }> = ({ id }) => {
	const { data = [], isLoading } = useGetRevenueAttachmentsQuery({ id });
	const [uploadAttachment] = useUploadRevenueAttachmentMutation();
	const [deleteAttachment] = useDeleteRevenueAttachmentMutation();

	return (
		<EntityAttachmentsView
			attachments={data}
			isLoading={isLoading}
			onUpload={(formData) => uploadAttachment({ id, data: formData }).unwrap()}
			onDelete={(attachmentId) => deleteAttachment({ id: attachmentId }).unwrap()}
		/>
	);
};
