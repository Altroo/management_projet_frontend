export type ChatShortcut = { command: string; title: string; help: string; example: string };
export type NavigationTarget = {
	application: 'management_projet';
	resource: string;
	identifier: number | null;
	company_id: number;
	path: string;
};
export type ChatRecord = {
	id: number;
	name?: string;
	number?: string;
	description?: string;
	notes?: string;
	project?: string;
	client?: string;
	supplier?: string;
	status?: string;
	date?: string;
	amount?: string;
	currency?: string;
	navigation?: NavigationTarget;
	details?: { label: string; label_en: string; value: string }[];
};
export type ChatCard = {
	type:
		'record_list' | 'financial_summary' | 'navigation' | 'knowledge' | 'confirmation' | 'confirmation_status' | 'pdf';
	resource?: string;
	items?: ChatRecord[];
	has_more?: boolean;
	target?: NavigationTarget;
	metric?: string;
	value?: string;
	currency?: string;
	period?: { from: string; to: string };
	scope?: string;
	documents?: { document_id: string; version: string; title: string; content: string }[];
	action_id?: string;
	operation?: 'update' | 'delete';
	record_id?: number;
	company_id?: number;
	label?: string;
	changes?: Record<string, string | null>;
	before?: Record<string, string | null>;
	warning?: string;
	message?: string;
	number?: string;
};
export type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string; cards?: ChatCard[] };
export type ChatCapabilities = {
	application?: 'management_projet';
	languages: string[];
	companies: {
		id: number;
		name: string;
		can_update: boolean;
		can_delete: boolean;
		can_create: boolean;
		can_print: boolean;
		suggestions: string[];
		shortcuts?: ChatShortcut[];
	}[];
};
