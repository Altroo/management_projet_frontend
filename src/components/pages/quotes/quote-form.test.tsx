import { type ReactNode, type ChangeEvent } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { format } from 'date-fns';
import QuoteFormClient from './quote-form';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockUpload = jest.fn();
const mockOnError = jest.fn();
let mockQuote: Record<string, unknown> | undefined;

jest.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush, replace: mockReplace, back: jest.fn() }),
	useSearchParams: () => new URLSearchParams(),
}));
jest.mock('@/contexts/InitContext', () => ({ useInitAccessToken: () => 'token' }));
jest.mock('@/utils/hooks', () => ({
	useLanguage: () => ({ t: jest.requireActual('@/translations/fr').fr }),
	useToast: () => ({ onSuccess: jest.fn(), onError: mockOnError }),
}));
jest.mock('@/utils/helpers', () => ({
	hexToRGB: () => 'rgba(0, 0, 0, 0.5)',
	getT: () => jest.requireActual('@/translations/fr').fr,
	setFormikAutoErrors: jest.fn(),
	extractApiErrorMessage: (_error: unknown, fallback: string) => fallback,
}));
jest.mock('@/store/services/project', () => ({
	useGetQuoteQuery: () => ({ data: mockQuote, isLoading: false }),
	useGetProjectsListQuery: () => ({ data: [{ id: 1, nom: 'Projet A' }] }),
	useGetSuppliersQuery: () => ({ data: [{ id: 2, nom: 'Fournisseur A' }] }),
	useGetExpenseTaxonomyQuery: () => ({
		data: [
			{ id: 3, name: 'Finitions', subcategories: [{ id: 4, name: 'Pose' }] },
			{ id: 5, name: 'Structure', subcategories: [] },
		],
	}),
	useCreateQuoteMutation: () => [mockCreate],
	useUpdateQuoteMutation: () => [mockUpdate],
	useUploadQuoteAttachmentMutation: () => [mockUpload],
	useCreateExpenseCategoryMutation: () => [jest.fn()],
	useUpdateExpenseCategoryMutation: () => [jest.fn()],
	useDeleteExpenseCategoryMutation: () => [jest.fn()],
	useCreateExpenseSubCategoryMutation: () => [jest.fn()],
	useUpdateExpenseSubCategoryMutation: () => [jest.fn()],
	useDeleteExpenseSubCategoryMutation: () => [jest.fn()],
}));
jest.mock('@/components/layouts/navigationBar/navigationBar', () => ({
	__esModule: true,
	default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
jest.mock('@/components/layouts/protected/protected', () => ({
	Protected: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
jest.mock('@/components/shared/entityCrudControls/entityCrudControls', () => ({
	__esModule: true,
	default: () => null,
}));
jest.mock('@/components/shared/entityAttachments/entityAttachments', () => ({
	buildAttachmentFormData: () => new FormData(),
	QuoteAttachmentsFormSection: ({ setQueuedAttachments }: { setQueuedAttachments: (files: unknown[]) => void }) => (
		<button
			type="button"
			onClick={() => setQueuedAttachments([{ id: '1', file: new File(['pdf'], 'quote.pdf'), label: '' }])}
		>
			Attach PDF
		</button>
	),
}));
jest.mock('@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect', () => ({
	__esModule: true,
	default: ({
		id,
		items,
		value,
		onChange,
	}: {
		id: string;
		items: { code: string; value: string }[];
		value: { code: string } | null;
		onChange: (event: unknown, value: unknown) => void;
	}) => (
		<select
			aria-label={id}
			value={value?.code ?? ''}
			onChange={(event) => onChange(event, items.find((item) => item.code === event.target.value) ?? null)}
		>
			<option value="">Select</option>
			{items.map((item) => (
				<option key={item.code} value={item.code}>
					{item.value}
				</option>
			))}
		</select>
	),
}));
jest.mock('@/components/formikElements/customTextInput/customTextInput', () => ({
	__esModule: true,
	default: ({
		id,
		value,
		onChange,
	}: {
		id: string;
		value: string;
		onChange: (event: ChangeEvent<HTMLInputElement>) => void;
	}) => <input aria-label={id} value={value} onChange={onChange} />,
}));
jest.mock('@mui/x-date-pickers/DatePicker', () => ({
	DatePicker: ({ value, onChange }: { value: Date | null; onChange: (date: Date) => void }) => (
		<input
			aria-label="date"
			type="date"
			value={value ? format(value, 'yyyy-MM-dd') : ''}
			onChange={(event) => onChange(new Date(`${event.target.value}T12:00:00`))}
		/>
	),
}));
jest.mock('@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton', () => ({
	__esModule: true,
	default: ({ buttonText, loading }: { buttonText: string; loading: boolean }) => (
		<button type="submit" disabled={loading}>
			{buttonText}
		</button>
	),
}));

const fill = () => {
	for (const [label, value] of Object.entries({
		project: '1',
		supplier: '2',
		number: 'DEV-1',
		date: '2026-10-03',
		description: 'Pose',
		amount_ht: '16666,67',
		amount_tva: '3333,33',
		category: '3',
		sous_categorie: '4',
		status: 'validated',
	}))
		fireEvent.change(screen.getByLabelText(label), { target: { value } });
};
beforeEach(() => {
	jest.clearAllMocks();
	mockQuote = undefined;
	mockCreate.mockReturnValue({ unwrap: () => Promise.resolve({ id: 10 }) });
	mockUpdate.mockReturnValue({ unwrap: () => Promise.resolve({ id: 10 }) });
});

it('saves normalized amounts and shared category IDs, then opens the detail', async () => {
	render(<QuoteFormClient />);
	fill();
	fireEvent.click(screen.getByRole('button', { name: 'Nouveau devis' }));
	await waitFor(() =>
		expect(mockCreate).toHaveBeenCalledWith({
			data: expect.objectContaining({
				project: 1,
				supplier: 2,
				category: 3,
				sous_categorie: 4,
				amount_ht: '16666.67',
				amount_tva: '3333.33',
				status: 'validated',
			}),
		}),
	);
	expect(mockCreate.mock.calls[0][0].data).not.toHaveProperty('amount_ttc');
	await waitFor(() => expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/quotes/10')));
});
it('clears a subcategory when its parent category changes', async () => {
	render(<QuoteFormClient />);
	fill();
	fireEvent.change(screen.getByLabelText('category'), { target: { value: '5' } });
	expect(screen.getByLabelText('sous_categorie')).toHaveValue('');
	fireEvent.click(screen.getByRole('button', { name: 'Nouveau devis' }));
	await waitFor(() =>
		expect(mockCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ category: 5, sous_categorie: null }) }),
	);
});
it('blocks negative input and prevents saving amounts with excessive precision', async () => {
	render(<QuoteFormClient />);
	fill();
	fireEvent.change(screen.getByLabelText('amount_tva'), { target: { value: '-1' } });
	expect(screen.getByLabelText('amount_tva')).toHaveValue('3333,33');
	fireEvent.change(screen.getByLabelText('amount_tva'), { target: { value: '1.234' } });
	fireEvent.click(screen.getByRole('button', { name: 'Nouveau devis' }));
	await screen.findByRole('alert');
	expect(mockCreate).not.toHaveBeenCalled();
});
it('keeps the created quote and opens edit after attachment failure', async () => {
	mockUpload.mockReturnValue({ unwrap: () => Promise.reject(new Error('upload failed')) });
	render(<QuoteFormClient />);
	fill();
	fireEvent.click(screen.getByRole('button', { name: 'Attach PDF' }));
	fireEvent.click(screen.getByRole('button', { name: 'Nouveau devis' }));
	await waitFor(() => expect(mockReplace).toHaveBeenCalledWith(expect.stringContaining('/quotes/10/edit')));
	expect(mockCreate).toHaveBeenCalledTimes(1);
	expect(mockOnError).toHaveBeenCalled();
});
it('updates the existing quote instead of creating another', async () => {
	mockQuote = {
		project: 1,
		supplier: 2,
		number: 'DEV-1',
		date: '2026-10-03',
		description: 'Pose',
		amount_ht: '100.00',
		amount_tva: '20.00',
		category: 3,
		sous_categorie: 4,
		status: 'received',
	};
	render(<QuoteFormClient id={10} />);
	fireEvent.change(screen.getByLabelText('status'), { target: { value: 'validated' } });
	fireEvent.click(screen.getByRole('button', { name: 'Mettre à jour' }));
	await waitFor(() =>
		expect(mockUpdate).toHaveBeenCalledWith({ id: 10, data: expect.objectContaining({ status: 'validated' }) }),
	);
	expect(mockCreate).not.toHaveBeenCalled();
});
