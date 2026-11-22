<script lang="ts">
	import { stat } from '../utils/ui';

	interface Props {
		label: string;
		value: string | number;
		delta?: string;
		tone?: 'up' | 'down' | 'flat';
	}

	let { label, value, delta, tone = 'flat' }: Props = $props();

	const word = $derived({ up: 'up', down: 'down', flat: 'no change' }[tone]);
</script>

<dl class="flex flex-col gap-0.5">
	<dt class={stat.label}>{label}</dt>
	<dd class="m-0 flex items-baseline gap-2">
		<span class={stat.value}>{value}</span>
		{#if delta}
			<span class={stat.delta}><span class="sr-only">{word}</span>{delta}</span>
		{/if}
	</dd>
</dl>
