'use client';

import React, { useState } from 'react';
import {
	AccountBalance as AccountBalanceIcon,
	Badge as BadgeIcon,
	Business as BusinessIcon,
	ContactMail as ContactMailIcon,
	Email as EmailIcon,
	Language as LanguageIcon,
	LocationOn as LocationOnIcon,
	Numbers as NumbersIcon,
	Phone as PhoneIcon,
	Save as SaveIcon,
} from '@mui/icons-material';
import { Alert, Box, Card, CardContent, CircularProgress, Divider, Stack, Typography } from '@mui/material';
import type { SessionProps } from '@/types/_initTypes';
import type { CompanyProfileType } from '@/types/reportTypes';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import CustomSquareImageUploading from '@/components/formikElements/customSquareImageUploading/customSquareImageUploading';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useGetCompanyProfileQuery, useUpdateCompanyProfileMutation } from '@/store/services/project';
import { extractApiErrorMessage } from '@/utils/helpers';
import { useLanguage, useToast } from '@/utils/hooks';
import { textInputTheme } from '@/utils/themes';
import Styles from '@/styles/dashboard/dashboard.module.sass';

const inputTheme = textInputTheme();

const profileFields = (profile: CompanyProfileType) => ({
	raison_sociale: profile.raison_sociale ?? '',
	adresse: profile.adresse ?? '',
	telephone: profile.telephone ?? '',
	email: profile.email ?? '',
	site_web: profile.site_web ?? '',
	ICE: profile.ICE ?? '',
	registre_de_commerce: profile.registre_de_commerce ?? '',
	numero_du_compte: profile.numero_du_compte ?? '',
	identifiant_fiscal: profile.identifiant_fiscal ?? '',
	CNSS: profile.CNSS ?? '',
});

type CompanyFields = ReturnType<typeof profileFields>;
type CompanyFieldName = keyof CompanyFields;

const isNewImage = (value: string | ArrayBuffer | null): value is string =>
	typeof value === 'string' && value.startsWith('data:image/');

const imageFileFromDataUrl = (dataUrl: string, filename: string): File => {
	const [metadata, encodedData = ''] = dataUrl.split(',', 2);
	const mimeType = /^data:(image\/[a-z0-9.+-]+);base64$/i.exec(metadata)?.[1] ?? 'image/png';
	const binary = window.atob(encodedData);
	const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
	return new File([bytes], filename, { type: mimeType });
};

const CompanyProfileForm: React.FC<{ profile: CompanyProfileType }> = ({ profile }) => {
	const { t } = useLanguage();
	const { onSuccess, onError } = useToast();
	const [updateCompanyProfile, { isLoading: isSaving }] = useUpdateCompanyProfileMutation();
	const [fields, setFields] = useState<CompanyFields>(() => profileFields(profile));
	const [logo, setLogo] = useState<string | ArrayBuffer | null>(profile.logo_url);
	const [croppedLogo, setCroppedLogo] = useState<string | ArrayBuffer | null>(profile.logo_cropped_url);

	const setField = (name: CompanyFieldName) => (event: React.ChangeEvent<HTMLInputElement>) => {
		setFields((current) => ({ ...current, [name]: event.target.value }));
	};

	const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData();
		Object.entries(fields).forEach(([key, value]) => formData.append(key, value));
		try {
			if (isNewImage(logo)) formData.append('logo', imageFileFromDataUrl(logo, 'company-logo.png'));
			if (isNewImage(croppedLogo)) {
				formData.append('logo_cropped', imageFileFromDataUrl(croppedLogo, 'company-logo-cropped.png'));
			}
			if (!logo && (profile.logo_url || profile.logo_cropped_url)) formData.append('remove_logo', 'true');
			await updateCompanyProfile(formData).unwrap();
			onSuccess(t.companyProfile.saveSuccess);
		} catch (updateError) {
			onError(extractApiErrorMessage(updateError, t.companyProfile.saveError));
		}
	};

	const field = (
		name: CompanyFieldName,
		label: string,
		icon: React.ReactNode,
		options: { type?: React.HTMLInputTypeAttribute; required?: boolean; multiline?: boolean } = {},
	) => (
		<CustomTextInput
			theme={inputTheme}
			id={name}
			type={options.multiline ? 'textarea' : (options.type ?? 'text')}
			size="small"
			label={label}
			value={fields[name]}
			onChange={setField(name)}
			fullWidth
			required={options.required}
			multiline={options.multiline}
			rows={options.multiline ? 3 : undefined}
			startIcon={icon}
		/>
	);

	const sectionTitle = (icon: React.ReactNode, title: string) => (
		<>
			<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
				{icon}
				<Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>
			</Stack>
			<Divider sx={{ mb: 3 }} />
		</>
	);

	const cropReady = !isNewImage(logo) || isNewImage(croppedLogo);

	return (
		<form onSubmit={handleSubmit}>
			<Stack spacing={3}>
				<Card elevation={2} sx={{ borderRadius: 2 }}>
					<CardContent sx={{ p: 3 }}>
						{sectionTitle(<BusinessIcon color="primary" />, t.companyProfile.identity)}
						<Stack spacing={3}>
							{field('raison_sociale', `${t.companyProfile.name}`, <BusinessIcon fontSize="small" />, { required: true })}
							<CustomSquareImageUploading
								image={logo}
								croppedImage={croppedLogo}
								onChange={setLogo}
								onCrop={setCroppedLogo}
							/>
						</Stack>
					</CardContent>
				</Card>

				<Card elevation={2} sx={{ borderRadius: 2 }}>
					<CardContent sx={{ p: 3 }}>
						{sectionTitle(<ContactMailIcon color="primary" />, t.companyProfile.contact)}
						<Stack spacing={2.5}>
							<Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
								{field('telephone', t.companyProfile.phone, <PhoneIcon fontSize="small" />)}
								{field('email', t.companyProfile.email, <EmailIcon fontSize="small" />, { type: 'email' })}
							</Stack>
							{field('adresse', t.companyProfile.address, <LocationOnIcon fontSize="small" />, { multiline: true })}
							{field('site_web', t.companyProfile.website, <LanguageIcon fontSize="small" />, { type: 'url' })}
						</Stack>
					</CardContent>
				</Card>

				<Card elevation={2} sx={{ borderRadius: 2 }}>
					<CardContent sx={{ p: 3 }}>
						{sectionTitle(<AccountBalanceIcon color="primary" />, t.companyProfile.legal)}
						<Stack spacing={2.5}>
							<Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
								{field('ICE', 'ICE', <BadgeIcon fontSize="small" />)}
								{field('registre_de_commerce', t.companyProfile.commercialRegister, <NumbersIcon fontSize="small" />)}
							</Stack>
							{field('numero_du_compte', t.companyProfile.bankAccount, <AccountBalanceIcon fontSize="small" />)}
							<Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
								{field('identifiant_fiscal', t.companyProfile.fiscalId, <BadgeIcon fontSize="small" />)}
								{field('CNSS', 'CNSS', <NumbersIcon fontSize="small" />)}
							</Stack>
						</Stack>
					</CardContent>
				</Card>

				<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
					<PrimaryLoadingButton
						buttonText={t.common.save}
						loading={isSaving}
						active={!isSaving && Boolean(fields.raison_sociale.trim()) && cropReady}
						type="submit"
						startIcon={<SaveIcon />}
						cssClass={Styles.submitButton}
					/>
				</Box>
			</Stack>
		</form>
	);
};

const CompanyProfileClient: React.FC<SessionProps> = ({ session }) => {
	const { t } = useLanguage();
	const token = useInitAccessToken(session);
	const { data, isLoading, error } = useGetCompanyProfileQuery(undefined, { skip: !token });

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} sx={{ mt: '48px' }}>
			<NavigationBar title={t.companyProfile.title}>
				<Protected permission="is_staff">
					<Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
						{isLoading ? (
							<CircularProgress />
						) : error || !data ? (
							<Alert severity="error">{t.companyProfile.saveError}</Alert>
						) : (
							<CompanyProfileForm key={data.date_updated} profile={data} />
						)}
					</Stack>
				</Protected>
			</NavigationBar>
		</Stack>
	);
};

export default CompanyProfileClient;
