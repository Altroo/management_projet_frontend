import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CompanyProfileClient from './company-profile';

const updateCompanyProfile = jest.fn();
const unwrap = jest.fn();
const onSuccess = jest.fn();
const mockCompanyData = {
	id: 1,
	raison_sociale: 'E.B.H Gestion Projet',
	logo_url: null,
	logo_cropped_url: null,
	adresse: 'Casablanca',
	telephone: null,
	email: null,
	site_web: null,
	ICE: null,
	registre_de_commerce: null,
	numero_du_compte: null,
	identifiant_fiscal: null,
	CNSS: null,
};

jest.mock('@/components/formikElements/customSquareImageUploading/customSquareImageUploading', () => ({
	__esModule: true,
	default: () => <div data-testid="company-logo-cropper" />,
}));

jest.mock('@/components/layouts/navigationBar/navigationBar', () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('@/components/layouts/protected/protected', () => ({
	Protected: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock('@/contexts/InitContext', () => ({ useInitAccessToken: () => 'token' }));
jest.mock('@/store/services/project', () => ({
	useGetCompanyProfileQuery: () => ({
		data: mockCompanyData,
		isLoading: false,
		error: undefined,
	}),
	useUpdateCompanyProfileMutation: () => [updateCompanyProfile, { isLoading: false }],
}));
jest.mock('@/utils/hooks', () => ({
	useToast: () => ({ onSuccess, onError: jest.fn() }),
	useLanguage: () => ({
		t: {
			common: { save: 'Enregistrer' },
			companyProfile: {
				title: 'Profil société', description: 'Description', identity: 'Identité visuelle', contact: 'Coordonnées',
				legal: 'Informations légales', name: 'Raison sociale', logo: 'Logo', chooseLogo: 'Choisir un logo',
				removeLogo: 'Supprimer le logo', address: 'Adresse', phone: 'Téléphone', email: 'Email', website: 'Site web',
				commercialRegister: 'Registre de commerce', bankAccount: 'RIB Compte', fiscalId: 'Identifiant fiscal', saveSuccess: 'Profil enregistré', saveError: 'Erreur',
			},
		},
	}),
}));

describe('CompanyProfileClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		unwrap.mockResolvedValue({});
		updateCompanyProfile.mockReturnValue({ unwrap });
	});

	it('loads and submits the staff-managed report identity', async () => {
		render(<CompanyProfileClient />);
		expect(screen.getByTestId('company-logo-cropper')).toBeInTheDocument();
		expect(screen.getByDisplayValue('E.B.H Gestion Projet')).toBeInTheDocument();
		fireEvent.change(screen.getByRole('textbox', { name: /Raison sociale/ }), { target: { value: 'Nouvelle Société' } });
		fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

		await waitFor(() => expect(updateCompanyProfile).toHaveBeenCalledTimes(1));
		const formData = updateCompanyProfile.mock.calls[0][0] as FormData;
		expect(formData.get('raison_sociale')).toBe('Nouvelle Société');
		expect(formData.get('adresse')).toBe('Casablanca');
		await waitFor(() => expect(onSuccess).toHaveBeenCalledWith('Profil enregistré'));
	});
});
