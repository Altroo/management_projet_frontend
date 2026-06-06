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
		(val) => {
			if (val === undefined || val === null || val === '') return undefined;
			if (typeof val === 'string') {
				const parsed = Number(val);
				return Number.isNaN(parsed) ? val : parsed;
			}
			return val;
		},
		z.number().optional(),
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
	client: optionalNumberField(),
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

export const projectStatusSchema = z.object({
	name: requiredTextField(2, 60),
	color: requiredChoiceTextField(),
	is_active: z.boolean(),
	ordering: optionalNumberField(),
	globalError: optionalTextField(1, 500),
});

export const clientSchema = z.object({
	nom: requiredTextField(2, 200),
	telephone: optionalTextField(1, 30),
	email: z.preprocess(
		(val) => (val === undefined || val === null || val === '' ? undefined : val),
		z.email({ error: MINI_INPUT_EMAIL }).optional(),
	),
	adresse: optionalTextField(1, 2000),
	globalError: optionalTextField(1, 500),
});

export const supplierSchema = z.object({
	nom: requiredTextField(2, 200),
	contact: optionalTextField(1, 200),
	specialite: optionalTextField(1, 200),
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

export const expenseSchema = z
	.object({
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
		frais_de_service: z.boolean(),
		frais_de_service_valeur: z.preprocess(
			(val) => (val === undefined || val === null ? '' : String(val)),
			z.string().optional(),
		),
		frais_de_service_type: z.enum(['percentage', 'fixed']),
		supplier: optionalNumberField(),
		fournisseur: optionalTextField(1, 255),
		notes: optionalTextField(1, 2000),
		globalError: optionalTextField(1, 500),
	})
	.superRefine((data, ctx) => {
		if (!data.frais_de_service) return;
		if (!data.frais_de_service_valeur) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: INPUT_REQUIRED(),
				path: ['frais_de_service_valeur'],
			});
			return;
		}
		const value = Number(data.frais_de_service_valeur.replace(',', '.'));
		if (Number.isNaN(value) || value <= 0) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: getT().validation.serviceFeePositive,
				path: ['frais_de_service_valeur'],
			});
		}
		if (data.frais_de_service_type === 'percentage' && value > 100) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: getT().validation.serviceFeePercentageMax,
				path: ['frais_de_service_valeur'],
			});
		}
	});

export const paymentScheduleSchema = z.object({
	project: z.preprocess(
		(val) => (val === undefined || val === null || val === '' ? '' : String(val)),
		z.string().nonempty({ error: INPUT_REQUIRED }),
	),
	due_date: requiredDateField(() => getT().common.date),
	expected_amount: z.preprocess(
		(val) => (val === undefined || val === null ? '' : String(val)),
		z.string().nonempty({ error: INPUT_REQUIRED }),
	),
	description: requiredTextField(2, 500),
	notes: optionalTextField(1, 2000),
	globalError: optionalTextField(1, 500),
});
