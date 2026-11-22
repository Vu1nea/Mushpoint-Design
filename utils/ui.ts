/**
 * Shared class strings for the handful of elements that repeat everywhere.
 * Cheaper than a component per control, and keeps every screen on the same
 * tokens instead of re-deriving spacing and colors per page.
 */

const focusRing =
	'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

export const button = {
	/** The one loud action per screen: "New Goal", "New Task", drawer submit. */
	primary: `inline-flex items-center justify-center gap-1.5 rounded-control bg-accent px-4.5 py-2.75 text-sm font-semibold text-accent-contrast transition-opacity hover:opacity-90 disabled:opacity-75 ${focusRing}`,
	ghost: `inline-flex items-center justify-center gap-1.5 rounded-control bg-transparent px-3.5 py-2 text-sm font-semibold text-muted transition-colors hover:bg-surface-raised hover:text-content disabled:opacity-50 ${focusRing}`,
	danger: `inline-flex items-center justify-center gap-1.5 rounded-control bg-transparent px-3.5 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger/15 disabled:opacity-50 ${focusRing}`,
	/** Square, borderless, icon-only — the edit/delete pair on a detail panel. */
	icon: `inline-flex items-center justify-center rounded-control p-1.5 text-muted transition-colors hover:bg-surface-raised hover:text-content disabled:opacity-50 ${focusRing}`,
	/** Icon with no chrome at all: sidebar collapse, drawer close. */
	bare: `inline-flex items-center justify-center rounded-control p-1 text-muted transition-colors hover:text-content disabled:opacity-50 ${focusRing}`
};

/** Rounded filter pill. Active reads as a tinted pill, not a filled accent block. */
export function chip(active: boolean): string {
	return `rounded-full px-3.5 py-1.75 text-sm font-semibold transition-colors ${focusRing} ${
		active ? 'bg-surface-raised text-content' : 'bg-transparent text-muted hover:text-content'
	}`;
}

/** Toggle in a row of options (timeframe, status, filters). Flat: the selected one is
 * marked by an underline, not a raised box, so a row of them never reads as buttons. */
export function segment(active: boolean): string {
	return `flex-1 rounded-none border-b-2 px-2 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${focusRing} ${
		active
			? 'border-accent text-content'
			: 'border-transparent text-muted hover:text-content'
	}`;
}

/** Flat sheet on the canvas: one hairline, no shadow. */
export const sheet = 'rounded-[var(--radius-sheet)] bg-surface border border-subtle';

/** Dense list row inside a sheet. */
export const row =
	'min-h-11 border-b border-subtle last:border-b-0 hover:bg-surface-raised transition-colors';

export type PillTone = 'neutral' | 'active' | 'done' | 'warn' | 'danger';

const pillFill: Record<PillTone, string> = {
	neutral: 'bg-surface-raised',
	active: 'bg-accent-tertiary/15',
	done: 'bg-accent-secondary/15',
	warn: 'bg-warn/15',
	danger: 'bg-danger/15'
};

/** Capsule label; the leading dot is the component's job. */
export function pill(tone: PillTone): string {
	return `inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold text-content ${pillFill[tone]}`;
}

export const stat = {
	value: 'text-2xl font-semibold tabular-nums text-content',
	label: 'text-xs font-semibold text-faint',
	delta: 'text-xs font-semibold tabular-nums text-muted'
};

export const field = {
	input: `w-full rounded-control border border-subtle bg-transparent px-3.25 py-2.75 text-sm text-content transition-colors placeholder:text-muted/60 focus:border-accent focus:outline-none`,
	/**
	 * Inline "add another one" affordance — dashed so it reads as optional. Width
	 * is left to the caller, since these often sit side by side in a flex row.
	 */
	dashed: `rounded-control border border-dashed border-subtle bg-transparent px-3.5 py-2.75 text-md text-content transition-colors placeholder:text-muted/60 focus:border-accent focus:outline-none`,
	label: 'mb-1.5 block text-xs font-semibold text-muted'
};

/** Section titles above a group of cards. */
export const sectionHeading = 'text-sm font-semibold tracking-[0.06em] text-muted uppercase';
