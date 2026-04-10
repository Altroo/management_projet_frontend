import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createTheme } from '@mui/material/styles';
import AddEntityModal from './addEntityModal';

type MutationResult = Promise<unknown> & { unwrap?: () => Promise<unknown> };

const createMutationResult = (value: unknown): MutationResult => {
	const promise = Promise.resolve(value) as MutationResult;
	promise.unwrap = () => Promise.resolve(value);
	return promise;
};

const createRejectedMutationResult = (error: unknown): MutationResult => {
	const promise = Promise.resolve(undefined) as MutationResult;
	promise.unwrap = () => Promise.reject(error);
	return promise;
};

jest.mock('@/utils/hooks', () => ({
	__esModule: true,
	useLanguage: () => ({
		t: {
			common: {
				add: 'Ajouter',
				cancel: 'Annuler',
				isRequired: 'is required',
			},
		},
	}),
}));

jest.mock('@/components/formikElements/customTextInput/customTextInput', () => ({
	__esModule: true,
	default: ({ id, value, onChange, helperText }: { id: string; value: string; onChange: (event: React.ChangeEvent<HTMLInputElement>) => void; helperText?: string }) => (
		<div>
			<input data-testid={id} value={value} onChange={onChange} />
			<span data-testid={`${id}-helper`}>{helperText ?? ''}</span>
		</div>
	),
}));

describe('AddEntityModal', () => {
	const inputTheme = createTheme();
	const label = 'Catégorie';
	const inputId = `new_${label}`;

	it('renders title, actions and input', () => {
		const mutationFn = jest.fn((_args: { data: Record<string, number | string> }) => createMutationResult({}));

		render(
			<AddEntityModal
				open={true}
				setOpen={jest.fn()}
				label={label}
				icon={null}
				inputTheme={inputTheme}
				mutationFn={mutationFn}
			/>,
		);

		expect(screen.getByText('Ajouter Catégorie')).toBeInTheDocument();
		expect(screen.getByText('Annuler')).toBeInTheDocument();
		expect(screen.getByText('Ajouter')).toBeInTheDocument();
		expect(screen.getByTestId(inputId)).toBeInTheDocument();
	});

	it('shows a validation error when name is empty', async () => {
		const mutationFn = jest.fn((_args: { data: Record<string, number | string> }) => createMutationResult({}));

		render(
			<AddEntityModal
				open={true}
				setOpen={jest.fn()}
				label={label}
				icon={null}
				inputTheme={inputTheme}
				mutationFn={mutationFn}
			/>,
		);

		fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));

		await waitFor(() => {
			expect(screen.getByTestId(`${inputId}-helper`)).toHaveTextContent('Catégorie is required');
		});

		expect(mutationFn).not.toHaveBeenCalled();
	});

	it('submits the default payload and returns the new id', async () => {
		const setOpen = jest.fn();
		const onSuccess = jest.fn();
		const mutationFn = jest.fn((_args: { data: Record<string, number | string> }) =>
			createMutationResult({ data: { id: 14 } }),
		);

		render(
			<AddEntityModal
				open={true}
				setOpen={setOpen}
				label={label}
				icon={null}
				inputTheme={inputTheme}
				mutationFn={mutationFn}
				onSuccess={onSuccess}
			/>,
		);

		fireEvent.change(screen.getByTestId(inputId), { target: { value: 'Matériaux' } });
		fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));

		await waitFor(() => {
			expect(mutationFn).toHaveBeenCalledWith({ data: { name: 'Matériaux' } });
		});

		await waitFor(() => {
			expect(setOpen).toHaveBeenCalledWith(false);
			expect(onSuccess).toHaveBeenCalledWith(14);
		});
	});

	it('uses buildPayload when provided', async () => {
		const mutationFn = jest.fn((_args: { data: Record<string, number | string> }) => createMutationResult({}));

		render(
			<AddEntityModal
				open={true}
				setOpen={jest.fn()}
				label={label}
				icon={null}
				inputTheme={inputTheme}
				mutationFn={mutationFn}
				buildPayload={(name) => ({ nom: name, project: 7 })}
			/>,
		);

		fireEvent.change(screen.getByTestId(inputId), { target: { value: 'Déplacement' } });
		fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));

		await waitFor(() => {
			expect(mutationFn).toHaveBeenCalledWith({ data: { nom: 'Déplacement', project: 7 } });
		});
	});

	it('shows the API error message when the mutation fails', async () => {
		const mutationFn = jest.fn((_args: { data: Record<string, number | string> }) =>
			createRejectedMutationResult({ error: { details: { name: ['Already exists'] } } }),
		);

		render(
			<AddEntityModal
				open={true}
				setOpen={jest.fn()}
				label={label}
				icon={null}
				inputTheme={inputTheme}
				mutationFn={mutationFn}
			/>,
		);

		fireEvent.change(screen.getByTestId(inputId), { target: { value: 'Matériaux' } });
		fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));

		await waitFor(() => {
			expect(screen.getByTestId(`${inputId}-helper`)).toHaveTextContent('Already exists');
		});
	});
});