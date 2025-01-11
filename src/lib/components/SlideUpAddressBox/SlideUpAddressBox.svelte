<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	import Buttons from './Buttons.svelte';

	let {
		onDestinationConfirmed
	}: { onDestinationConfirmed: ({ lat, lng }: { lat: number; lng: number }) => any } = $props();

	let isActive = $state(false);

	let origin = $state('Empire State Building');
	let destinationText = $state('');
	let isMicrophoneActive = $state(false);

	let place: any = $state(null);

	let displayName = $state('');
	let formattedAddress = $state('');
	let destinationPlace: any = $state('');

	onMount(async () => {
		const { Place } = await google.maps.importLibrary('places');
		place = Place;
	});

	async function onchange() {
		if (!place) return;
		const location = (await place.searchByText({ textQuery: destinationText, fields: ['*'] }))
			.places[0];

		destinationPlace = location;

		displayName = location.displayName;
		formattedAddress = location.formattedAddress;
	}
</script>

<div
	class="roundClass absolute bottom-[-490px] left-0 flex h-[760px] w-full flex-col items-center bg-white px-4 pb-4 pt-[30px]"
	class:isActive
>
	<Buttons
		isGpsVisible={!isActive}
		{isMicrophoneActive}
		onMicrophoneClick={() => (isMicrophoneActive = !isMicrophoneActive)}
	/>
	<button class="text-[21px]" onclick={() => (isActive = false)}>지쿠 타고 어디로 갈까요?</button>
	<div class=" mt-6 flex w-full flex-col gap-2">
		<div class="flex h-[48px] w-full items-center rounded-[10px] border border-gray-100 bg-gray-50">
			<img src="/icons/DotGray.svg" class="ml-4 h-4 w-4" alt="dot" />
			<span class="ml-[10px]">현위치</span>
		</div>
		<div class="flex h-[48px] w-full items-center rounded-[10px] border border-gray-100 bg-gray-50">
			<img src="/icons/DotPrimary.svg" class="ml-4 h-4 w-4" alt="dot" />
			<input
				class="caret-primary-500 ml-[10px] w-full border-0 bg-inherit p-0 outline-none placeholder:text-gray-300 focus:ring-0"
				bind:value={destinationText}
				{onchange}
				placeholder="도착지 입력하기"
				onfocus={() => (isActive = true)}
			/>
		</div>
	</div>
	{#if formattedAddress}
		<button
			class="mt-1 flex w-full flex-row gap-2 border-b border-gray-100 px-3 py-4"
			onclick={() => {
				isActive = false;
				onDestinationConfirmed({
					lat: destinationPlace.location.lat(),
					lng: destinationPlace.location.lng()
				});
			}}
			transition:fade
		>
			<img src="/icons/MapPin.svg" class="h-6 w-6" alt="icon" />
			<div class="flex flex-col items-start gap-1">
				<h2 class="text-primary-500 text-[16px]">{displayName}</h2>
				<h3 class="font-regular overflow-clip text-[14px] text-gray-500">{formattedAddress}</h3>
			</div>
		</button>
	{/if}
</div>

{#if !isMicrophoneActive}
	<div class="absolute bottom-0 left-0 flex w-full flex-row gap-3 bg-white p-4" transition:slide>
		<button
			class="h-[50px] w-full rounded-[10px] bg-gray-100 font-bold text-gray-700"
			onclick={() => (isActive = !isActive)}>닫기</button
		>
		<button
			class="bg-primary-500 line-clamp-2 h-[50px] w-full overflow-clip rounded-[10px] font-bold text-white"
			>안내시작</button
		>
	</div>
{/if}

<style>
	.roundClass {
		border-radius: 30px 30px 0px 0px;
		box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.1);
		transition: bottom 0.7s;
	}
	.isActive {
		bottom: 0px;
	}
</style>
