/** Pure calendar math for DatePicker.svelte — no DOM, no Svelte. */

export interface CalendarDay {
	iso: string;
	day: number;
	inCurrentMonth: boolean;
	isToday: boolean;
	isSelected: boolean;
}

function pad(value: number): string {
	return String(value).padStart(2, '0');
}

/** `month` is 0-indexed, matching `Date`. */
export function isoOf(year: number, month: number, day: number): string {
	const date = new Date(year, month, day);
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayIso(now: Date = new Date()): string {
	return isoOf(now.getFullYear(), now.getMonth(), now.getDate());
}

export function addDays(iso: string, delta: number): string {
	const [year, month, day] = iso.split('-').map(Number);
	const date = new Date(year, month - 1, day + delta);
	return isoOf(date.getFullYear(), date.getMonth(), date.getDate());
}

export function shiftMonth(
	year: number,
	month: number,
	delta: number
): { year: number; month: number } {
	const date = new Date(year, month + delta, 1);
	return { year: date.getFullYear(), month: date.getMonth() };
}

export function monthLabel(year: number, month: number): string {
	return new Date(year, month, 1).toLocaleDateString(undefined, {
		month: 'long',
		year: 'numeric'
	});
}

/** Always 42 cells (6 full weeks, Sunday-first), including the leading/trailing
 * days of neighboring months needed to fill the grid. */
export function monthGrid(
	year: number,
	month: number,
	selectedIso: string | null,
	today: string
): CalendarDay[] {
	const firstOfMonth = new Date(year, month, 1);
	const gridStart = new Date(year, month, 1 - firstOfMonth.getDay());

	return Array.from({ length: 42 }, (_, index) => {
		const date = new Date(
			gridStart.getFullYear(),
			gridStart.getMonth(),
			gridStart.getDate() + index
		);
		const iso = isoOf(date.getFullYear(), date.getMonth(), date.getDate());
		return {
			iso,
			day: date.getDate(),
			inCurrentMonth: date.getMonth() === month,
			isToday: iso === today,
			isSelected: iso === selectedIso
		};
	});
}

/**
 * Where a key press moves focus in a month grid, as an ISO day, or null for a
 * key the grid doesn't handle. Follows the ARIA date-grid pattern: arrows move a
 * day or a week, Home/End go to the start/end of the week (Sunday first), Page
 * Up/Down a month and, with Shift, a year. The day clamps to the target month's
 * length (Mar 31 to Feb 28).
 */
export function dayKeyTarget(iso: string, key: string, shift = false): string | null {
	const [year, month, day] = iso.split('-').map(Number);
	const weekday = new Date(year, month - 1, day).getDay();
	switch (key) {
		case 'ArrowLeft':
			return addDays(iso, -1);
		case 'ArrowRight':
			return addDays(iso, 1);
		case 'ArrowUp':
			return addDays(iso, -7);
		case 'ArrowDown':
			return addDays(iso, 7);
		case 'Home':
			return addDays(iso, -weekday);
		case 'End':
			return addDays(iso, 6 - weekday);
		case 'PageUp':
		case 'PageDown': {
			const next = shiftMonth(year, month - 1, (key === 'PageUp' ? -1 : 1) * (shift ? 12 : 1));
			const lastDay = new Date(next.year, next.month + 1, 0).getDate();
			return isoOf(next.year, next.month, Math.min(day, lastDay));
		}
		default:
			return null;
	}
}
