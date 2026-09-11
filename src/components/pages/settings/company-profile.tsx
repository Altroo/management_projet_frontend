'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	CircularProgress,
	Divider,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import { Business as BusinessIcon, Delete as DeleteIcon, Upload as UploadIcon } from '@mui/icons-material';
import type { SessionProps } from '@/types/_initTypes';
import type { CompanyProfileType } from '@/types/reportTypes';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useGetCompanyProfileQuery, useUpdateCompanyProfileMutation } from '@/store/services/project';
import { extractApiErrorMessage } from '@/utils/helpers';
import { useLanguage, useToast } from '@/utils/hooks';

const profileFields = (profile: CompanyProfileType) => ({
	raison_sociale: profile.raison_sociale ?? '',
	adresse: profile.adresse ?? '',
	telephone: profile.telephone ?? '',
	email: profile.email ?? '',
	site_web: profile.site_web ?? '',
	ICE: profile.ICE ?? '',
	registre_de_commerce: profile.registre_de_commerce ?? '',
	identifiant_fiscal: profile.identifiant_fiscal ?? '',
	CNSS: profile.CNSS ?? '',
});

type CompanyFields = ReturnType<typeof profileFields>;

const CompanyProfileForm: React.FC<{ profile: CompanyProfileType }> = ({ profile }) => {
	const { t } = useLanguage();
	const { onSuccess, onError } = useToast();
	const [updateCompanyProfile, { isLoading: isSaving }] = useUpdateCompanyProfileMutation();
	const [fields, setFields] = useState<CompanyFields>(() => profileFields(profile));
	const [logoFile, setLogoFile] = useState<File | null>(null);
	const [removeLogo, setRemoveLogo] = useState(false);
	const localLogoUrl = useMemo(
		() => (logoFile && typeof window !== 'undefined' ? window.URL.createObjectURL(logoFile) : null),
		[logoFile],
	);

	useEffect(
		() => () => {
			if (localLogoUrl && typeof window !== 'undefined') window.URL.revokeObjectURL(localLogoUrl);
		},
		[localLogoUrl],
	);

	const visibleLogo = removeLogo ? null : (localLogoUrl ?? profile.logo_url ?? null);
	const setField = (name: keyof CompanyFields) => (event: React.ChangeEvent<HTMLInputElement>) => {
		setFields((current) => ({ ...current, [name]: event.target.value }));
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		const formData = new FormData();
		Object.entries(fields).forEach(([key, value]) => formData.append(key, value));
		if (logoFile) formData.append('logo', logoFile);
		if (removeLogo) formData.append('remove_logo', 'true');
		try {
			await updateCompanyProfile(formData).unwrap();
			onSuccess(t.companyProfile.saveSuccess);
		} catch (updateError) {
			onError(extractApiErrorMessage(updateError, t.companyProfile.saveError));
		}
	};

	return (
		<Card elevation={2} component="form" onSubmit={handleSubmit}>
			<CardContent>
				<Stack spacing={3}>
					<Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
						<BusinessIcon color="primary" />
						<Typography variant="h6">{t.companyProfile.identity}</Typography>
					</Stack>
					<TextField required fullWidth label={t.companyProfile.name} value={fields.raison_sociale} onChange={setField('raison_sociale')} />
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
						<Box sx={{ width: 150, height: 90, border: '1px dashed', borderColor: 'divider', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', bgcolor: 'grey.50' }}>
							{visibleLogo ? <Box component="img" src={visibleLogo} alt={t.companyProfile.logo} sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <Typography color="primary" sx={{ fontWeight: 700 }}>EBH</Typography>}
						</Box>
						<Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
							<Button component="label" variant="outlined" startIcon={<UploadIcon />}>
								{t.companyProfile.chooseLogo}
								<input hidden type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0] ?? null; setLogoFile(file); if (file) setRemoveLogo(false); }} />
							</Button>
							{visibleLogo && <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => { setLogoFile(null); setRemoveLogo(true); }}>{t.companyProfile.removeLogo}</Button>}
						</Stack>
					</Stack>
					<Divider />
					<Typography variant="h6">{t.companyProfile.contact}</Typography>
					<Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
						<TextField fullWidth label={t.companyProfile.phone} value={fields.telephone} onChange={setField('telephone')} />
						<TextField fullWidth type="email" label={t.companyProfile.email} value={fields.email} onChange={setField('email')} />
					</Stack>
					<TextField fullWidth multiline minRows={2} label={t.companyProfile.address} value={fields.adresse} onChange={setField('adresse')} />
					<TextField fullWidth type="url" label={t.companyProfile.website} value={fields.site_web} onChange={setField('site_web')} />
					<Divider />
					<Typography variant="h6">{t.companyProfile.legal}</Typography>
					<Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
						<TextField fullWidth label="ICE" value={fields.ICE} onChange={setField('ICE')} />
						<TextField fullWidth label={t.companyProfile.commercialRegister} value={fields.registre_de_commerce} onChange={setField('registre_de_commerce')} />
					</Stack>
					<Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
						<TextField fullWidth label={t.companyProfile.fiscalId} value={fields.identifiant_fiscal} onChange={setField('identifiant_fiscal')} />
						<TextField fullWidth label="CNSS" value={fields.CNSS} onChange={setField('CNSS')} />
					</Stack>
					<Button type="submit" variant="contained" disabled={isSaving || !fields.raison_sociale.trim()} sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}>
						{isSaving ? <CircularProgress size={22} color="inherit" /> : t.common.save}
					</Button>
				</Stack>
			</CardContent>
		</Card>
	);
};

const CompanyProfileClient: React.FC<SessionProps> = ({ session }) => {
	const { t } = useLanguage();
	const token = useInitAccessToken(session);
	const { data, isLoading, error } = useGetCompanyProfileQuery(undefined, { skip: !token });

	return (
		<NavigationBar title={t.companyProfile.title}>
			<Protected permission="is_staff">
				<Stack spacing={3} sx={{ p: { xs: 2, md: 3 }, mt: 2, maxWidth: 1000 }}>
					<Stack spacing={0.5}>
						<Typography variant="h5" sx={{ fontWeight: 700 }}>{t.companyProfile.title}</Typography>
						<Typography color="text.secondary">{t.companyProfile.description}</Typography>
					</Stack>
					{isLoading ? <CircularProgress /> : error || !data ? <Alert severity="error">{t.companyProfile.saveError}</Alert> : <CompanyProfileForm key={data.date_updated} profile={data} />}
				</Stack>
			</Protected>
		</NavigationBar>
	);
};

export default CompanyProfileClient;
