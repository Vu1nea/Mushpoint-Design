<script lang="ts">
	import type { Snippet } from 'svelte';

	import { sheet } from '../utils/ui';

	let { class: className = '', children }: { class?: string; children: Snippet } = $props();
</script>

<section class="{sheet} {className}">
	{@render children()}
</section>
