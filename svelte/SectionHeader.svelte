<script lang="ts">
	import type { Snippet } from 'svelte';

	let { title, count, actions }: { title: string; count?: number; actions?: Snippet } = $props();
</script>

<div class="flex min-h-11 items-center justify-between gap-3 border-b border-subtle px-4">
	<h2 class="flex items-baseline gap-2 text-sm font-semibold text-content">
		{title}
		{#if count !== undefined}
			<span class="text-xs font-semibold text-faint tabular-nums">{count}</span>
		{/if}
	</h2>
	{#if actions}
		<div class="flex items-center gap-1">{@render actions()}</div>
	{/if}
</div>
