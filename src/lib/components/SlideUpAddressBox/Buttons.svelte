<script lang="ts">
	import { slide } from 'svelte/transition';

	let {
		isMicrophoneActive,
		isGpsVisible,
		onMicrophoneClick
	}: { isMicrophoneActive: boolean; isGpsVisible: boolean; onMicrophoneClick: () => any } =
		$props();
</script>

<div class="absolute right-0 top-0">
	{#if isGpsVisible}
		<button
			class="absolute bottom-[74px] right-5 flex aspect-square w-[46px] flex-col-reverse items-center justify-center rounded-full bg-white"
			transition:slide={{ axis: 'x' }}
		>
			<img src="/icons/CrosshairSimple.svg" class="aspect-square w-[26px]" alt="icon" />
		</button>
	{/if}
	<button
		class="absolute bottom-[20px] right-5 flex aspect-square w-[46px] flex-col-reverse items-center justify-center rounded-full bg-white"
		onclick={onMicrophoneClick}
	>
		<img
			src="/icons/Microphone.svg"
			class="aspect-square w-[26px]"
			class:isActive={isMicrophoneActive}
			alt="icon"
		/>
	</button>
</div>

<style>
	.isActive {
		filter: invert(0%) sepia(100%) saturate(1000%) hue-rotate(120deg) brightness(1.2);
	}
</style>
