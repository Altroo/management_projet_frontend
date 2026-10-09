import { useState } from 'react';
import { Box, Chip, Divider, Paper, Stack, Typography } from '@mui/material';
import { DeleteOutlined, EditOutlined, OpenInNew, PictureAsPdfOutlined } from '@mui/icons-material';
import { useLanguage } from '@/utils/hooks';
import TextButton from '@/components/htmlElements/buttons/textButton/textButton';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import styles from './chat-ai.module.sass';
import type { ChatCard, NavigationTarget } from './types';

const resources: Record<string, [string, string]> = {
	project: ['Projet', 'Project'],
	client: ['Client', 'Customer'],
	supplier: ['Fournisseur', 'Supplier'],
	quote: ['Devis', 'Quote'],
	expense: ['Dépense', 'Expense'],
	revenue: ['Revenu', 'Receipt'],
	payment_schedule: ['Échéance', 'Payment schedule'],
	budget_entry: ['Budget réel', 'Actual budget'],
	category: ['Catégorie', 'Category'],
	subcategory: ['Sous-catégorie', 'Subcategory'],
};
const metrics: Record<string, [string, string]> = {
	revenue: ['Encaissements', 'Receipts'],
	expenses: ['Dépenses', 'Expenses'],
	profit: ['Bénéfice', 'Profit'],
	service_fees: ['Frais de service', 'Service fees'],
	budget: ['Budget saisi', 'Entered budget'],
	estimates: ['Budget prévisionnel des devis validés (TTC)', 'Validated quote estimate (including tax)'],
};
const fields: Record<string, [string, string]> = {
	nom: ['Nom', 'Name'],
	description: ['Description', 'Description'],
	notes: ['Notes', 'Notes'],
	telephone: ['Téléphone', 'Phone'],
	email: ['E-mail', 'Email'],
	ville: ['Ville', 'City'],
	adresse: ['Adresse', 'Address'],
	contact: ['Contact', 'Contact'],
	specialite: ['Spécialité', 'Specialty'],
	number: ['Numéro de devis', 'Quote number'],
	date: ['Date', 'Date'],
	status: ['Statut', 'Status'],
	chef_de_projet: ['Chef de projet', 'Project manager'],
	date_debut: ['Date de début', 'Start date'],
	date_fin: ['Date de fin', 'End date'],
	budget_total: ['Budget total', 'Total budget'],
	montant: ['Montant', 'Amount'],
	amount_ht: ['Montant HT', 'Amount excluding tax'],
	amount_tva: ['TVA', 'VAT'],
	due_date: ['Date prévue', 'Due date'],
	expected_amount: ['Montant prévu', 'Expected amount'],
	stage: ['Étape du projet', 'Project stage'],
	montant_client: ['Montant facturé au client', 'Amount invoiced to customer'],
	montant_fournisseur: ['Montant payé au fournisseur', 'Amount paid to supplier'],
	element: ['Élément de dépenses', 'Expense item'],
};
const editable: Record<string, string[]> = {
	project: ['nom', 'description', 'notes', 'chef_de_projet', 'date_debut', 'date_fin', 'budget_total', 'status'],
	client: ['nom', 'telephone', 'email', 'ville', 'adresse'],
	supplier: ['nom', 'contact', 'specialite'],
	quote: ['description', 'number', 'date', 'amount_ht', 'amount_tva', 'status'],
	expense: ['description', 'notes', 'element', 'date', 'montant'],
	revenue: ['description', 'notes', 'date', 'montant'],
	payment_schedule: ['description', 'notes', 'due_date', 'expected_amount'],
	budget_entry: ['stage', 'description', 'notes', 'date', 'montant_client', 'montant_fournisseur'],
};
export const validConfirmation = (card: ChatCard) => {
	if (
		card.type !== 'confirmation' ||
		card.company_id !== 1 ||
		!card.action_id ||
		!Number.isSafeInteger(card.record_id) ||
		card.record_id! < 1 ||
		!Object.hasOwn(editable, card.resource ?? '')
	)
		return false;
	const changes = card.changes ?? {};
	if (typeof changes !== 'object' || Array.isArray(changes)) return false;
	const keys = Object.keys(changes);
	if (card.operation === 'delete') return keys.length === 0;
	return (
		card.operation === 'update' &&
		keys.length > 0 &&
		keys.every(
			(key) => editable[card.resource!].includes(key) && (typeof changes[key] === 'string' || changes[key] === null),
		)
	);
};
type Props = {
	cards: ChatCard[];
	navigate: (target: NavigationTarget) => void;
	confirm?: (card: ChatCard) => Promise<void>;
	pdf?: (id: number, resource?: string) => void;
	select?: (resource: string, identifier: number, operation: 'edit' | 'delete') => void;
	permissions?: { can_update: boolean; can_delete: boolean; can_print: boolean };
};
export const ChatAIResults = ({ cards, navigate, confirm, pdf, select, permissions }: Props) => {
	const { language } = useLanguage();
	const en = language === 'en';
	const index = en ? 1 : 0;
	const [pending, setPending] = useState<ChatCard | null>(null);
	const [sending, setSending] = useState(false);
	const [done, setDone] = useState<Set<string>>(new Set());
	const action = async () => {
		if (!pending || !confirm || sending || !validConfirmation(pending)) return;
		setSending(true);
		try {
			await confirm(pending);
			setDone((old) => new Set(old).add(pending.action_id!));
			setPending(null);
		} finally {
			setSending(false);
		}
	};
	const label = (resource?: string) => resources[resource ?? '']?.[index] ?? (en ? 'Record' : 'Document');
	const amount = (value?: string) =>
		value === undefined
			? ''
			: new Intl.NumberFormat(en ? 'en-GB' : 'fr-FR', { maximumFractionDigits: 2 }).format(Number(value));
	return (
		<Stack spacing={1.5}>
			{cards.map((card, i) => (
				<Box key={i}>
					{card.items && (
						<>
							<Typography variant="caption" color="text.secondary">
								{card.items.length
									? `${card.items.length} ${en ? 'result(s)' : 'résultat(s)'}`
									: en
										? 'No matching result. Refine your search.'
										: 'Aucun résultat trouvé. Précisez votre recherche.'}
							</Typography>
							{card.items.map((record) => (
								<Paper key={record.id} variant="outlined" className={styles.result}>
									<Typography variant="caption" color="text.secondary">
										{label(card.resource)}
									</Typography>
									<Stack direction="row" sx={{ gap: 1, justifyContent: 'space-between', flexWrap: 'wrap' }}>
										<Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
											{record.name}
										</Typography>
										{record.status && <Chip size="small" variant="outlined" label={record.status} />}
									</Stack>
									{record.project && (
										<Typography variant="body2">
											{en ? 'Project' : 'Projet'} : {record.project}
										</Typography>
									)}
									{record.client && (
										<Typography variant="body2">
											{en ? 'Customer' : 'Client'} : {record.client}
										</Typography>
									)}
									{record.supplier && (
										<Typography variant="body2">
											{en ? 'Supplier' : 'Fournisseur'} : {record.supplier}
										</Typography>
									)}
									{record.description && (
										<Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
											{record.description}
										</Typography>
									)}
									{record.date && (
										<Typography variant="caption" color="text.secondary">
											{record.date}
										</Typography>
									)}
									{record.amount !== undefined && (
										<Typography variant="body2" sx={{ fontWeight: 600 }}>
											{amount(record.amount)} {record.currency}
										</Typography>
									)}
									{record.details?.map((detail) => (
										<Typography key={detail.label} variant="body2">
											{en ? detail.label_en : detail.label} : {detail.value}
										</Typography>
									))}
									<Divider sx={{ my: 1 }} />
									<Stack direction="row" sx={{ gap: 0.5, flexWrap: 'wrap' }}>
										{record.navigation && (
											<TextButton
												cssClass={styles.resultAction}
												buttonText={en ? 'Open' : 'Voir'}
												startIcon={<OpenInNew fontSize="small" />}
												onClick={() => navigate(record.navigation!)}
											/>
										)}
										{permissions?.can_update &&
											select &&
											['project', 'client', 'supplier', 'quote', 'expense', 'revenue'].includes(
												card.resource ?? '',
											) && (
												<TextButton
													cssClass={styles.resultAction}
													buttonText={en ? 'Edit' : 'Modifier'}
													startIcon={<EditOutlined fontSize="small" />}
													onClick={() => select(card.resource!, record.id, 'edit')}
												/>
											)}
										{permissions?.can_delete && select && Object.hasOwn(editable, card.resource ?? '') && (
											<TextButton
												cssClass={styles.resultAction}
												buttonText={en ? 'Delete' : 'Supprimer'}
												startIcon={<DeleteOutlined fontSize="small" />}
												onClick={() => select(card.resource!, record.id, 'delete')}
											/>
										)}
										{permissions?.can_print && card.resource === 'project' && pdf && (
											<TextButton
												cssClass={styles.resultAction}
												buttonText="PDF"
												startIcon={<PictureAsPdfOutlined fontSize="small" />}
												onClick={() => pdf(record.id, 'project')}
											/>
										)}
									</Stack>
								</Paper>
							))}
							{card.has_more && (
								<Typography variant="caption">
									{en
										? 'More results exist. Refine your search.'
										: 'D’autres résultats existent. Précisez votre recherche.'}
								</Typography>
							)}
						</>
					)}
					{card.type === 'financial_summary' && (
						<Paper variant="outlined" className={styles.result}>
							<Typography variant="body2">
								{metrics[card.metric ?? '']?.[index] ?? (en ? 'Summary' : 'Synthèse')}
							</Typography>
							<Typography variant="h6">
								{amount(card.value)} {card.currency}
							</Typography>
							<Typography variant="caption">
								{card.scope === 'all_projects' ? (en ? 'All projects' : 'Tous les projets') : card.scope} ·{' '}
								{card.period ? `${card.period.from} → ${card.period.to}` : en ? 'All time' : 'Toutes les dates'}
							</Typography>
						</Paper>
					)}
					{card.type === 'confirmation_status' && <Typography variant="body2">{card.message}</Typography>}
					{card.type === 'confirmation' && (
						<Paper variant="outlined" className={styles.result}>
							<Typography variant="body2" sx={{ fontWeight: 600 }}>
								{card.operation === 'delete' ? (en ? 'Delete' : 'Supprimer') : en ? 'Edit' : 'Modifier'}{' '}
								{label(card.resource)} : {card.label}
							</Typography>
							{validConfirmation(card) &&
								Object.keys(card.changes ?? {}).map((key) => (
									<Typography key={key} variant="body2">
										{fields[key]?.[index]} : {card.before?.[key] ?? '—'} → {card.changes?.[key] ?? '—'}
									</Typography>
								))}
							<TextButton
								cssClass={styles.resultAction}
								buttonText={
									done.has(card.action_id!)
										? en
											? 'Action completed'
											: 'Action effectuée'
										: en
											? 'Review this action'
											: 'Vérifier cette action'
								}
								disabled={!validConfirmation(card) || !confirm || done.has(card.action_id!)}
								onClick={() => setPending(card)}
							/>
						</Paper>
					)}
					{card.type === 'pdf' && card.record_id && (
						<TextButton
							buttonText={en ? 'Download project PDF' : 'Télécharger le rapport PDF du projet'}
							onClick={() => pdf?.(card.record_id!, 'project')}
						/>
					)}
					{card.target && (
						<TextButton
							cssClass={styles.resultAction}
							buttonText={en ? 'Open page' : 'Ouvrir la page'}
							onClick={() => navigate(card.target!)}
						/>
					)}
					{card.documents?.map((doc) => (
						<Typography key={doc.document_id} variant="caption" color="text.secondary">
							Source : {doc.title}
						</Typography>
					))}
				</Box>
			))}
			{pending && (
				<ActionModals
					title={`${pending.operation === 'delete' ? (en ? 'Delete' : 'Supprimer') : en ? 'Edit' : 'Modifier'} ${pending.label}`}
					body={pending.warning}
					onClose={() => {
						if (!sending) setPending(null);
					}}
					actions={[
						{ text: en ? 'Cancel' : 'Annuler', active: false, disabled: sending, onClick: () => setPending(null) },
						{
							text: sending ? (en ? 'Sending…' : 'En cours…') : en ? 'Confirm this action' : 'Confirmer cette action',
							active: true,
							disabled: sending || !validConfirmation(pending),
							color: pending.operation === 'delete' ? '#C62828' : '#0274D7',
							onClick: () => {
								void action().catch(() => {});
							},
						},
					]}
				>
					{Object.keys(pending.changes ?? {})
						.filter((key) => Object.hasOwn(fields, key))
						.map((key) => (
							<Typography key={key} variant="body2">
								{fields[key][index]} : {pending.before?.[key] ?? '—'} → {pending.changes?.[key] ?? '—'}
							</Typography>
						))}
				</ActionModals>
			)}
		</Stack>
	);
};
