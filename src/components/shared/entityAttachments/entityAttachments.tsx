'use client';

import React, { useRef, useState } from 'react';
import {
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Divider,
	IconButton,
	LinearProgress,
	Stack,
	TextField,
	Tooltip,
	Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
	AttachFile as AttachFileIcon,
	CloudUpload as CloudUploadIcon,
	Delete as DeleteIcon,
	Download as DownloadIcon,
	Image as ImageIcon,
	InsertDriveFile as InsertDriveFileIcon,
	PictureAsPdf as PictureAsPdfIcon,
	UploadFile as UploadFileIcon,
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

export type QueuedAttachment = {
	id: string;
	file: File;
	label: string;
};

type EntityAttachmentsFormProps = {
	attachments: AttachmentType[];
	queuedAttachments: QueuedAttachment[];
	isLoading: boolean;
	onQueueAttachments: (items: QueuedAttachment[]) => void;
	onRemoveQueuedAttachment: (id: string) => void;
	onUpload?: (data: FormData) => Promise<unknown>;
	onDelete?: (id: number) => Promise<unknown>;
};

type AttachmentRowProps = {
	icon: React.ReactNode;
	title: string;
	subtitle: string;
	actions: React.ReactNode;
	status?: string;
	statusColor?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
};

const formatFileSize = (size: number | null | undefined) => {
	if (!size) return '';
	if (size < 1024) return `${size} B`;
	if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
	return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export const buildAttachmentFormData = (attachment: Pick<QueuedAttachment, 'file' | 'label'>) => {
	const formData = new FormData();
	formData.append('file', attachment.file);
	if (attachment.label.trim()) {
		formData.append('label', attachment.label.trim());
	}
	return formData;
};

const makeQueuedAttachmentId = () => {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
		return crypto.randomUUID();
	}
	return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const getFileIcon = (filename: string, mimeType?: string) => {
	const lowerFilename = filename.toLowerCase();
	if (mimeType === 'application/pdf' || lowerFilename.endsWith('.pdf')) {
		return <PictureAsPdfIcon fontSize="small" />;
	}
	if (mimeType?.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/.test(lowerFilename)) {
		return <ImageIcon fontSize="small" />;
	}
	return <InsertDriveFileIcon fontSize="small" />;
};

const AttachmentRow: React.FC<AttachmentRowProps> = ({ icon, title, subtitle, actions, status, statusColor = 'default' }) => {
	return (
		<Box
			sx={(theme) => ({
				display: 'flex',
				alignItems: 'center',
				gap: 1.5,
				px: 1.5,
				py: 1.25,
				border: '1px solid',
				borderColor: 'divider',
				borderRadius: 1.5,
				bgcolor: 'background.paper',
				transition: theme.transitions.create(['border-color', 'background-color'], {
					duration: theme.transitions.duration.shortest,
				}),
				'&:hover': {
					borderColor: alpha(theme.palette.primary.main, 0.35),
					bgcolor: alpha(theme.palette.primary.main, 0.03),
				},
			})}
		>
			<Box
				sx={(theme) => ({
					width: 36,
					height: 36,
					borderRadius: 1.25,
					display: 'grid',
					placeItems: 'center',
					color: 'primary.main',
					bgcolor: alpha(theme.palette.primary.main, 0.1),
					flexShrink: 0,
				})}
			>
				{icon}
			</Box>
			<Box sx={{ minWidth: 0, flex: 1 }}>
				<Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
					{title}
				</Typography>
				<Typography variant="caption" color="text.secondary" noWrap component="div">
					{subtitle}
				</Typography>
			</Box>
			{status ? <Chip label={status} size="small" color={statusColor} variant="outlined" sx={{ flexShrink: 0 }} /> : null}
			<Stack direction="row" spacing={0.25} sx={{ flexShrink: 0 }}>
				{actions}
			</Stack>
		</Box>
	);
};

const EntityAttachmentsForm: React.FC<EntityAttachmentsFormProps> = ({
	attachments,
	queuedAttachments,
	isLoading,
	onQueueAttachments,
	onRemoveQueuedAttachment,
	onUpload,
	onDelete,
}) => {
	const { t } = useLanguage();
	const { onSuccess, onError } = useToast();
	const inputRef = useRef<HTMLInputElement>(null);
	const [label, setLabel] = useState('');
	const [isPending, setIsPending] = useState(false);
	const [isDragging, setIsDragging] = useState(false);

	const handleSelectedFiles = async (files: File[]) => {
		if (files.length === 0) return;

		const selected = files.map((file) => ({
			id: makeQueuedAttachmentId(),
			file,
			label: label.trim(),
		}));

		if (!onUpload) {
			onQueueAttachments(selected);
			setLabel('');
			return;
		}

		setIsPending(true);
		try {
			for (const item of selected) {
				await onUpload(buildAttachmentFormData(item));
			}
			setLabel('');
			onSuccess(t.attachments.attachmentUploadedSuccess);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.attachments.attachmentUploadError));
		} finally {
			setIsPending(false);
		}
	};

	const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(event.target.files ?? []);
		event.target.value = '';
		await handleSelectedFiles(files);
	};

	const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		setIsDragging(false);
		await handleSelectedFiles(Array.from(event.dataTransfer.files ?? []));
	};

	const handleDelete = async (attachmentId: number) => {
		if (!onDelete) return;
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

	const totalFiles = attachments.length + queuedAttachments.length;
	const countLabel = `${totalFiles} ${totalFiles > 1 ? t.attachments.files : t.attachments.file}`;
	const hasAttachments = totalFiles > 0;

	return (
		<Card elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
			<CardContent sx={{ p: 0 }}>
				<Stack
					direction={{ xs: 'column', sm: 'row' }}
					spacing={1.5}
					sx={{
						alignItems: { xs: 'flex-start', sm: 'center' },
						justifyContent: 'space-between',
						p: 3,
						pb: 2,
					}}
				>
					<Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
						<Box
							sx={(theme) => ({
								width: 40,
								height: 40,
								borderRadius: 1.5,
								display: 'grid',
								placeItems: 'center',
								color: 'primary.main',
								bgcolor: alpha(theme.palette.primary.main, 0.1),
							})}
						>
							<AttachFileIcon />
						</Box>
						<Box>
							<Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
								{t.attachments.title}
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{countLabel}
							</Typography>
						</Box>
					</Stack>
					{queuedAttachments.length > 0 ? (
						<Chip size="small" color="warning" variant="outlined" label={`${queuedAttachments.length} ${t.attachments.pendingUpload}`} />
					) : null}
				</Stack>
				<Divider />

				<Stack spacing={2} sx={{ p: 3 }}>
					<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ alignItems: { xs: 'stretch', md: 'center' } }}>
						<TextField
							size="small"
							label={t.attachments.label}
							value={label}
							onChange={(event) => setLabel(event.target.value)}
							fullWidth
						/>
						<Button
							variant="contained"
							startIcon={<UploadFileIcon />}
							disabled={isPending || isLoading}
							onClick={() => inputRef.current?.click()}
							sx={{ minWidth: { xs: '100%', md: 180 }, whiteSpace: 'nowrap' }}
						>
							{t.attachments.chooseFiles}
						</Button>
					</Stack>

					<Box
						role="button"
						tabIndex={0}
						onClick={() => inputRef.current?.click()}
						onKeyDown={(event) => {
							if (event.key === 'Enter' || event.key === ' ') {
								event.preventDefault();
								inputRef.current?.click();
							}
						}}
						onDragOver={(event) => {
							event.preventDefault();
							setIsDragging(true);
						}}
						onDragLeave={() => setIsDragging(false)}
						onDrop={handleDrop}
						sx={(theme) => ({
							display: 'flex',
							alignItems: 'center',
							gap: 2,
							minHeight: 96,
							px: 2,
							py: 2,
							border: '1px dashed',
							borderColor: isDragging ? 'primary.main' : alpha(theme.palette.text.primary, 0.22),
							borderRadius: 1.5,
							bgcolor: isDragging ? alpha(theme.palette.primary.main, 0.08) : alpha(theme.palette.primary.main, 0.025),
							cursor: 'pointer',
							outline: 'none',
							transition: theme.transitions.create(['background-color', 'border-color'], {
								duration: theme.transitions.duration.shortest,
							}),
							'&:focus-visible': {
								borderColor: 'primary.main',
								boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.14)}`,
							},
						})}
					>
						<input ref={inputRef} type="file" hidden multiple onChange={handleFileChange} />
						<Box
							sx={(theme) => ({
								width: 46,
								height: 46,
								borderRadius: 1.5,
								display: 'grid',
								placeItems: 'center',
								color: 'primary.main',
								bgcolor: alpha(theme.palette.primary.main, 0.12),
								flexShrink: 0,
							})}
						>
							<CloudUploadIcon />
						</Box>
						<Box sx={{ minWidth: 0 }}>
							<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
								{t.attachments.dropFiles}
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{t.attachments.fileHint}
							</Typography>
						</Box>
					</Box>

					{isPending || isLoading ? <LinearProgress /> : null}

					{!hasAttachments ? (
						<Box sx={{ py: 0.5 }}>
							<Typography color="text.secondary">{t.attachments.noAttachments}</Typography>
						</Box>
					) : (
						<Stack spacing={1}>
							{queuedAttachments.map((attachment) => (
								<AttachmentRow
									key={attachment.id}
									icon={getFileIcon(attachment.file.name, attachment.file.type)}
									title={attachment.label || attachment.file.name}
									subtitle={[
										attachment.label ? attachment.file.name : null,
										formatFileSize(attachment.file.size),
									]
										.filter(Boolean)
										.join(' · ')}
									status={t.attachments.pendingUpload}
									statusColor="warning"
									actions={
										<Tooltip title={t.common.delete}>
											<IconButton
												size="small"
												color="error"
												disabled={isPending}
												onClick={(event) => {
													event.stopPropagation();
													onRemoveQueuedAttachment(attachment.id);
												}}
											>
												<DeleteIcon fontSize="small" />
											</IconButton>
										</Tooltip>
									}
								/>
							))}
							{attachments.map((attachment) => (
								<AttachmentRow
									key={attachment.id}
									icon={getFileIcon(attachment.filename)}
									title={attachment.label || attachment.filename}
									subtitle={[
										attachment.label ? attachment.filename : null,
										formatFileSize(attachment.file_size),
										formatDate(attachment.date_created),
									]
										.filter(Boolean)
										.join(' · ')}
									actions={
										<>
											{attachment.file_url ? (
												<Tooltip title={t.common.download}>
													<IconButton
														size="small"
														component="a"
														href={attachment.file_url}
														target="_blank"
														rel="noreferrer"
														onClick={(event) => event.stopPropagation()}
													>
														<DownloadIcon fontSize="small" />
													</IconButton>
												</Tooltip>
											) : null}
											<Tooltip title={t.common.delete}>
												<IconButton
													size="small"
													color="error"
													disabled={isPending || !onDelete}
													onClick={(event) => {
														event.stopPropagation();
														handleDelete(attachment.id);
													}}
												>
													<DeleteIcon fontSize="small" />
												</IconButton>
											</Tooltip>
										</>
									}
								/>
							))}
						</Stack>
					)}
				</Stack>
			</CardContent>
		</Card>
	);
};

type FormSectionProps = {
	id?: number;
	queuedAttachments: QueuedAttachment[];
	setQueuedAttachments: React.Dispatch<React.SetStateAction<QueuedAttachment[]>>;
};

export const ProjectAttachmentsFormSection: React.FC<FormSectionProps> = ({ id, queuedAttachments, setQueuedAttachments }) => {
	const { data = [], isLoading } = useGetProjectAttachmentsQuery({ id: id! }, { skip: !id });
	const [uploadAttachment] = useUploadProjectAttachmentMutation();
	const [deleteAttachment] = useDeleteProjectAttachmentMutation();

	return (
		<EntityAttachmentsForm
			attachments={id ? data : []}
			queuedAttachments={id ? [] : queuedAttachments}
			isLoading={isLoading}
			onQueueAttachments={(items) => setQueuedAttachments((current) => [...current, ...items])}
			onRemoveQueuedAttachment={(attachmentId) =>
				setQueuedAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId))
			}
			onUpload={id ? (formData) => uploadAttachment({ id, data: formData }).unwrap() : undefined}
			onDelete={id ? (attachmentId) => deleteAttachment({ id: attachmentId }).unwrap() : undefined}
		/>
	);
};

export const ExpenseAttachmentsFormSection: React.FC<FormSectionProps> = ({ id, queuedAttachments, setQueuedAttachments }) => {
	const { data = [], isLoading } = useGetExpenseAttachmentsQuery({ id: id! }, { skip: !id });
	const [uploadAttachment] = useUploadExpenseAttachmentMutation();
	const [deleteAttachment] = useDeleteExpenseAttachmentMutation();

	return (
		<EntityAttachmentsForm
			attachments={id ? data : []}
			queuedAttachments={id ? [] : queuedAttachments}
			isLoading={isLoading}
			onQueueAttachments={(items) => setQueuedAttachments((current) => [...current, ...items])}
			onRemoveQueuedAttachment={(attachmentId) =>
				setQueuedAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId))
			}
			onUpload={id ? (formData) => uploadAttachment({ id, data: formData }).unwrap() : undefined}
			onDelete={id ? (attachmentId) => deleteAttachment({ id: attachmentId }).unwrap() : undefined}
		/>
	);
};

export const RevenueAttachmentsFormSection: React.FC<FormSectionProps> = ({ id, queuedAttachments, setQueuedAttachments }) => {
	const { data = [], isLoading } = useGetRevenueAttachmentsQuery({ id: id! }, { skip: !id });
	const [uploadAttachment] = useUploadRevenueAttachmentMutation();
	const [deleteAttachment] = useDeleteRevenueAttachmentMutation();

	return (
		<EntityAttachmentsForm
			attachments={id ? data : []}
			queuedAttachments={id ? [] : queuedAttachments}
			isLoading={isLoading}
			onQueueAttachments={(items) => setQueuedAttachments((current) => [...current, ...items])}
			onRemoveQueuedAttachment={(attachmentId) =>
				setQueuedAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId))
			}
			onUpload={id ? (formData) => uploadAttachment({ id, data: formData }).unwrap() : undefined}
			onDelete={id ? (attachmentId) => deleteAttachment({ id: attachmentId }).unwrap() : undefined}
		/>
	);
};
