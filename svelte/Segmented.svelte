<script lang="ts" generics="T extends string">
	/**
	 * Single-choice toggle row (WAI-ARIA radio group). Arrow keys / Home / End
	 * move the selection; only the selected option is in the tab order.
	 */
	import { segment } from '../utils/ui';

	interface Props {
		options: { value: T; label: string; count?: number }[];
		value: T;
		ariaLabel: string;
	}

	let { options, value = $bindable(), ariaLabel }: Props = $props();

	let group: HTMLElement | undefined = $state();
	const hasSelection = $derived(options.some((o) => o.value === value));

	function onKeydown(event: KeyboardEvent) {
		const index = options.findIndex((o) => o.value === value);
		let next = index;
		if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % options.length;
		else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
			next = (index - 1 + options.length) % options.length;
		else if (event.key === 'Home') next = 0;
		else if (event.key === 'End') next = options.length - 1;
		else return;
		event.preventDefault();
		value = options[next].value;
		group?.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
	}
</script>

<!-- svelte-ignore a11y_interactive_supports_focus -->
<div
	bind:this={group}
	role="radiogroup"
	aria-label={ariaLabel}
	class="flex gap-1"
	onkeydown={onKeydown}
>
	{#each options as option, i (option.value)}
		{@const selected = option.value === value}
		{@const tabbable = hasSelection ? selected : i === 0}
		<button
			type="button"
			role="radio"
			aria-checked={selected}
			tabindex={tabbable ? 0 : -1}
			class={segment(selected)}
			onclick={() => (value = option.value)}
		>
			{option.label}
			{#if option.count !== undefined}
				<span class="ml-1 text-faint tabular-nums">{option.count}</span>
			{/if}
		</button>
	{/each}
</div>
