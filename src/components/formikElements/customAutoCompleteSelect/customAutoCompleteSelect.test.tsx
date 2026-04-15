import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { createTheme } from '@mui/material/styles';
import CustomAutoCompleteSelect from './customAutoCompleteSelect';

describe('CustomAutoCompleteSelect', () => {
	it('displays the option value instead of the code and filters by that value', async () => {
		const user = userEvent.setup();
		const theme = createTheme();
		const items = [
			{ code: '17', value: 'Projet Atlas' },
			{ code: '33', value: 'Projet Oasis' },
		];

		render(
			<CustomAutoCompleteSelect
				id="project"
				label="Projet"
				items={items}
				theme={theme}
				value={items[0]}
				noOptionsText="Aucun projet"
				fullWidth
			/>,
		);

		const input = screen.getByRole('combobox', { name: 'Projet' });
		expect(input).toHaveValue('Projet Atlas');

		await user.clear(input);
		await user.type(input, 'Oasis');

		const listbox = await screen.findByRole('listbox');
		expect(within(listbox).getByText('Projet Oasis')).toBeInTheDocument();
		expect(within(listbox).queryByText('33')).not.toBeInTheDocument();
	});
});