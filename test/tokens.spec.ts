import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../css/theme.css', import.meta.url), 'utf8');

const THEMES = {
	nocturne: /:root,\s*:root\[data-theme='nocturne'\]\s*\{/,
	coquette: /:root\[data-theme='coquette'\]\s*\{/
};

function block(theme: keyof typeof THEMES): string {
	const start = css.search(THEMES[theme]);
	if (start < 0) throw new Error(`theme block not found: ${theme}`);
	return css.slice(start, css.indexOf('}', start));
}

function token(body: string, name: string): string {
	const m = body.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`));
	if (!m) throw new Error(`token missing: ${name}`);
	return m[1];
}

function luminance(hex: string): number {
	const [r, g, b] = [1, 3, 5]
		.map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
		.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}

describe.each(['nocturne', 'coquette'] as const)('%s faint text', (theme) => {
	const body = block(theme);
	const faint = token(body, '--mp-faint');
	it('reaches 4.5:1 on surface', () => {
		expect(contrast(faint, token(body, '--mp-surface'))).toBeGreaterThanOrEqual(4.5);
	});
	it('reaches 4.5:1 on surface-raised', () => {
		expect(contrast(faint, token(body, '--mp-surface-raised'))).toBeGreaterThanOrEqual(4.5);
	});
});

describe.each(['nocturne', 'coquette'] as const)('%s readable text', (theme) => {
	const body = block(theme);
	for (const surface of ['--mp-background', '--mp-surface', '--mp-surface-raised']) {
		it(`muted text reaches 4.5:1 on ${surface}`, () => {
			expect(contrast(token(body, '--mp-text-muted'), token(body, surface))).toBeGreaterThanOrEqual(
				4.5
			);
		});
		it(`accent ink reaches 4.5:1 on ${surface}`, () => {
			expect(contrast(token(body, '--mp-accent-ink'), token(body, surface))).toBeGreaterThanOrEqual(
				4.5
			);
		});
	}
	it('labels on an accent fill reach 4.5:1', () => {
		expect(
			contrast(token(body, '--mp-accent-contrast'), token(body, '--mp-accent'))
		).toBeGreaterThanOrEqual(4.5);
	});
});

describe('shared tokens', () => {
	it('maps faint to a utility color', () => {
		expect(css).toContain('--color-faint: var(--mp-faint)');
	});
	it('defines the sheet and control radii', () => {
		expect(css).toContain('--radius-sheet: 16px');
		expect(css).toContain('--radius-control: 8px');
	});
});
