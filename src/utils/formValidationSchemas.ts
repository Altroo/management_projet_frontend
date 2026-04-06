import { z } from 'zod';
import {
	INPUT_REQUIRED,
	INPUT_PASSWORD_MIN,
	INPUT_MIN,
	INPUT_MAX,
	MINI_INPUT_EMAIL,
	SHORT_INPUT_REQUIRED,
} from '@/utils/formValidationErrorMessages';
import { getT } from '@/utils/helpers';


const base64ImageField = z.url().or(z.string().startsWith('data:image/')).nullable().optional();

const passwordField = z.preprocess(
	(val) => (val === undefined ? '' : val),
	z
		.string()
		.min(8, { error: () => INPUT_PASSWORD_MIN(8) })
		.nonempty({ error: INPUT_REQUIRED }),
);

const requiredTextField = (min: number, max: number) =>
	z.preprocess(
		(val) => (val === undefined ? '' : val),
		z
			.string()
			.min(min, { error: () => INPUT_MIN(min) })
			.max(max, { error: () => INPUT_MAX(max) })
			.nonempty({ error: INPUT_REQUIRED }),
	);

const requiredChoiceTextField = () =>
	z.preprocess((val) => (val === undefined ? '' : val), z.string().nonempty({ error: INPUT_REQUIRED }));

const optionalChoiceField = () =>
	z.preprocess((val) => (val === undefined || val === null || val === '' ? undefined : val), z.string().optional());

const optionalTextField = (min: number, max: number) =>
	z.preprocess(
		(val) => (val === undefined || val === null || val === '' ? undefined : val),
		z
			.string()
			.min(min, { error: () => INPUT_MIN(min) })
			.max(max, { error: () => INPUT_MAX(max) })
			.optional(),
	);

const requiredDateField = (getLabel: () => string) =>
	z.preprocess(
		(val) => (val === undefined || val === null ? '' : String(val)),
		z
			.string()
			.nonempty({ error: () => getT().validation.dateRequired(getLabel()) })
			.regex(/^\d{4}-\d{2}-\d{2}$/, { error: () => getT().validation.invalidDateFormat }),
	);

const optionalNumberField = () =>
	z.preprocess(
		(val) => (val === undefined || val === null || val === '' ? undefined : val),
		z.string().optional(),
	);

const singleDigit = z
	.string()
	.min(1, { error: SHORT_INPUT_REQUIRED })
	.regex(/^\d$/, { error: SHORT_INPUT_REQUIRED })
	.transform((val) => Number(val));

export const loginSchema = z.object({
	email: z.email({ error: MINI_INPUT_EMAIL }),
	password: passwordField,
	globalError: optionalTextField(1, 500),
});

export const emailSchema = z.object({
	email: z.email({ error: MINI_INPUT_EMAIL }),
	globalError: optionalTextField(1, 500),
});

export const passwordResetConfirmationSchema = z.object({
	new_password: passwordField,
	new_password2: passwordField,
	globalError: optionalTextField(1, 500),
});

export const passwordResetCodeSchema = z.object({
	one: singleDigit,
	two: singleDigit,
	three: singleDigit,
	four: singleDigit,
	five: singleDigit,
	six: singleDigit,
	globalError: optionalTextField(1, 500),
});

export const userSchema = z.object({
	// REQUIRED FIELDS
	first_name: requiredTextField(2, 255),
	last_name: requiredTextField(2, 255),
	email: z.email({ error: MINI_INPUT_EMAIL }),
	gender: requiredChoiceTextField(),
	is_active: z.boolean(),
	is_staff: z.boolean(),
	// OPTIONAL FIELDS
	can_view: z.boolean(),
	can_print: z.boolean(),
	can_create: z.boolean(),
	can_edit: z.boolean(),
	can_delete: z.boolean(),
	avatar: base64ImageField,
	avatar_cropped: base64ImageField,
	globalError: optionalTextField(1, 500),
});

export const profilSchema = z.object({
	first_name: requiredTextField(2, 30),
	last_name: requiredTextField(2, 30),
	gender: optionalChoiceField(),
	avatar: base64ImageField,
	avatar_cropped: base64ImageField,
});

export const changePasswordSchema = z
	.object({
		old_password: z.string().min(1, { error: INPUT_REQUIRED }).min(8, { error: () => INPUT_PASSWORD_MIN(8) }),
		new_password: z.string().min(1, { error: INPUT_REQUIRED }).min(8, { error: () => INPUT_PASSWORD_MIN(8) }),
		new_password2: z.string().min(1, { error: INPUT_REQUIRED }),
		globalError: z.string().optional(),
	})
	.superRefine((data, ctx) => {
		if (data.new_password !== data.new_password2) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: getT().validation.passwordMismatch,
				path: ['new_password2'],
			});
		}
	});

export const projectSchema = z.object({
	nom: requiredTextField(2, 255),
	description: optionalTextField(1, 2000),
	budget_total: z.preprocess(
		(val) => (val === undefined || val === null ? '' : String(val)),
		z.string().nonempty({ error: INPUT_REQUIRED }),
	),
	date_debut: requiredDateField(() => getT().projects.dateDebut),
	date_fin: requiredDateField(() => getT().projects.dateFin),
	status: requiredChoiceTextField(),
	chef_de_projet: requiredTextField(2, 255),
	nom_client: requiredTextField(2, 255),
	telephone_client: optionalTextField(1, 50),
	email_client: optionalTextField(1, 255),
	notes: optionalTextField(1, 2000),
	globalError: optionalTextField(1, 500),
});

export const categorySchema = z.object({
	name: requiredTextField(2, 255),
	globalError: optionalTextField(1, 500),
});

export const subCategorySchema = z.object({
	name: requiredTextField(2, 255),
	category: z.preprocess(
		(val) => (val === undefined || val === null || val === '' ? '' : String(val)),
		z.string().nonempty({ error: INPUT_REQUIRED }),
	),
	globalError: optionalTextField(1, 500),
});

export const revenueSchema = z.object({
	project: z.preprocess(
		(val) => (val === undefined || val === null || val === '' ? '' : String(val)),
		z.string().nonempty({ error: INPUT_REQUIRED }),
	),
	date: requiredDateField(() => getT().common.date),
	description: requiredTextField(2, 500),
	montant: z.preprocess(
		(val) => (val === undefined || val === null ? '' : String(val)),
		z.string().nonempty({ error: INPUT_REQUIRED }),
	),
	notes: optionalTextField(1, 2000),
	globalError: optionalTextField(1, 500),
});

export const expenseSchema = z.object({
	project: z.preprocess(
		(val) => (val === undefined || val === null || val === '' ? '' : String(val)),
		z.string().nonempty({ error: INPUT_REQUIRED }),
	),
	date: requiredDateField(() => getT().common.date),
	category: optionalNumberField(),
	sous_categorie: optionalNumberField(),
	element: optionalTextField(1, 500),
	description: requiredTextField(2, 500),
	montant: z.preprocess(
		(val) => (val === undefined || val === null ? '' : String(val)),
		z.string().nonempty({ error: INPUT_REQUIRED }),
	),
	fournisseur: optionalTextField(1, 255),
	notes: optionalTextField(1, 2000),
	globalError: optionalTextField(1, 500),
});
