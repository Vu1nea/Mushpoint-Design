<script lang="ts" generics="R">
	/**
	 * Dense ARIA table on CSS grid. Columns with `hideBelow: 'md'` are hidden
	 * (header and cells) under the md breakpoint and dropped from the grid
	 * template, so narrow widths never scroll sideways.
	 *
	 * With `onRowClick`, rows are keyboard-operable (Tab, Enter, Space). A
	 * `RowMenu` inside a row stops its own clicks and keys from bubbling, so
	 * using the menu never triggers the row click.
	 */
	import type { Snippet } from 'svelte';

	import { row as rowClass } from '../utils/ui';

	interface Column {
		key: string;
		label: string;
		width?: string;
		align?: 'start' | 'end';
		hideBelow?: 'md';
	}

	interface Props {
		columns: Column[];
		rows: R[];
		rowKey: (row: R) => string | number;
		cell: Snippet<[R, string]>;
		empty: string;
		ariaLabel: string;
		onRowClick?: (row: R) => void;
	}

	let { columns, rows, rowKey, cell, empty, ariaLabel, onRowClick }: Props = $props();

	const template = (cols: Column[]) => cols.map((c) => c.width ?? '1fr').join(' ');
	const wide = $derived(template(columns));
	const narrow = $derived(template(columns.filter((c) => !c.hideBelow)));

	const grid =
		'grid [grid-template-columns:var(--cols-narrow)] md:[grid-template-columns:var(--cols-wide)]';
	const cellClass = (c: Column) =>
		`min-w-0 truncate px-3 py-2 ${c.align === 'end' ? 'text-right' : ''} ${
			c.hideBelow ? 'max-md:hidden' : ''
		}`;

	function onKeydown(event: KeyboardEvent, r: R) {
		if (event.target !== event.currentTarget) return;
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onRowClick?.(r);
		}
	}
</script>

<div role="table" aria-label={ariaLabel} style:--cols-wide={wide} style:--cols-narrow={narrow}>
	<div role="row" class="{grid} border-b border-subtle">
		{#each columns as column (column.key)}
			<div
				role="columnheader"
				class="{cellClass(column)} text-xs font-semibold tracking-[0.06em] text-muted uppercase"
			>
				{column.label}
			</div>
		{/each}
	</div>
	{#if rows.length === 0}
		<div role="row" class="{rowClass} flex items-center">
			<div role="cell" class="min-w-0 px-3 py-2 text-sm text-muted">{empty}</div>
		</div>
	{:else}
		{#each rows as r (rowKey(r))}
			{#if onRowClick}
				<div
					role="row"
					tabindex="0"
					class="{rowClass} {grid} cursor-pointer items-center focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
					onclick={() => onRowClick(r)}
					onkeydown={(event) => onKeydown(event, r)}
				>
					{#each columns as column (column.key)}
						<div role="cell" class="{cellClass(column)} text-sm">{@render cell(r, column.key)}</div>
					{/each}
				</div>
			{:else}
				<div role="row" class="{rowClass} {grid} items-center">
					{#each columns as column (column.key)}
						<div role="cell" class="{cellClass(column)} text-sm">{@render cell(r, column.key)}</div>
					{/each}
				</div>
			{/if}
		{/each}
	{/if}
</div>
