import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createTheme } from '@mui/material/styles';
import EntityCrudControls from './entityCrudControls';
import type { DropDownType } from '@/types/accountTypes';

type MutationResult = Promise<unknown> & { unwrap?: () => Promise<unknown> };

const createMutationResult = (value: unknown): MutationResult => {
	const promise = Promise.resolve(value) as MutationResult;
	promise.unwrap = () => Promise.resolve(value);
	return promise;
};

jest.mock('@/utils/hooks', () => ({
	__esModule: true,
	useLanguage: () => ({
		t: {
			common: {
				add: 'Ajouter',
				update: 'Modifier',
				delete: 'Supprimer',
				cancel: 'Annuler',
			},
		},
	}),
}));

jest.mock('@/components/shared/addEntityModal/addEntityModal', () => ({
	__esModule: true,
	default: ({ open, onSuccess, setOpen }: { open: boolean; onSuccess?: (id: number) => void; setOpen: (v: boolean) => void }) =>
		open ? (
			<div data-testid="add-entity-modal">
				<button
					onClick={() => {
						onSuccess?.(33);
						setOpen(false);
					}}
				>
					confirm-add
				</button>
			</div>
		) : null,
}));

jest.mock('@/components/formikElements/customTextInput/customTextInput', () => ({
	__esModule: true,
	default: ({ id, value, onChange, label }: { id: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; label: string }) => (
		<label>
			{label}
			<input data-testid={id} value={value} onChange={onChange} />
		</label>
	),
}));

jest.mock('@/components/htmlElements/modals/actionModal/actionModals', () => ({
	__esModule: true,
	default: ({ title, body, actions }: { title: string; body: string; actions: Array<{ text: string; onClick: () => void }> }) => (
		<div data-testid="action-modal">
			<div>{title}</div>
			<div>{body}</div>
			{actions.map((action) => (
				<button key={action.text} onClick={action.onClick}>
					{action.text}
				</button>
			))}
		</div>
	),
}));

describe('EntityCrudControls', () => {
	const inputTheme = createTheme();
	const selectedItem: DropDownType = { code: '12', value: 'Matériaux' };

	it('uses id in code and label in value for edit and delete flows', async () => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const editEntity = jest.fn((_args: { id: number; data: Record<string, number | string> }) => createMutationResult({}));
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const deleteEntity = jest.fn((_args: { id: number }) => createMutationResult({}));
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const addEntity = jest.fn((_args: { data: Record<string, number | string> }) => createMutationResult({ id: 33 }));
		const onAddSuccess = jest.fn();
		const onDeleteSuccess = jest.fn();

		render(
			<EntityCrudControls
				label="catégorie"
				icon={<span>icon</span>}
				inputTheme={inputTheme}
				selectedItem={selectedItem}
				addEntity={addEntity}
				editEntity={editEntity}
				deleteEntity={deleteEntity}
				onAddSuccess={onAddSuccess}
				onDeleteSuccess={onDeleteSuccess}
			/>,
		);

		fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));
		expect(screen.getByTestId('add-entity-modal')).toBeInTheDocument();
		fireEvent.click(screen.getByText('confirm-add'));
		expect(onAddSuccess).toHaveBeenCalledWith(33);

		fireEvent.click(screen.getByTitle('Modifier'));
		expect(screen.getByTestId('edit_catégorie')).toHaveValue('Matériaux');
		fireEvent.change(screen.getByTestId('edit_catégorie'), { target: { value: 'Main d oeuvre' } });
		fireEvent.click(screen.getByRole('button', { name: 'Modifier' }));

		await waitFor(() => {
			expect(editEntity).toHaveBeenCalledWith({
				id: 12,
				data: { name: 'Main d oeuvre' },
			});
		});

		await waitFor(() => {
			expect(screen.queryByTestId('edit_catégorie')).not.toBeInTheDocument();
		});

		fireEvent.click(screen.getByTitle('Supprimer'));
		const actionModal = screen.getByTestId('action-modal');
		expect(within(actionModal).getByText('Supprimer Matériaux ?')).toBeInTheDocument();
		fireEvent.click(within(actionModal).getByRole('button', { name: 'Supprimer' }));

		await waitFor(() => {
			expect(deleteEntity).toHaveBeenCalledWith({ id: 12 });
			expect(onDeleteSuccess).toHaveBeenCalled();
		});

		await waitFor(() => {
			expect(screen.queryByTestId('action-modal')).not.toBeInTheDocument();
		});
	});
});
