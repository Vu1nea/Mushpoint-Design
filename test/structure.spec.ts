import { describe, expect, it } from 'vitest';
import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';

import Breadcrumb from '../svelte/Breadcrumb.svelte';
import Pill from '../svelte/Pill.svelte';
import SectionHeader from '../svelte/SectionHeader.svelte';
import Segmented from '../svelte/Segmented.svelte';
import Stat from '../svelte/Stat.svelte';

const text = (s: string) => createRawSnippet(() => ({ render: () => `<span>${s}</span>` }));

describe('structural components', () => {
	it('Stat renders value, label and an sr-only delta word', () => {
		const { body } = render(Stat, {
			props: { label: 'Streak', value: 12, delta: '+2', tone: 'up' }
		});
		expect(body).toContain('12');
		expect(body).toContain('Streak');
		expect(body).toMatch(/<span class="sr-only">up<\/span> \+2/);
	});

	it('Segmented marks the selected option and shows counts', () => {
		const { body } = render(Segmented, {
			props: {
				ariaLabel: 'Status',
				value: 'b',
				options: [
					{ value: 'a', label: 'Alpha', count: 3 },
					{ value: 'b', label: 'Beta', count: 7 }
				]
			}
		});
		expect(body).toContain('role="radiogroup"');
		// Beta's own button is the selected one, and only that one.
		expect(body).toMatch(/<button[^>]*aria-checked="true"[^>]*>\s*Beta/);
		expect(body).toMatch(/<button[^>]*aria-checked="false"[^>]*>\s*Alpha/);
		expect(body.match(/aria-checked="true"/g)).toHaveLength(1);
		// Roving tabindex: selected 0, the rest -1.
		expect(body).toMatch(/<button[^>]*tabindex="0"[^>]*>\s*Beta/);
		expect(body).toMatch(/<button[^>]*tabindex="-1"[^>]*>\s*Alpha/);
		// Counts render in their own element next to the right label.
		expect(body).toMatch(/Alpha\s*(?:<!--[^>]*-->)?<span[^>]*>3<\/span>/);
		expect(body).toMatch(/Beta\s*(?:<!--[^>]*-->)?<span[^>]*>7<\/span>/);
	});

	it('Segmented makes the first option tabbable when value is not in options', () => {
		const { body } = render(Segmented, {
			props: {
				ariaLabel: 'Status',
				value: 'zzz',
				options: [
					{ value: 'a', label: 'Alpha' },
					{ value: 'b', label: 'Beta' }
				]
			}
		});
		expect(body).not.toContain('aria-checked="true"');
		expect(body).toMatch(/<button[^>]*tabindex="0"[^>]*>\s*Alpha/);
		expect(body).toMatch(/<button[^>]*tabindex="-1"[^>]*>\s*Beta/);
		expect(body.match(/tabindex="0"/g)).toHaveLength(1);
	});

	it('Breadcrumb last item is current and not a link', () => {
		const { body } = render(Breadcrumb, {
			props: { items: [{ label: 'Goals', href: '/goals' }, { label: 'Run' }] }
		});
		expect(body).toContain('aria-label="Breadcrumb"');
		expect(body).toMatch(/<a [^>]*href="\/goals"/);
		expect(body).toMatch(/<span[^>]*aria-current="page"[^>]*>Run<\/span>/);
		expect(body.match(/<a /g)).toHaveLength(1);
	});

	it('SectionHeader renders an h2', () => {
		const { body } = render(SectionHeader, { props: { title: 'Tasks', count: 4 } });
		expect(body).toMatch(/<h2[^>]*>\s*Tasks[\s\S]*<\/h2>/);
	});

	it('Pill renders children inside a rounded-full element', () => {
		const { body } = render(Pill, { props: { tone: 'done', children: text('Done') } });
		expect(body).toMatch(/rounded-full[^>]*>[\s\S]*Done/);
	});
});
