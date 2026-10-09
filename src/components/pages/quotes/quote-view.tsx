'use client';

import { isValidElement, useState, type FC, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Divider,
	Dialog,
	DialogContent,
	DialogTitle,
	IconButton,
	LinearProgress,
	Stack,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import { ThemeProvider } from '@/providers/scopedThemeProvider';
import {
	ArrowBack,
	Delete,
	Edit,
	Visibility,
	Add,
	Close,
	Assignment as AssignmentIcon,
	AttachMoney as AttachMoneyIcon,
	CalendarToday as CalendarTodayIcon,
	Category as CategoryIcon,
	Notes as NotesIcon,
	Person as PersonIcon,
	Percent as PercentIcon,
	ReceiptLong as ReceiptLongIcon,
	AccountBalanceWallet as AccountBalanceWalletIcon,
	CompareArrows as CompareArrowsIcon,
} from '@mui/icons-material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { frFR, enUS } from '@mui/x-data-grid/locales';
import { getDefaultTheme } from '@/utils/themes';
import { ExpenseFormContent } from '@/components/pages/expenses/expense-form';
import { ExpenseViewContent } from '@/components/pages/expenses/expense-view';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import type { SessionProps } from '@/types/_initTypes';
import { useGetQuoteQuery, useDeleteQuoteMutation, useGetExpensesQuery } from '@/store/services/project';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useLanguage, useToast } from '@/utils/hooks';
import { extractApiErrorMessage, formatDate } from '@/utils/helpers';
import { QUOTES_LIST, QUOTES_EDIT, PROJECTS_VIEW } from '@/utils/routes';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { useDataGridPagination } from '@/components/shared/paginatedDataGrid/useDataGridPagination';
import { QuoteAttachmentsViewSection } from '@/components/shared/entityAttachments/entityAttachments';
import Styles from '@/styles/dashboard/dashboard.module.sass';

interface InfoRowProps {
	icon: ReactNode;
	label: string;
	value: string | number | null | undefined | ReactNode;
}

const InfoRow: FC<InfoRowProps> = ({ icon, label, value }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const displayValue =
		isValidElement(value) || (value !== null && value !== undefined && value.toString().length > 0) ? value : '-';

	return (
		<Stack
			direction="row"
			spacing={2}
			sx={{
				alignItems: 'flex-start',
				py: 1.5,
				flexWrap: 'wrap',
			}}
		>
			<Box
				sx={{
					color: 'primary.main',
					display: 'flex',
					alignItems: 'center',
					minWidth: 40,
				}}
			>
				{icon}
			</Box>
			<Stack
				direction="row"
				spacing={isMobile ? 0 : 2}
				sx={{
					alignItems: 'center',
					flex: 1,
					minWidth: 0,
					flexWrap: 'wrap',
				}}
			>
				<Typography
					sx={{
						fontWeight: 600,
						color: 'text.secondary',
						minWidth: { xs: '100%', sm: 200 },
						wordBreak: 'break-word',
					}}
				>
					{label}
				</Typography>

				<Box sx={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
					{isValidElement(displayValue) ? (
						displayValue
					) : (
						<Typography sx={{ color: 'text.primary', whiteSpace: 'pre-wrap' }}>{displayValue}</Typography>
					)}
				</Box>
			</Stack>
		</Stack>
	);
};

type ExpenseModalState = { mode: 'create' } | { mode: 'view' | 'edit'; id: number };

const QuoteViewClient: FC<SessionProps & { id: number }> = ({ session, id }) => {
	const { t, language } = useLanguage();
	const router = useRouter();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const token = useInitAccessToken(session);
	const { data: quote, isLoading, error } = useGetQuoteQuery({ id }, { skip: !token });
	const {
		data: expenses = [],
		isLoading: expensesLoading,
		error: expensesError,
	} = useGetExpensesQuery({ quote: id }, { skip: !token });
	const [deleteQuote] = useDeleteQuoteMutation();
	const { onSuccess, onError } = useToast();
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [paginationModel, setPaginationModel] = useDataGridPagination();
	const [expenseModal, setExpenseModal] = useState<ExpenseModalState | null>(null);
	const [expenseSaving, setExpenseSaving] = useState(false);
	const columns: GridColDef[] = [
		{ field: 'description', headerName: t.common.description, flex: 1, minWidth: 180 },
		{
			field: 'date',
			headerName: t.common.date,
			minWidth: 175,
			type: 'date',
			valueGetter: (value) => (value ? new Date(value) : null),
			valueFormatter: (value: Date | null) => (value ? formatDate(value.toISOString()) : '—'),
		},
		{
			field: 'montant',
			valueFormatter: (value) => `${Number(value).toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD`,
			headerName: t.common.amount,
			minWidth: 150,
			type: 'number',
			valueGetter: (value) => Number(value),
		},
		{
			field: 'actions',
			headerName: t.common.actions,
			minWidth: 120,
			sortable: false,
			filterable: false,
			disableExport: true,
			renderCell: (params) => (
				<MobileActionsMenu
					actions={[
						{
							label: t.common.view,
							icon: <Visibility />,
							color: 'info',
							onClick: () => setExpenseModal({ mode: 'view', id: params.row.id }),
						},
					]}
				/>
			),
		},
	];
	const remove = async () => {
		if (deleting) return;
		setDeleting(true);
		try {
			await deleteQuote({ id }).unwrap();
			onSuccess(t.quotes.quoteDeletedSuccess);
			router.push(QUOTES_LIST);
		} catch (e) {
			onError(extractApiErrorMessage(e, t.quotes.quoteDeleteError));
		} finally {
			setDeleting(false);
			setConfirmDelete(false);
		}
	};
	const money = (value: string) => `${Number(value).toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD`;
	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} sx={{ mt: '32px' }}>
			<NavigationBar title={t.quotes.quoteDetails}>
				<Protected permission="can_view">
					<Stack spacing={3} sx={{ p: { xs: 2, md: 3 }, mt: 2 }}>
						<Stack
							direction={isMobile ? 'column' : 'row'}
							spacing={2}
							sx={{ justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center' }}
						>
							<Button
								variant="outlined"
								startIcon={<ArrowBack />}
								onClick={() => router.push(QUOTES_LIST)}
								sx={{ width: isMobile ? '100%' : 'auto' }}
							>
								{t.quotes.backToList}
							</Button>
							{!isLoading && !error && quote && (
								<Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
									<Protected permission="can_edit">
										<Button
											variant="outlined"
											size="small"
											startIcon={<Edit />}
											onClick={() => router.push(QUOTES_EDIT(id))}
										>
											{t.common.edit}
										</Button>
									</Protected>
									<Protected permission="can_delete">
										<Button
											variant="outlined"
											size="small"
											color="error"
											startIcon={<Delete />}
											onClick={() => setConfirmDelete(true)}
										>
											{t.common.delete}
										</Button>
									</Protected>
								</Stack>
							)}
						</Stack>
						{isLoading ? (
							<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
						) : error || !quote ? (
							<Alert severity="error">{t.quotes.loadError}</Alert>
						) : (
							<Stack spacing={3}>
								{quote.overrun && (
									<Alert severity="error">
										{t.quotes.overrun}: {money(String(-Number(quote.variance)))}
									</Alert>
								)}

								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack direction="row" spacing={3} sx={{ alignItems: 'center', mb: 2 }}>
											<ReceiptLongIcon color="primary" />
											<Typography variant="h6" sx={{ fontWeight: 700, overflowWrap: 'anywhere', minWidth: 0 }}>
												{quote.number}
											</Typography>
											<Chip
												size="small"
												label={t.quotes[quote.status]}
												variant="outlined"
												color={
													quote.status === 'validated' ? 'success' : quote.status === 'rejected' ? 'error' : 'info'
												}
											/>
										</Stack>
										<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
										<Stack spacing={0}>
											<InfoRow
												icon={<AssignmentIcon />}
												label={t.common.project}
												value={
													<Button
														onClick={() => router.push(PROJECTS_VIEW(quote.project))}
														sx={{
															p: 0,
															minWidth: 0,
															textTransform: 'none',
															textAlign: 'left',
															justifyContent: 'flex-start',
															whiteSpace: 'normal',
															overflowWrap: 'anywhere',
														}}
													>
														{quote.project_name}
													</Button>
												}
											/>
											<Divider />
											<InfoRow icon={<PersonIcon />} label={t.quotes.supplier} value={quote.supplier_name} />
											<Divider />
											<InfoRow icon={<AttachMoneyIcon />} label={t.quotes.amount_ht} value={money(quote.amount_ht)} />
											<Divider />
											<InfoRow icon={<PercentIcon />} label={t.quotes.amount_tva} value={money(quote.amount_tva)} />
											<Divider />
											<InfoRow
												icon={<AttachMoneyIcon />}
												label={t.quotes.amount_ttc}
												value={
													<Typography color="primary" sx={{ fontWeight: 600 }}>
														{money(quote.amount_ttc)}
													</Typography>
												}
											/>
											<Divider />
											<InfoRow icon={<CalendarTodayIcon />} label={t.common.date} value={formatDate(quote.date)} />
										</Stack>
									</CardContent>
								</Card>

								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
											<NotesIcon color="primary" />
											<Typography variant="h6" sx={{ fontWeight: 700 }}>
												{t.quotes.quoteDetails}
											</Typography>
										</Stack>
										<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
										<Stack spacing={0}>
											<InfoRow icon={<CategoryIcon />} label={t.common.category} value={quote.category_name} />
											<Divider />
											<InfoRow
												icon={<CategoryIcon />}
												label={t.expenses.subCategory}
												value={quote.sous_categorie_name}
											/>
											<Divider />
											<InfoRow icon={<NotesIcon />} label={t.common.description} value={quote.description} />
											<Divider />
											<InfoRow
												icon={<PersonIcon />}
												label={t.common.createdBy}
												value={quote.created_by_user_name ?? '—'}
											/>
										</Stack>
									</CardContent>
								</Card>

								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
											<AccountBalanceWalletIcon color="primary" />
											<Typography variant="h6" sx={{ fontWeight: 700 }}>
												{t.quotes.budgetTracking}
											</Typography>
										</Stack>
										<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
										<Stack spacing={0}>
											<InfoRow icon={<AttachMoneyIcon />} label={t.quotes.spent} value={money(quote.spent)} />
											<Divider />
											<InfoRow
												icon={<AccountBalanceWalletIcon />}
												label={t.quotes.remaining}
												value={money(quote.remaining)}
											/>
											<Divider />
											<InfoRow
												icon={<CompareArrowsIcon />}
												label={t.quotes.variance}
												value={
													<Typography
														color={quote.overrun ? 'error' : 'text.primary'}
														sx={{ fontWeight: quote.overrun ? 600 : 400 }}
													>
														{money(quote.variance)}
													</Typography>
												}
											/>
											<Divider />
											<InfoRow
												icon={<PercentIcon />}
												label={t.quotes.consumption}
												value={
													<Stack spacing={1}>
														<Typography color={quote.overrun ? 'error' : 'text.primary'}>
															{quote.consumption_percent ?? '—'} %
														</Typography>
														<LinearProgress
															aria-label={t.quotes.consumption}
															variant="determinate"
															value={Math.max(0, Math.min(100, Number(quote.consumption_percent)))}
															color={quote.overrun ? 'error' : 'primary'}
														/>
													</Stack>
												}
											/>
										</Stack>
									</CardContent>
								</Card>

								<QuoteAttachmentsViewSection id={id} />

								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack
											direction={isMobile ? 'column' : 'row'}
											spacing={2}
											sx={{ justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', mb: 2 }}
										>
											<Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
												<AttachMoneyIcon color="primary" />
												<Typography variant="h6" sx={{ fontWeight: 700 }}>
													{t.quotes.linkedExpenses}
												</Typography>
											</Stack>
											{quote.status === 'validated' && (
												<Protected permission="can_create">
													<Button
														variant="outlined"
														size="small"
														startIcon={<Add />}
														onClick={() => setExpenseModal({ mode: 'create' })}
													>
														{t.expenses.newExpense}
													</Button>
												</Protected>
											)}
										</Stack>
										<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
										{expensesError && <Alert severity="error">{t.quotes.loadError}</Alert>}
										<ThemeProvider theme={getDefaultTheme()}>
											<Box sx={{ width: '100%', height: expenses.length ? 430 : 320 }}>
												<DataGrid
													rows={expenses}
													columns={columns}
													loading={expensesLoading}
													pagination
													paginationModel={paginationModel}
													onPaginationModelChange={setPaginationModel}
													onFilterModelChange={() =>
														setPaginationModel((current) => (current.page === 0 ? current : { ...current, page: 0 }))
													}
													pageSizeOptions={[5, 10, 25, 50, 100]}
													localeText={(language === 'fr' ? frFR : enUS).components.MuiDataGrid.defaultProps.localeText}
													disableRowSelectionOnClick
													showToolbar
													slotProps={{ toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 500 } } }}
													sx={{
														'& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700 },
														'& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' },
													}}
												/>
											</Box>
										</ThemeProvider>
									</CardContent>
								</Card>
							</Stack>
						)}
					</Stack>
				</Protected>
			</NavigationBar>
			{quote && expenseModal && (
				<Protected
					permission={
						expenseModal.mode === 'create' ? 'can_create' : expenseModal.mode === 'edit' ? 'can_edit' : 'can_view'
					}
				>
					<Dialog
						open
						onClose={() => {
							if (!expenseSaving) setExpenseModal(null);
						}}
						fullWidth
						maxWidth="md"
						fullScreen={isMobile}
						aria-labelledby="quote-expense-dialog-title"
					>
						<DialogTitle
							id="quote-expense-dialog-title"
							sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
						>
							{expenseModal.mode === 'create'
								? t.expenses.newExpense
								: expenseModal.mode === 'edit'
									? t.expenses.editExpense
									: t.expenses.expenseDetails}
							<IconButton aria-label={t.common.close} onClick={() => setExpenseModal(null)} disabled={expenseSaving}>
								<Close />
							</IconButton>
						</DialogTitle>
						<DialogContent dividers sx={{ p: 0 }}>
							{expenseModal.mode === 'view' ? (
								<ExpenseViewContent
									token={token}
									id={expenseModal.id}
									embedded
									onEdit={() => setExpenseModal({ mode: 'edit', id: expenseModal.id })}
									onDeleted={() => setExpenseModal(null)}
								/>
							) : (
								<ExpenseFormContent
									token={token}
									id={expenseModal.mode === 'edit' ? expenseModal.id : undefined}
									quote={quote}
									onSaved={() =>
										setExpenseModal(expenseModal.mode === 'edit' ? { mode: 'view', id: expenseModal.id } : null)
									}
									onCancel={() =>
										setExpenseModal(expenseModal.mode === 'edit' ? { mode: 'view', id: expenseModal.id } : null)
									}
									onSubmittingChange={setExpenseSaving}
								/>
							)}
						</DialogContent>
					</Dialog>
				</Protected>
			)}

			{confirmDelete && (
				<ActionModals
					title={t.quotes.deleteQuote}
					body={t.quotes.deleteQuoteConfirm}
					titleIcon={<Delete />}
					titleIconColor="#D32F2F"
					actions={[
						{
							text: t.common.cancel,
							active: false,
							onClick: () => setConfirmDelete(false),
							icon: <ArrowBack />,
							color: '#6B6B6B',
						},
						{ text: t.common.delete, active: !deleting, onClick: remove, icon: <Delete />, color: '#D32F2F' },
					]}
				/>
			)}
		</Stack>
	);
};
export default QuoteViewClient;
