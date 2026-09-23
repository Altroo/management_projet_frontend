import {
	ALL_PROJECTS_CODE,
	areaChartOptions,
	CHART_OPTS,
	doughnutOptions,
	doughnutPalette,
	fields,
	fileInputSx,
	genderItemsList,
	groupedBarOptions,
	horizontalBarOptions,
	ITEM_HEIGHT,
	ITEM_PADDING_TOP,
	MenuProps,
	PROJECT_COLORS,
	projectStatusItemsList,
	STATUS_CHIP_COLORS,
} from './rawData';
import { translations } from '@/translations';

const t = translations.fr;

describe('items lists', () => {
	it('keeps translated project statuses and static chart data available', () => {
		expect(projectStatusItemsList(t)).toHaveLength(8);
		expect(new Set(projectStatusItemsList(t).map(({ code }) => code)).size).toBe(8);
		expect(STATUS_CHIP_COLORS['En cours']).toBe('info');
		expect(CHART_OPTS.responsive).toBe(true);
		expect(PROJECT_COLORS).toHaveLength(8);
		expect(doughnutPalette).toHaveLength(8);
		expect(ALL_PROJECTS_CODE).toBe('__all_projects__');
		expect(doughnutOptions.cutout).toBe('62%');
		expect(horizontalBarOptions.indexAxis).toBe('y');
		expect(areaChartOptions.interaction.mode).toBe('index');
		expect(groupedBarOptions.scales.yMargin.ticks.callback(12)).toBe('12%');
	});

	it('keeps shared form and attachment settings intact', () => {
		expect(fields).toEqual(['one', 'two', 'three', 'four', 'five', 'six']);
		expect(MenuProps.slotProps.paper.style.maxHeight).toBe(ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP);
		expect(fileInputSx.clipPath).toBe('inset(50%)');
	});

	describe('genderItemsList', () => {
		it('has two entries with correct codes and values', () => {
			const items = genderItemsList(t);
			expect(items).toHaveLength(2);

			expect(items[0]).toEqual({ code: 'H', value: t.rawData.genders.male });
			expect(items[1]).toEqual({ code: 'F', value: t.rawData.genders.female });

			const codes = items.map((i) => i.code);
			expect(codes).toEqual(['H', 'F']);

			const values = items.map((i) => i.value);
			expect(values).toEqual([t.rawData.genders.male, t.rawData.genders.female]);
		});

		it('contains unique codes', () => {
			const codes = genderItemsList(t).map((i) => i.code);
			const unique = Array.from(new Set(codes));
			expect(unique).toHaveLength(codes.length);
		});
	});
});
