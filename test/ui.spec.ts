import { describe, expect, it } from 'vitest';
import { button, chip, field, pill, row, segment, sheet, stat, type PillTone } from '../utils/ui';

const tones: PillTone[] = ['neutral', 'active', 'done', 'warn', 'danger'];

describe('class builders', () => {
	it('pill is a capsule', () => {
		expect(pill('done')).toContain('rounded-full');
	});
	it('each pill tone is distinct', () => {
		expect(new Set(tones.map(pill)).size).toBe(tones.length);
	});
	it('sheet is flat', () => {
		expect(sheet).not.toContain('shadow');
		expect(sheet).toContain('border-subtle');
	});
	it('row is dense with hairline dividers', () => {
		expect(row).toContain('min-h-11');
		expect(row).toContain('border-subtle');
	});
	it('stat uses tabular numbers and faint label', () => {
		expect(stat.value).toContain('tabular-nums');
		expect(stat.label).toContain('text-faint');
		expect(stat.delta).toBeTruthy();
	});
	it('ghost button is borderless', () => {
		expect(button.ghost).not.toContain('border ');
	});
	it('chip active differs and is not a filled accent block', () => {
		expect(chip(true)).not.toBe(chip(false));
		expect(chip(true)).not.toContain('bg-accent ');
		expect(segment(true)).not.toContain('bg-accent ');
	});
});

describe('segment', () => {
	it('never wraps a label and its count onto two lines', () => {
		expect(segment(true)).toContain('whitespace-nowrap');
		expect(segment(false)).toContain('whitespace-nowrap');
	});
});

describe('flat controls', () => {
	it('marks the selected segment with an underline, not a fill', () => {
		expect(segment(true)).toContain('border-b-2');
		expect(segment(true)).toContain('border-accent');
		expect(segment(true)).not.toMatch(/(^|\s)bg-(surface|surface-raised|track)(\s|$)/);
		expect(segment(false)).not.toMatch(/(^|\s)bg-(surface|surface-raised|track)(\s|$)/);
	});

	it('draws inputs without a fill', () => {
		expect(field.input).toContain('bg-transparent');
		expect(field.input).not.toContain('bg-track');
	});
});
