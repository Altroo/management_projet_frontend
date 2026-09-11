export type CompanyProfileType = {
	id: number;
	raison_sociale: string;
	logo_url: string | null;
	logo_cropped_url: string | null;
	adresse: string | null;
	telephone: string | null;
	email: string | null;
	site_web: string | null;
	ICE: string | null;
	registre_de_commerce: string | null;
	numero_du_compte: string | null;
	identifiant_fiscal: string | null;
	CNSS: string | null;
	date_created: string;
	date_updated: string;
};
