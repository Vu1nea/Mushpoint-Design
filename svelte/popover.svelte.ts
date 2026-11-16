/**
 * Shared floating-panel mechanics for Select and DatePicker: position a panel
 * off a trigger's rect, portal it to <body> so it escapes any overflow-hidden
 * ancestor (cards, drawers, modals, the sidebar), and close it on outside click.
 *
 * The panel is `position: fixed` with viewport coordinates, so it is never
 * clipped by an ancestor's overflow. It opens below the trigger, flips above
 * when there isn't room below (and there's more room above), and is clamped
 * horizontally to stay inside the viewport. Callers re-run `reposition()` on
 * scroll/resize so it follows the trigger instead of drifting away from it.
 */

export interface AnchorRect {
	top: number;
	bottom: number;
	left: number;
	width: number;
}

export interface Size {
	width: number;
	height: number;
}

export type Placement = 'below' | 'above';

/**
 * Exactly one of `top` / `bottom` is set (the other is null). When the panel
 * flips above, it is pinned by its *bottom* edge so that if its height
 * changes while open (DatePicker months with 5 vs 6 week rows, the Clear
 * button appearing) it grows upward, away from the trigger, instead of
 * sliding down over it.
 */
export interface PanelPosition {
	top: number | null;
	bottom: number | null;
	left: number;
	placement: Placement;
}

/**
 * Pure placement maths, kept free of the DOM so it can be unit-tested.
 *
 * Vertical: below the anchor if the panel fits there; otherwise above if it
 * fits there; otherwise whichever side has more room, with `top` clamped so
 * the panel's top edge never goes above the viewport margin.
 * Horizontal: left-aligned with the anchor, clamped to [margin, vw - w - margin].
 */
export function placePanel(
	anchor: AnchorRect,
	panel: Size,
	viewport: Size,
	gap = 6,
	margin = 8
): PanelPosition {
	const spaceBelow = viewport.height - anchor.bottom - gap - margin;
	const spaceAbove = anchor.top - gap - margin;
	const placement: Placement =
		panel.height <= spaceBelow || spaceBelow >= spaceAbove ? 'below' : 'above';

	const maxLeft = viewport.width - panel.width - margin;
	const left = Math.max(margin, Math.min(anchor.left, maxLeft));

	if (placement === 'below') return { top: anchor.bottom + gap, bottom: null, left, placement };
	if (panel.height <= spaceAbove) {
		return { top: null, bottom: viewport.height - anchor.top + gap, left, placement };
	}
	// Too tall for either side, more room above: pin the top edge on-screen
	// (it holds the header / first options) and let the rest overflow.
	return { top: margin, bottom: null, left, placement };
}

export class Popover {
	open = $state(false);
	top = $state<number | null>(0);
	bottom = $state<number | null>(null);
	left = $state(0);
	width = $state(0);
	placement = $state<Placement>('below');

	#anchor: HTMLElement | undefined;
	#panel: HTMLElement | undefined;

	show(anchor: HTMLElement) {
		this.#anchor = anchor;
		this.#panel = undefined;
		// First pass before the panel has mounted: assume it opens below.
		// fit() runs again once its real size is known.
		const rect = anchor.getBoundingClientRect();
		this.top = rect.bottom + 6;
		this.bottom = null;
		this.left = rect.left;
		this.width = rect.width;
		this.placement = 'below';
		this.open = true;
	}

	hide() {
		this.open = false;
		this.#panel = undefined;
	}

	/**
	 * Measure the mounted panel and place it (flip above / clamp horizontally).
	 * Uses offsetWidth/offsetHeight rather than getBoundingClientRect so the
	 * open transition's scale() transform doesn't skew the measurement.
	 */
	fit(panel: HTMLElement) {
		this.#panel = panel;
		this.reposition();
	}

	/**
	 * Re-measure the trigger and panel and re-place the panel (call on
	 * scroll/resize). Returns false when the trigger has scrolled fully out of
	 * the viewport, so the caller can close the panel rather than float it
	 * detached from anything.
	 */
	reposition(): boolean {
		if (!this.#anchor) return false;
		const rect = this.#anchor.getBoundingClientRect();
		// clientWidth/Height exclude scrollbars, matching the box that
		// position: fixed (and so `bottom`) is measured against.
		const viewport = {
			width: document.documentElement.clientWidth,
			height: document.documentElement.clientHeight
		};
		if (rect.bottom < 0 || rect.top > viewport.height) return false;
		this.width = rect.width;
		const panel = this.#panel
			? { width: this.#panel.offsetWidth, height: this.#panel.offsetHeight }
			: { width: rect.width, height: 0 };
		const position = placePanel(rect, panel, viewport);
		this.top = position.top;
		this.bottom = position.bottom;
		this.left = position.left;
		this.placement = position.placement;
		return true;
	}
}

/** Reparents the node to <body> on mount, removes it on destroy. */
export function portal(node: HTMLElement) {
	document.body.appendChild(node);
	return {
		destroy() {
			node.remove();
		}
	};
}

export function isOutside(event: MouseEvent, ...nodes: Array<HTMLElement | undefined>): boolean {
	const target = event.target as Node;
	return nodes.every((node) => !node || !node.contains(target));
}
