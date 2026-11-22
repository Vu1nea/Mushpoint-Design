<script lang="ts">
	import type { Snippet } from 'svelte';

	import { pill, type PillTone } from '../utils/ui';

	let { tone, children }: { tone: PillTone; children: Snippet } = $props();
</script>

<span class={pill(tone)}>
	<span class="size-1.5 rounded-full bg-current" aria-hidden="true"></span>
	{@render children()}
</span>
