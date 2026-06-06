'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Alert,
	Button,
	Card,
	CardContent,
	Divider,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	AttachMoney as AttachMoneyIcon,
	Build as BuildIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	Person as PersonIcon,
} from '@mui/icons-material';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useDeleteSupplierMutation, useGetSupplierQuery } from '@/store/services/project';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { Protected } from '@/components/layouts/protected/protected';
import { PROJECTS_VIEW, SUPPLIERS_EDIT, SUPPLIERS_LIST } from '@/utils/routes';
import { extractApiErrorMessage, formatDate } from '@/utils/helpers';
import { useLanguage, useToast } from '@/utils/hooks';

const money = (value: string | number) => `${Number(value || 0).toLocaleString('fr-MA')} MAD`;

const SupplierViewClient: React.FC<SessionProps & { id: number }> = ({ session, id }) => {
	const { t } = useLanguage();
	const router = useRouter();
	const token = useInitAccessToken(session);
	const { data: supplier, isLoading, error } = useGetSupplierQuery({ id }, { skip: !token });
	const axiosError = useMemo(() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined), [error]);
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const [deleteSupplier] = useDeleteSupplierMutation();
	const { onSuccess, onError } = useToast();
	const [showDeleteModal, setShowDeleteModal] = useState(false);

	const handleDelete = async () => {
		try {
			await deleteSupplier({ id }).unwrap();
			onSuccess(t.suppliers.supplierDeletedSuccess);
			router.push(SUPPLIERS_LIST);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.suppliers.supplierDeleteError));
		} finally {
			setShowDeleteModal(false);
		}
	};

	const deleteModalActions = [
		{ text: t.common.cancel, active: false, onClick: () => setShowDeleteModal(false), icon: <ArrowBackIcon />, color: '#6B6B6B' },
		{ text: t.common.delete, active: true, onClick: handleDelete, icon: <DeleteIcon />, color: '#D32F2F' },
	];

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} sx={{ mt: '32px' }}>
			<NavigationBar title={t.suppliers.supplierDetails}>
				<Protected permission="can_view">
					<Stack spacing={3} sx={{ p: { xs: 2, md: 3 }, mt: 2 }}>
						<Stack direction={isMobile ? 'column' : 'row'} spacing={2} sx={{ justifyContent: 'space-between' }}>
							<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(SUPPLIERS_LIST)}>
								{t.suppliers.suppliersList}
							</Button>
							{supplier && (
								<Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
									<Protected permission="can_edit">
										<Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={() => router.push(SUPPLIERS_EDIT(id))}>
											{t.common.edit}
										</Button>
									</Protected>
									<Protected permission="can_delete">
										<Button variant="outlined" color="error" size="small" startIcon={<DeleteIcon />} onClick={() => setShowDeleteModal(true)}>
											{t.common.delete}
										</Button>
									</Protected>
								</Stack>
							)}
						</Stack>
						{isLoading ? (
							<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
						) : (axiosError?.status as number) > 400 ? (
							<ApiAlert errorDetails={axiosError?.data.details} />
						) : !supplier ? (
							<Alert severity="warning">{t.suppliers.supplierNotFound}</Alert>
						) : (
							<Stack spacing={3}>
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
											<BuildIcon color="primary" />
											<Typography variant="h6" sx={{ fontWeight: 700 }}>
												{supplier.nom}
											</Typography>
										</Stack>
										<Divider sx={{ mb: 2 }} />
										<Stack spacing={1.5}>
											<Typography><PersonIcon fontSize="small" /> {t.suppliers.contact}: {supplier.contact || '-'}</Typography>
											<Typography><BuildIcon fontSize="small" /> {t.suppliers.speciality}: {supplier.specialite || '-'}</Typography>
											<Typography sx={{ fontWeight: 700 }}><AttachMoneyIcon fontSize="small" /> {t.suppliers.totalPaid}: {money(supplier.total_paid)}</Typography>
										</Stack>
									</CardContent>
								</Card>
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
											{t.suppliers.paymentsHistory}
										</Typography>
										<TableContainer>
											<Table size="small">
												<TableHead>
													<TableRow>
														<TableCell>{t.common.date}</TableCell>
														<TableCell>{t.common.project}</TableCell>
														<TableCell>{t.common.description}</TableCell>
														<TableCell align="right">{t.common.amount}</TableCell>
													</TableRow>
												</TableHead>
												<TableBody>
													{supplier.payments.length === 0 ? (
														<TableRow>
															<TableCell colSpan={4}>{t.suppliers.noSupplierFound}</TableCell>
														</TableRow>
													) : (
														supplier.payments.map((payment) => (
															<TableRow key={payment.id} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(PROJECTS_VIEW(payment.project))}>
																<TableCell>{formatDate(payment.date)}</TableCell>
																<TableCell>{payment.project_name}</TableCell>
																<TableCell>{payment.description}</TableCell>
																<TableCell align="right">{money(payment.montant)}</TableCell>
															</TableRow>
														))
													)}
												</TableBody>
											</Table>
										</TableContainer>
									</CardContent>
								</Card>
							</Stack>
						)}
					</Stack>
				</Protected>
			</NavigationBar>
			{showDeleteModal && (
				<ActionModals title={t.suppliers.deleteSupplier} body={t.suppliers.deleteSupplierConfirm} actions={deleteModalActions} titleIcon={<DeleteIcon />} titleIconColor="#D32F2F" />
			)}
		</Stack>
	);
};

export default SupplierViewClient;
