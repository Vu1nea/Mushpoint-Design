<script lang="ts">
	import { tick } from 'svelte';
	import { backOut } from 'svelte/easing';
	import { fly, scale } from 'svelte/transition';

	import {
		dayKeyTarget,
		isoOf,
		monthGrid,
		monthLabel,
		shiftMonth,
		todayIso,
		type CalendarDay
	} from '../utils/calendarGrid';
	import { formatDate } from '../utils/format';
	import { motion } from '../utils/motion';
	import { field } from '../utils/ui';
	import Icon from './Icon.svelte';
	import { isOutside, Popover, portal } from './popover.svelte';

	interface Props {
		value: string;
		id?: string;
		ariaLabel?: string;
		placeholder?: string;
		disabled?: boolean;
		/** Use the dashed "optional inline field" style instead of the solid input style. */
		dashed?: boolean;
		class?: string;
	}

	let {
		value = $bindable(),
		id,
		ariaLabel,
		placeholder = 'Pick a date',
		disabled = false,
		dashed = false,
		class: className = ''
	}: Props = $props();

	const WEEKDAYS = [
		['Su', 'Sunday'],
		['Mo', 'Monday'],
		['Tu', 'Tuesday'],
		['We', 'Wednesday'],
		['Th', 'Thursday'],
		['Fr', 'Friday'],
		['Sa', 'Saturday']
	] as const;
	const uid = $props.id();
	const headingId = `${uid}-heading`;
	const valueId = `${uid}-value`;
	// Recomputed on every open (see openPanel) rather than left as a one-time
	// const, so "today" doesn't go stale on a component that stays mounted
	// across midnight.
	let today = $state(todayIso());

	const popover = new Popover();

	let root: HTMLElement | undefined = $state();
	let trigger: HTMLButtonElement | undefined = $state();
	let panel: HTMLElement | undefined = $state();

	let viewYear = $state(0);
	let viewMonth = $state(0);
	// Not derived from `today` (initialized separately, same value) to avoid
	// capturing the $state reference locally — this initial value is only a
	// placeholder anyway, replaced by openPanel() before it's ever shown.
	let activeIso = $state(todayIso());
	let slideDirection = $state(1);

	const grid = $derived(monthGrid(viewYear, viewMonth, value || null, today));
	const heading = $derived(monthLabel(viewYear, viewMonth));
	const weeks = $derived(
		Array.from({ length: grid.length / 7 }, (_, week) => grid.slice(week * 7, week * 7 + 7))
	);

	/** Exactly one text colour per day, so no two colour utilities fight over
	 * it. Other-month days use the full muted token: faded below it fails WCAG AA. */
	function dayTone(day: CalendarDay) {
		if (day.isSelected) return 'mp-pop bg-accent text-accent-contrast';
		if (day.isToday) return 'font-bold text-accent-ink hover:bg-surface-raised';
		return `${day.inCurrentMonth ? 'text-content' : 'text-muted'} hover:bg-surface-raised`;
	}

	function fullDateLabel(iso: string) {
		const [year, month, day] = iso.split('-').map(Number);
		return new Date(year, month - 1, day).toLocaleDateString(undefined, {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function baseYearMonth(): { year: number; month: number } {
		const [year, month] = (value || today).split('-').map(Number);
		return { year, month: month - 1 };
	}

	/** Opens the dialog and moves focus to the selected day (or today). */
	async function openPanel() {
		if (disabled || !trigger) return;
		today = todayIso();
		const base = baseYearMonth();
		viewYear = base.year;
		viewMonth = base.month;
		activeIso = value || today;
		popover.show(trigger);
		await tick();
		focusActive();
	}

	/** Focuses the active day in the month on view. The month's grid is looked up
	 * by its key, because the previous month's grid lingers while it slides out. */
	function focusActive() {
		panel
			?.querySelector<HTMLElement>(
				`[data-month="${viewYear}-${viewMonth}"] [data-iso="${activeIso}"]`
			)
			?.focus();
	}

	function closePanel() {
		popover.hide();
	}

	// Place the panel once it's mounted and its real size is known: flip it
	// above the trigger when there isn't room below (a trigger near the bottom
	// of the screen or of a drawer), and keep it inside the viewport
	// horizontally.
	$effect(() => {
		if (!popover.open || !panel) return;
		popover.fit(panel);
	});

	function pickDay(day: CalendarDay) {
		value = day.iso;
		closePanel();
		trigger?.focus();
	}

	function changeMonth(delta: 1 | -1) {
		slideDirection = delta;
		const next = shiftMonth(viewYear, viewMonth, delta);
		viewYear = next.year;
		viewMonth = next.month;
		// Keep the roving-focus day in the displayed month, same as goToday/pickDay do,
		// so a subsequent arrow-key press moves relative to what's on screen instead of
		// snapping back toward a stale activeIso left over from before the month change.
		// Preserve the day-of-month (clamped to the new month's length) rather than
		// resetting to day 1, so the focus ring doesn't visibly jump on every click.
		const [, , currentDay] = activeIso.split('-').map(Number);
		const daysInNewMonth = new Date(next.year, next.month + 1, 0).getDate();
		activeIso = isoOf(next.year, next.month, Math.min(currentDay, daysInNewMonth));
	}

	function goToday() {
		const [year, month] = today.split('-').map(Number);
		viewYear = year;
		viewMonth = month - 1;
		activeIso = today;
	}

	function clearValue() {
		value = '';
	}

	function setActive(next: string) {
		const [year, month] = next.split('-').map(Number);
		const monthIndex = month - 1;
		if (year !== viewYear || monthIndex !== viewMonth) {
			const before = viewYear * 12 + viewMonth;
			const after = year * 12 + monthIndex;
			slideDirection = after > before ? 1 : -1;
			viewYear = year;
			viewMonth = monthIndex;
		}
		activeIso = next;
	}

	function onTriggerKeydown(event: KeyboardEvent) {
		if (disabled || popover.open) return;
		if (['ArrowDown', 'Enter', ' '].includes(event.key)) {
			event.preventDefault();
			openPanel();
		}
	}

	/** Keys inside the grid follow the ARIA date picker dialog pattern. */
	async function onDayKeydown(event: KeyboardEvent, day: CalendarDay) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			pickDay(day);
			return;
		}
		const next = dayKeyTarget(activeIso, event.key, event.shiftKey);
		if (!next) return;
		event.preventDefault();
		setActive(next);
		await tick();
		focusActive();
	}

	/** The dialog is modal: Escape returns to the trigger and Tab stays inside. */
	function onPanelKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			closePanel();
			trigger?.focus();
			return;
		}
		if (event.key !== 'Tab' || !panel) return;
		const current = `[data-month="${viewYear}-${viewMonth}"]`;
		const stops = [
			...panel.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex="0"]')
		].filter((element) => !element.closest(`[data-month]:not(${current})`));
		if (stops.length === 0) return;
		const first = stops[0];
		const last = stops[stops.length - 1];
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	}

	function onPanelFocusOut(event: FocusEvent) {
		const next = event.relatedTarget as Node | null;
		if (!next || root?.contains(next) || panel?.contains(next)) return;
		closePanel();
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

	// Follow the trigger on scroll/resize (re-measuring, so it can flip), and
	// only close once the trigger itself has left the viewport.
	function onWindowScrollOrResize() {
		if (popover.open && !popover.reposition()) closePanel();
	}
</script>

<svelte:window
	onmousedown={onWindowMousedown}
	onscrollcapture={onWindowScrollOrResize}
	onresize={onWindowScrollOrResize}
/>

<div class="relative {className}" bind:this={root}>
	<button
		bind:this={trigger}
		type="button"
		{disabled}
		aria-haspopup="dialog"
		aria-expanded={popover.open}
		aria-label={ariaLabel}
		aria-describedby={valueId}
		{id}
		class="{dashed
			? field.dashed
			: field.input} flex w-full items-center justify-between gap-2 text-left {disabled
			? 'cursor-not-allowed opacity-60'
			: 'cursor-pointer'}"
		onclick={() => {
			if (disabled) return;
			popover.open ? closePanel() : openPanel();
		}}
		onkeydown={onTriggerKeydown}
		onfocusout={onTriggerFocusOut}
	>
		<span id={valueId} class="truncate {value ? '' : 'text-muted'}">
			{value ? formatDate(value) : placeholder}
		</span>
		<Icon name="calendar" size={14} weight={1.8} class="shrink-0 text-muted" />
	</button>
	{#if value}
		<button
			type="button"
			{disabled}
			aria-label="Clear date"
			class="absolute top-1/2 right-8 -translate-y-1/2 rounded-control p-0.5 text-muted transition-colors hover:text-content disabled:pointer-events-none disabled:opacity-60"
			onclick={(event) => {
				event.stopPropagation();
				clearValue();
			}}
		>
			<Icon name="close" size={12} weight={2.2} />
		</button>
	{/if}
</div>

{#if popover.open}
	<div
		use:portal
		bind:this={panel}
		role="dialog"
		aria-modal="true"
		aria-label="Choose a date"
		tabindex="-1"
		class="fixed z-50 w-70 overflow-hidden rounded-[var(--radius-sheet)] border border-subtle bg-surface p-3 shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
		style:top={popover.top === null ? null : `${popover.top}px`}
		style:bottom={popover.bottom === null ? null : `${popover.bottom}px`}
		style:left="{popover.left}px"
		style:transform-origin={popover.placement === 'above' ? 'bottom left' : 'top left'}
		transition:scale={{ start: 0.92, duration: motion(160), easing: backOut }}
		onkeydown={onPanelKeydown}
		onfocusout={onPanelFocusOut}
	>
		<div class="mb-2 flex items-center justify-between">
			<button
				type="button"
				class="rounded-control p-1 text-muted transition-colors hover:text-content"
				aria-label="Previous month"
				onclick={() => changeMonth(-1)}
			>
				<Icon name="chevron-right" size={13} weight={2.2} class="rotate-180" />
			</button>
			<!-- Live, so moving to another month (by key or button) is announced. -->
			<h2 id={headingId} class="text-sm font-semibold" aria-live="polite">{heading}</h2>
			<button
				type="button"
				class="rounded-control p-1 text-muted transition-colors hover:text-content"
				aria-label="Next month"
				onclick={() => changeMonth(1)}
			>
				<Icon name="chevron-right" size={13} weight={2.2} />
			</button>
		</div>

		<div role="grid" aria-labelledby={headingId}>
			<div role="row" class="mb-1 grid grid-cols-7 text-center">
				{#each WEEKDAYS as [short, long] (short)}
					<span role="columnheader" aria-label={long} class="text-2xs font-semibold text-muted"
						>{short}</span
					>
				{/each}
			</div>

			{#key `${viewYear}-${viewMonth}`}
				<div
					role="rowgroup"
					class="flex flex-col gap-1"
					data-month="{viewYear}-{viewMonth}"
					in:fly={{ x: slideDirection * 24, duration: motion(180), easing: backOut }}
					out:fly={{ x: slideDirection * -24, duration: motion(120) }}
				>
					{#each weeks as week (week[0].iso)}
						<div role="row" class="grid grid-cols-7 text-center">
							{#each week as day (day.iso)}
								<div
									role="gridcell"
									tabindex={day.iso === activeIso ? 0 : -1}
									aria-selected={day.isSelected}
									aria-current={day.isToday ? 'date' : undefined}
									aria-label={fullDateLabel(day.iso)}
									data-iso={day.iso}
									class="mx-auto flex size-7.5 cursor-pointer items-center justify-center rounded-full text-xs transition-colors outline-none
										{day.iso === activeIso ? 'ring-2 ring-accent' : ''}
										{dayTone(day)}"
									onclick={() => pickDay(day)}
									onkeydown={(event) => onDayKeydown(event, day)}
								>
									{day.day}
								</div>
							{/each}
						</div>
					{/each}
				</div>
			{/key}
		</div>

		<div class="mt-2 flex items-center justify-between border-t border-subtle pt-2">
			<button
				type="button"
				class="text-xs font-semibold text-accent-ink"
				onclick={async () => {
					goToday();
					await tick();
					focusActive();
				}}
			>
				Today
			</button>
			{#if value}
				<button
					type="button"
					class="text-xs font-semibold text-muted transition-colors hover:text-content"
					onclick={() => {
						clearValue();
						closePanel();
						trigger?.focus();
					}}
				>
					Clear
				</button>
			{/if}
		</div>
	</div>
{/if}
