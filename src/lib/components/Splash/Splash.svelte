<script lang="ts">
	import { fade } from 'svelte/transition';
	let isGone = $state(false);
</script>

{#if !isGone}
	<button
		class="bg-primary-500 absolute left-0 top-0 flex h-full w-full items-center justify-center border"
		out:fade
		onclick={() => {
			isGone = true;
		}}
	>
		<img src="/icons/Logo.svg" class="h-[46px] w-[194px]" alt="logo" />
	</button>
{/if}
