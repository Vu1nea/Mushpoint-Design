<script lang="ts" module>
	/** Menu item classes; keyboard focus is an inset outline, visible on the raised panel. */
	export const menuItemClass =
		'block w-full cursor-pointer px-3 py-2 text-left text-sm transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent';
</script>

<script lang="ts">
	/**
	 * Row action menu: a `⋯` button opening a popover of items. Arrow keys /
	 * Home / End move focus, Escape closes and refocuses the button, and an
	 * outside click closes. Clicks and keys stop propagating so a surrounding
	 * clickable DataTable row is not triggered.
	 */
	import { tick } from 'svelte';

	import { isOutside, Popover, portal } from './popover.svelte';

	interface Props {
		items: { label: string; onSelect: () => void; danger?: boolean }[];
		label: string;
	}

	let { items, label }: Props = $props();

	const popover = new Popover();
	let trigger: HTMLButtonElement | undefined = $state();
	let panel: HTMLElement | undefined = $state();

	$effect(() => {
		if (!popover.open || !panel) return;
		popover.fit(panel);
	});

	const buttons = () =>
		Array.from(panel?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);

	async function openMenu() {
		if (!trigger) return;
		popover.show(trigger);
		await tick();
		buttons()[0]?.focus();
	}

	function close(refocus = false) {
		popover.hide();
		if (refocus) trigger?.focus();
	}

	function select(item: Props['items'][number]) {
		item.onSelect();
		close(true);
	}

	function onMenuKeydown(event: KeyboardEvent) {
		event.stopPropagation();
		const list = buttons();
		const index = list.indexOf(document.activeElement as HTMLElement);
		let next = -1;
		if (event.key === 'ArrowDown') next = (index + 1) % list.length;
		else if (event.key === 'ArrowUp') next = (index - 1 + list.length) % list.length;
		else if (event.key === 'Home') next = 0;
		else if (event.key === 'End') next = list.length - 1;
		else if (event.key === 'Escape') {
			event.preventDefault();
			close(true);
			return;
		} else if (event.key === 'Tab') {
			close();
			return;
		} else return;
		event.preventDefault();
		list[next]?.focus();
	}

	function onTriggerKeydown(event: KeyboardEvent) {
		event.stopPropagation();
		if (event.key === 'ArrowDown' && !popover.open) {
			event.preventDefault();
			openMenu();
		}
	}

	function onWindowMousedown(event: MouseEvent) {
		if (popover.open && isOutside(event, trigger, panel)) close();
	}

	function onWindowScroll(event: Event) {
		if (!popover.open || panel?.contains(event.target as Node)) return;
		if (!popover.reposition()) close();
	}

	function onWindowResize() {
		if (popover.open && !popover.reposition()) close();
	}
</script>

<svelte:window
	onmousedown={onWindowMousedown}
	onscrollcapture={onWindowScroll}
	onresize={onWindowResize}
/>

<button
	bind:this={trigger}
	type="button"
	aria-haspopup="menu"
	aria-expanded={popover.open}
	aria-label={label}
	class="inline-flex size-8 cursor-pointer items-center justify-center rounded-control text-muted transition-colors hover:bg-surface-raised hover:text-content focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
	onclick={(event) => {
		event.stopPropagation();
		if (popover.open) close();
		else openMenu();
	}}
	onkeydown={onTriggerKeydown}
>
	<span aria-hidden="true">⋯</span>
</button>

{#if popover.open}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
	<div
		use:portal
		bind:this={panel}
		role="menu"
		aria-label={label}
		tabindex="-1"
		class="fixed z-50 min-w-40 rounded-control border border-subtle bg-surface-raised py-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.3)]"
		style:top={popover.top === null ? null : `${popover.top}px`}
		style:bottom={popover.bottom === null ? null : `${popover.bottom}px`}
		style:left="{popover.left}px"
		onkeydown={onMenuKeydown}
		onclick={(event) => event.stopPropagation()}
	>
		{#each items as item, index (index)}
			<button
				type="button"
				role="menuitem"
				class="{menuItemClass} {item.danger ? 'text-danger' : 'text-content'}"
				onclick={() => select(item)}
			>
				{item.label}
			</button>
		{/each}
	</div>
{/if}
