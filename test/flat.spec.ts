import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';

import { datePanelClass } from '../svelte/DatePicker.svelte';
import ErrorBanner from '../svelte/ErrorBanner.svelte';
import { selectPanelClass } from '../svelte/Select.svelte';

describe('flat restyle contracts', () => {
	it('ErrorBanner message text is text-content, warn only on icon/border/tint', () => {
		const { body } = render(ErrorBanner, { props: { error: new Error('boom') } });
		expect(body).toMatch(/<p class="[^"]*text-content[^"]*">Something went wrong<\/p>/);
		expect(body).not.toMatch(/<p[^>]*text-warn/);
		expect(body).toContain('border-warn/40');
		expect(body).toContain('bg-warn/10');
	});

	it('Select and DatePicker popovers use a raised fill and a visible shadow', () => {
		for (const cls of [selectPanelClass, datePanelClass]) {
			expect(cls).toContain('bg-surface-raised');
			expect(cls).toContain('border-subtle');
			expect(cls).toContain('rgba(0,0,0,0.3)');
		}
	});
});
