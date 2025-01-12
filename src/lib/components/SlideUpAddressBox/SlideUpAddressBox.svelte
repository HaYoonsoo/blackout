<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	import Buttons from './Buttons.svelte';

	let {
		onDestinationConfirmed,
		onNavigationStart
	}: {
		onDestinationConfirmed: ({ lat, lng }: { lat: number; lng: number }) => any;
		onNavigationStart: () => any;
	} = $props();

	let isActive = $state(false);

	let origin = $state('Empire State Building');
	let destinationText = $state('');
	let isMicrophoneActive = $state(false);

	let place: any = $state(null);

	let displayName = $state('');
	let formattedAddress = $state('');
	let destinationPlace: any = $state('');

	let isNavigationStarting = $state(false);

	onMount(async () => {
		// @ts-ignore
		const { Place } = await google.maps.importLibrary('places');
		place = Place;

		//await startRecording();
		//await stopRecording();
		// const intervalId = setInterval(async () => {
		// 	if (isRecording) await stopRecording();
		// 	await startRecording();
		// }, 7000);

		//return () => {clearInterval(intervalId)};
	});

	async function onchange() {
		if (!place) return;
		const location = (await place.searchByText({ textQuery: destinationText, fields: ['*'] }))
			.places[0];

		destinationPlace = location;

		displayName = location.displayName;
		formattedAddress = location.formattedAddress;
	}

	// 리코더 관련 로직
	let isRecording: boolean = false;
	let mediaRecorder: MediaRecorder;
	let audioChunks: Blob[] = [];

	let mp3Encoder: any;

	// Svelte 컴포넌트가 마운트될 때 lamejs(all) 스크립트 로드
	// onMount(async () => {
	// 	// 주의: import 문법 대신 require를 쓰는 경우, Vite/TS 환경에서 문제될 수 있으니
	// 	// 보통은 CDN 스크립트 태그 또는 ES Module 형태로 불러오는 방법을 권장합니다.
	// 	// 여기선 질문 코드에 맞춰서 require('/js/lamejs.all.js')를 사용
	// 	// lamejs = require('/js/lamejs.all.js');
	// 	// mp3Encoder는 인코딩 직전(스펙 확정된 뒤)에 생성할 수도 있음
	// 	// 여기서는 채널 2, 샘플레이트 44.1kHz, 128kbps로 단순 예시
	// });

	async function startRecording(): Promise<void> {
		const stream: MediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
		mediaRecorder = new MediaRecorder(stream);
		mediaRecorder.ondataavailable = (event: BlobEvent) => {
			audioChunks.push(event.data);
		};
		mediaRecorder.start();
		isRecording = true;
	}

	async function stopRecording(): Promise<void> {
		mediaRecorder.stop();
		mediaRecorder.onstop = async () => {
			// 녹음 데이터(audio/webm) -> Blob
			const blob = new Blob(audioChunks, { type: 'audio/webm' });
			audioChunks = [];
			isRecording = false;

			// 1) WebM(Blob) -> ArrayBuffer
			const arrayBuffer = await blob.arrayBuffer();

			// 2) AudioContext로 PCM 디코딩
			const audioContext = new AudioContext();
			const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

			// 3) lamejs Mp3Encoder를 만들고 PCM을 MP3로 변환
			const mp3Blob = await encodeMp3(audioBuffer);

			// 4) MP3 업로드
			await uploadAudio(mp3Blob);
		};
	}

	/**
	 * AudioBuffer -> MP3 Blob
	 */
	async function encodeMp3(audioBuffer: AudioBuffer): Promise<Blob> {
		// sampleRate, 채널 수 확인
		const numChannels = audioBuffer.numberOfChannels; // 예: 2
		const sampleRate = audioBuffer.sampleRate; // 예: 48000 (브라우저마다 다를 수 있음)

		// 필요에 따라 sampleRate를 44100 등으로 강제 다운샘플링할 수도 있으나
		// 여기서는 그대로 사용한다고 가정
		//@ts-ignore
		mp3Encoder = new window.lamejs.Mp3Encoder(numChannels, sampleRate, 128);

		let mp3Data: Uint8Array[] = [];
		const samplesLeft = audioBuffer.getChannelData(0);
		// 모노 녹음이면 2번 채널은 없을 수 있음
		const samplesRight = numChannels > 1 ? audioBuffer.getChannelData(1) : samplesLeft;

		// LAME 인코더는 보통 1152 샘플 단위로 처리
		const blockSize = 1152;

		let leftChunk: Int16Array, rightChunk: Int16Array;

		for (let i = 0; i < samplesLeft.length; i += blockSize) {
			// Float32 -> Int16 변환
			leftChunk = float32ToInt16(samplesLeft.subarray(i, i + blockSize));
			rightChunk = float32ToInt16(samplesRight.subarray(i, i + blockSize));

			// mp3 인코딩
			const mp3buf = mp3Encoder.encodeBuffer(leftChunk, rightChunk);
			if (mp3buf.length > 0) {
				mp3Data.push(mp3buf);
			}
		}

		// flush()로 남은 데이터까지 받아서 담기
		const endBuf = mp3Encoder.flush();
		if (endBuf.length > 0) {
			mp3Data.push(endBuf);
		}

		// mp3Data[]를 하나의 Blob으로
		return new Blob(mp3Data, { type: 'audio/mp3' });
	}

	/**
	 * Float32Array -> Int16Array
	 * (mp3Encoder는 Int16Array PCM 데이터로 인코딩)
	 */
	function float32ToInt16(float32Arr: Float32Array): Int16Array {
		const int16Arr = new Int16Array(float32Arr.length);
		for (let i = 0; i < float32Arr.length; i++) {
			// clamp 해주면서 16bit 변환
			const s = Math.max(-1, Math.min(1, float32Arr[i]));
			int16Arr[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
		}
		return int16Arr;
	}

	/**
	 * 최종적으로 MP3 Blob을 서버로 업로드
	 */
	async function uploadAudio(mp3Blob: Blob): Promise<void> {
		const formData = new FormData();
		formData.append('file', mp3Blob, 'recording.mp3');
		const data = await fetch('http://3.84.234.232:9000/wakeword', {
			method: 'POST',
			body: formData
		});
		console.log(data);
	}
	//
</script>

<div
	class="roundClass absolute bottom-[-490px] left-0 h-[760px] w-full bg-white px-4 pb-4 pt-[30px]"
	class:isActive
	class:endGame={isNavigationStarting}
>
	<Buttons
		isGpsVisible={!isActive}
		{isMicrophoneActive}
		onMicrophoneClick={() => (isMicrophoneActive = !isMicrophoneActive)}
	/>
	{#if !isNavigationStarting}
		{#if !isMicrophoneActive}
			<div
				class=" flex h-full w-full flex-col items-center"
				in:fade={{ delay: 170, duration: 150 }}
				out:fade={{ duration: 150 }}
			>
				<button class="text-[21px] font-semibold" onclick={() => (isActive = false)}
					>지쿠 타고 어디로 갈까요?</button
				>
				<div class=" mt-6 flex w-full flex-col gap-2">
					<div
						class="flex h-[48px] w-full items-center rounded-[10px] border border-gray-100 bg-gray-50"
					>
						<img src="/icons/DotGray.svg" class="ml-4 h-4 w-4" alt="dot" />
						<span class="ml-[10px]">현위치</span>
					</div>
					<div
						class="flex h-[48px] w-full items-center rounded-[10px] border border-gray-100 bg-gray-50"
					>
						<img src="/icons/DotPrimary.svg" class="ml-4 h-4 w-4" alt="dot" />
						<input
							class="ml-[10px] w-full border-0 bg-inherit p-0 caret-primary-500 outline-none placeholder:text-gray-300 focus:ring-0"
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
							destinationText = displayName;
							onDestinationConfirmed({
								lat: destinationPlace.location.lat(),
								lng: destinationPlace.location.lng()
							});
							isNavigationStarting = true;
						}}
						transition:fade
					>
						<img src="/icons/MapPin.svg" class="h-6 w-6" alt="icon" />
						<div class="flex flex-col items-start gap-1">
							<h2 class="text-[16px] text-primary-500">{displayName}</h2>
							<h3 class="overflow-clip text-[14px] font-regular text-gray-500">
								{formattedAddress}
							</h3>
						</div>
					</button>
				{/if}
			</div>
		{:else}
			<div
				class="mt-[80px] flex w-full flex-col items-center gap-3"
				in:fade={{ delay: 170 }}
				out:fade={{ duration: 150 }}
			>
				<p class="text-[16px] font-semibold text-gray-500">듣고있어요</p>
				<p class="text-[21px] font-bold text-gray-900">지쿠 타고 어디로 갈까요?</p>
			</div>
		{/if}
	{:else}
		<h1 class="text-center text-[21px] font-bold text-gray-900">경로를 확인해주세요</h1>
		<div class="mt-6 rounded-[12px] bg-gray-50 px-4 py-3">
			<div class="flex flex-row items-center gap-2">
				<img src="/icons/DotGray.svg" class="ml-4 h-4 w-4" alt="dot" />
				<p class="text-gray-500">출발지</p>
				<p class="text-gray-900">현위치</p>
			</div>
			<div class="flex flex-row items-start gap-2">
				<img src="/icons/DotPrimary.svg" class="ml-4 mt-[3px] h-4 w-4" alt="dot" />
				<p class="text-gray-500">도착지</p>
				<div class="flex flex-col gap-[2px]">
					<p class="text-gray-900">{displayName}</p>
					<div class="flex flex-row gap-1">
						<p class="font-bold text-gray-900">근처 자전거 거치대</p>
						<div
							class="rounded-[99px] px-2 py-[2px] text-primary-500"
							style="background-color: rgba(38, 200, 110, 0.05)"
						>
							-200원
						</div>
						<button><img src="/icons/cancel.svg" class="h-4 w-4" alt="icon" /></button>
					</div>
				</div>
			</div>
			<div class="ml-4 mt-4 flex flex-row items-center gap-1">
				<img src="/icons/add_circle.svg" class="h-4 w-4" alt="icon" />
				<p class="text-gray-500">경유지 추가</p>
			</div>
		</div>
		<div class="mt-6 flex flex-col items-end gap-1">
			<button
				class="py-[6px] pl-[16px] pr-[6px] text-primary-500"
				style="background-color: rgba(38, 200, 110, 0.05)"
			>
				안전한 길로 안내 {'>'}
			</button>
			<div class="flex flex-row items-center gap-[6px]">
				{#each [0, 1] as _}
					<p class="text-[14px] text-gray-500">예상 {_ ? '금액' : '시간'}</p>
					<p class="text-[24px] text-gray-900">{_ ? '1000원' : '5분'}</p>
				{/each}
			</div>
		</div>
	{/if}
</div>

{#if !isMicrophoneActive}
	<div class="absolute bottom-0 left-0 flex w-full flex-row gap-3 bg-white p-4" transition:slide>
		<button
			class="h-[50px] w-full rounded-[10px] bg-gray-100 font-bold text-gray-700"
			onclick={() => (isActive = !isActive)}>닫기</button
		>
		<button
			class="line-clamp-2 h-[50px] w-full overflow-clip rounded-[10px] bg-primary-500 font-bold text-white"
			onclick={() => onNavigationStart()}>안내시작</button
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
	.endGame {
		bottom: -350px;
	}
</style>
