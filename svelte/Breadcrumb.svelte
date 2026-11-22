<script lang="ts">
	let { items }: { items: { label: string; href?: string }[] } = $props();
</script>

<nav aria-label="Breadcrumb">
	<ol class="flex flex-wrap items-center gap-1.5 text-sm text-muted">
		{#each items as item, i (i)}
			{@const last = i === items.length - 1}
			<li class="flex items-center gap-1.5">
				{#if last || !item.href}
					<span class={last ? 'font-semibold text-content' : ''} aria-current={last ? 'page' : undefined}
						>{item.label}</span
					>
				{:else}
					<a
						href={item.href}
						class="transition-colors hover:text-content focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
						>{item.label}</a
					>
				{/if}
				{#if !last}<span class="text-faint" aria-hidden="true">/</span>{/if}
			</li>
		{/each}
	</ol>
</nav>
