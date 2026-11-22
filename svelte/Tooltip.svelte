<script lang="ts">
	import type { Snippet } from 'svelte';
	import { scale } from 'svelte/transition';

	import { motion } from '../utils/motion';

	interface Props {
		text: string;
		children: Snippet;
	}

	let { text, children }: Props = $props();

	let anchor: HTMLElement | undefined = $state();
	let visible = $state(false);
	let top = $state(0);
	let left = $state(0);
	let showTimer: ReturnType<typeof setTimeout> | undefined;

	/** Fixed positioning (rather than an absolutely-positioned child of the
	 * trigger) so the bubble escapes any `overflow-hidden` card/panel the
	 * trigger happens to sit inside — several do (rounded cards, the sidebar). */
	function place() {
		if (!anchor) return;
		const rect = anchor.getBoundingClientRect();
		top = rect.top;
		left = rect.left + rect.width / 2;
	}

	// A brief delay so brushing past a row of icons doesn't flash a caption
	// for every single one — only a pause reveals the caption.
	function show() {
		clearTimeout(showTimer);
		showTimer = setTimeout(() => {
			place();
			visible = true;
		}, 400);
	}

	function hide() {
		clearTimeout(showTimer);
		visible = false;
	}

	// Stale coordinates are worse than a missing tooltip, so drop it on any
	// scroll/resize rather than tracking the trigger's position live.
	function hideOnMove() {
		if (visible) hide();
	}

	/** Shows on hover and keyboard focus, hides on leave and blur. */
	function hoverable(node: HTMLElement) {
		const events = [
			['mouseenter', show],
			['mouseleave', hide],
			['focusin', show],
			['focusout', hide]
		] as const;
		for (const [type, fn] of events) node.addEventListener(type, fn);
		return {
			destroy() {
				for (const [type, fn] of events) node.removeEventListener(type, fn);
			}
		};
	}

	/** Reparent to <body> so `position: fixed` coordinates aren't relative to
	 * some transformed ancestor, and so stacking order always wins. */
	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				node.remove();
			}
		};
	}
</script>

<svelte:window onscroll={hideOnMove} onresize={hideOnMove} />

<!-- No role: a role="group" wrapper inside a <button> removes the icon's
	 label from the button's accessible name, leaving icon-only buttons
	 unnamed. Listeners are bound by an action so the plain span needs no role. -->
<span bind:this={anchor} class="tooltip-anchor" use:hoverable>
	{@render children()}
</span>

{#if visible}
	<span
		use:portal
		class="tooltip-bubble"
		role="tooltip"
		style="top: {top}px; left: {left}px;"
		transition:scale={{ start: 0.92, duration: motion(120) }}
	>
		{text}
		<span class="tooltip-arrow" aria-hidden="true"></span>
	</span>
{/if}

<style>
	.tooltip-anchor {
		display: inline-flex;
	}

	.tooltip-bubble {
		position: fixed;
		z-index: 1000;
		translate: -50% calc(-100% - 8px);
		white-space: nowrap;
		border-radius: var(--radius-control);
		border: 1px solid var(--mp-border);
		background: var(--mp-surface-raised);
		color: var(--mp-text);
		padding: 5px 9px;
		font-size: var(--text-2xs);
		font-weight: 600;
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.28);
		pointer-events: none;
	}

	.tooltip-arrow {
		position: absolute;
		bottom: -4px;
		left: 50%;
		translate: -50% 0;
		width: 8px;
		height: 8px;
		rotate: 45deg;
		background: var(--mp-surface-raised);
		border-right: 1px solid var(--mp-border);
		border-bottom: 1px solid var(--mp-border);
	}
</style>
