/** Pure option/group helpers for Select.svelte — no DOM, no Svelte. */

export interface SelectOption {
	value: string;
	label: string;
}

export interface SelectGroup {
	label: string;
	options: SelectOption[];
}

export type SelectItem = SelectOption | SelectGroup;

export function isGroup(item: SelectItem): item is SelectGroup {
	return 'options' in item;
}

export function flattenOptions(items: SelectItem[]): SelectOption[] {
	return items.flatMap((item) => (isGroup(item) ? item.options : [item]));
}

export function labelFor(items: SelectItem[], value: string): string | undefined {
	return flattenOptions(items).find((option) => option.value === value)?.label;
}

/**
 * Type-ahead for a listbox (ARIA select-only combobox): the index of the option
 * whose label starts with `query`, or -1. A single letter, or the same letter
 * typed again, moves on to the next match (wrapping) so repeats cycle; a longer
 * prefix stays on the current option while it still matches.
 */
export function typeaheadIndex(labels: string[], current: number, query: string): number {
	const typed = query.toLowerCase();
	if (!typed || labels.length === 0) return -1;
	const repeated = [...typed].every((char) => char === typed[0]);
	const needle = repeated ? typed[0] : typed;
	const start = needle.length === 1 ? current + 1 : current;
	for (let offset = 0; offset < labels.length; offset++) {
		const index = (((start + offset) % labels.length) + labels.length) % labels.length;
		if (labels[index].toLowerCase().startsWith(needle)) return index;
	}
	return -1;
}
