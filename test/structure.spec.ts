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
		expect(body).toMatch(/<span class="sr-only">up<\/span>/);
		expect(body).toContain('+2');
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
		expect(body).toMatch(/aria-checked="true"[^>]*>[\s\S]*?Beta/);
		expect(body.match(/aria-checked="true"/g)).toHaveLength(1);
		expect(body).toContain('3');
		expect(body).toContain('7');
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
