<script lang="ts" module>
	/** Popover panel: raised fill so it lifts off a sheet or drawer. */
	export const selectPanelClass =
		'fixed z-50 max-h-70 overflow-y-auto rounded-control border border-subtle bg-surface-raised py-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.3)]';
</script>

<script lang="ts">
	import { backOut } from 'svelte/easing';
	import { scale } from 'svelte/transition';

	import { motion } from '../utils/motion';
	import {
		flattenOptions,
		isGroup,
		labelFor,
		typeaheadIndex,
		type SelectItem,
		type SelectOption
	} from '../utils/selectOptions';
	import { field } from '../utils/ui';
	import Icon from './Icon.svelte';
	import { isOutside, Popover, portal } from './popover.svelte';

	interface Props {
		value: string;
		options: SelectItem[];
		id?: string;
		ariaLabel?: string;
		disabled?: boolean;
		class?: string;
	}

	let {
		value = $bindable(),
		options,
		id,
		ariaLabel,
		disabled = false,
		class: className = ''
	}: Props = $props();

	const popover = new Popover();
	// Unique per instance, so two Selects without an `id` don't share option ids.
	const uid = $props.id();
	const listboxId = $derived(`${id ?? uid}-listbox`);
	/** How far Page Up / Page Down move the highlight. */
	const PAGE = 10;

	let root: HTMLElement | undefined = $state();
	let trigger: HTMLButtonElement | undefined = $state();
	let panel: HTMLElement | undefined = $state();
	let highlighted = $state(0);

	const flat = $derived(flattenOptions(options));
	const selectedLabel = $derived(labelFor(options, value));
	const activeId = $derived(
		popover.open && flat[highlighted] ? `${listboxId}-${flat[highlighted].value}` : undefined
	);

	// Keep the highlighted row in view as arrow keys move past the visible
	// window — the panel is capped at max-h-70 (~7 rows) but option lists
	// (e.g. goals + subgoals) can easily run longer.
	$effect(() => {
		if (!popover.open) return;
		const option = flat[highlighted];
		if (!option) return;
		document.getElementById(`${listboxId}-${option.value}`)?.scrollIntoView({ block: 'nearest' });
	});

	// Place the panel once it's mounted and its real size is known: flip it
	// above the trigger when there isn't room below, and keep it inside the
	// viewport horizontally.
	$effect(() => {
		if (!popover.open || !panel) return;
		popover.fit(panel);
	});

	function openPanel() {
		if (disabled || !trigger) return;
		const index = flat.findIndex((option) => option.value === value);
		highlighted = Math.max(0, index);
		popover.show(trigger);
	}

	function closePanel() {
		popover.hide();
	}

	function choose(optionValue: string) {
		value = optionValue;
		closePanel();
		trigger?.focus();
	}

	// Type-ahead: letters typed within half a second of each other form one query.
	let typed = '';
	let typedTimer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => () => clearTimeout(typedTimer));

	function typeahead(char: string) {
		clearTimeout(typedTimer);
		typed += char;
		typedTimer = setTimeout(() => (typed = ''), 500);
		const index = typeaheadIndex(
			flat.map((option) => option.label),
			highlighted,
			typed
		);
		if (index >= 0) highlighted = index;
	}

	const isPrintable = (event: KeyboardEvent) =>
		event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;

	/** Keys follow the ARIA select-only combobox pattern. Focus never leaves the
	 * trigger; the highlighted option is exposed through aria-activedescendant. */
	function onTriggerKeydown(event: KeyboardEvent) {
		if (disabled) return;
		const last = flat.length - 1;
		if (!popover.open) {
			if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
				event.preventDefault();
				openPanel();
			} else if (event.key === 'Home' || event.key === 'End') {
				event.preventDefault();
				openPanel();
				highlighted = event.key === 'Home' ? 0 : Math.max(last, 0);
			} else if (isPrintable(event)) {
				event.preventDefault();
				openPanel();
				typeahead(event.key);
			}
			return;
		}
		// A space while typing a query is part of the query, not "choose".
		if (event.key === ' ' && typed) {
			event.preventDefault();
			typeahead(' ');
			return;
		}
		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				highlighted = Math.min(highlighted + 1, last);
				break;
			case 'ArrowUp':
				event.preventDefault();
				if (event.altKey) {
					const option = flat[highlighted];
					if (option) choose(option.value);
				} else {
					highlighted = Math.max(highlighted - 1, 0);
				}
				break;
			case 'Home':
				event.preventDefault();
				highlighted = 0;
				break;
			case 'End':
				event.preventDefault();
				highlighted = Math.max(last, 0);
				break;
			case 'PageUp':
				event.preventDefault();
				highlighted = Math.max(highlighted - PAGE, 0);
				break;
			case 'PageDown':
				event.preventDefault();
				highlighted = Math.min(highlighted + PAGE, last);
				break;
			case 'Enter':
			case ' ': {
				event.preventDefault();
				const option = flat[highlighted];
				if (option) choose(option.value);
				break;
			}
			case 'Tab': {
				// Takes the highlighted option, then lets focus move on as usual.
				const option = flat[highlighted];
				if (option) value = option.value;
				closePanel();
				break;
			}
			case 'Escape':
				event.preventDefault();
				event.stopPropagation();
				closePanel();
				trigger?.focus();
				break;
			default:
				if (isPrintable(event)) {
					event.preventDefault();
					typeahead(event.key);
				}
		}
	}

	function onTriggerFocusOut(event: FocusEvent) {
		if (!popover.open) return;
		const next = event.relatedTarget as Node | null;
		if (next && (root?.contains(next) || panel?.contains(next))) return;
		closePanel();
	}

	function onWindowMousedown(event: MouseEvent) {
		if (popover.open && isOutside(event, root, panel)) closePanel();
	}

	// Follow the trigger on an outside scroll or resize (re-measuring, so it
	// can flip), and only close once the trigger itself has left the viewport.
	function onWindowScroll(event: Event) {
		if (!popover.open) return;
		// Ignore the listbox's own scroll (e.g. scrollIntoView on open/arrow-nav).
		if (panel?.contains(event.target as Node)) return;
		if (!popover.reposition()) closePanel();
	}

	function onWindowResize() {
		if (popover.open && !popover.reposition()) closePanel();
	}
</script>

<svelte:window
	onmousedown={onWindowMousedown}
	onscrollcapture={onWindowScroll}
	onresize={onWindowResize}
/>

<div class="relative {className}" bind:this={root}>
	<button
		bind:this={trigger}
		type="button"
		{id}
		{disabled}
		role="combobox"
		aria-haspopup="listbox"
		aria-expanded={popover.open}
		aria-controls={listboxId}
		aria-activedescendant={activeId}
		aria-label={ariaLabel}
		class="{field.input} flex w-full items-center justify-between gap-2 text-left font-medium disabled:cursor-not-allowed disabled:opacity-60 {disabled
			? ''
			: 'cursor-pointer'}"
		onclick={() => (popover.open ? closePanel() : openPanel())}
		onkeydown={onTriggerKeydown}
		onfocusout={onTriggerFocusOut}
	>
		<span class="truncate {selectedLabel ? '' : 'text-muted'}">{selectedLabel ?? '—'}</span>
		<Icon
			name="chevron-down"
			size={12}
			weight={2.2}
			class="shrink-0 text-muted transition-transform duration-200 {popover.open
				? 'rotate-180'
				: ''}"
		/>
	</button>
</div>

{#snippet optionRow(option: SelectOption)}
	{@const flatIndex = flat.findIndex((candidate) => candidate.value === option.value)}
	<!-- Keyboard nav is centralized on the trigger via aria-activedescendant; this option is
	     never itself focusable, so no keydown handler belongs here. -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<li
		id="{listboxId}-{option.value}"
		role="option"
		aria-selected={option.value === value}
		class="mx-1.5 flex cursor-pointer items-center justify-between gap-2 rounded-control px-2.5 py-2 text-sm transition-colors {flatIndex ===
		highlighted
			? 'bg-accent/15'
			: ''}"
		onclick={() => choose(option.value)}
		onmouseenter={() => (highlighted = flatIndex)}
	>
		<span class="truncate">{option.label}</span>
		{#if option.value === value}
			<Icon name="check" size={13} weight={2.4} class="shrink-0 text-accent-ink" />
		{/if}
	</li>
{/snippet}

{#if popover.open}
	<ul
		use:portal
		bind:this={panel}
		id={listboxId}
		role="listbox"
		class={selectPanelClass}
		style:top={popover.top === null ? null : `${popover.top}px`}
		style:bottom={popover.bottom === null ? null : `${popover.bottom}px`}
		style:left="{popover.left}px"
		style:width="{popover.width}px"
		style:transform-origin={popover.placement === 'above' ? 'bottom left' : 'top left'}
		transition:scale={{ start: 0.92, duration: motion(160), easing: backOut }}
		onmousedown={(event) => event.preventDefault()}
	>
		{#each options as item, index (isGroup(item) ? `group-${index}` : item.value)}
			{#if isGroup(item)}
				<!-- A labelled group, so screen readers say which group an option is in. -->
				<li role="presentation">
					<span
						id="{listboxId}-group-{index}"
						class="block px-3.25 pt-2.5 pb-1 text-2xs font-semibold tracking-[0.06em] text-muted uppercase"
					>
						{item.label}
					</span>
					<ul role="group" aria-labelledby="{listboxId}-group-{index}">
						{#each item.options as option (option.value)}
							{@render optionRow(option)}
						{/each}
					</ul>
				</li>
			{:else}
				{@render optionRow(item)}
			{/if}
		{/each}
	</ul>
{/if}
