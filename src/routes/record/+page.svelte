<script lang="ts">
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
		await fetch('/api/upload', {
			method: 'POST',
			body: formData
		});
	}
</script>

<button on:click={isRecording ? stopRecording : startRecording}>
	{isRecording ? 'Stop Recording' : 'Start Recording'}
</button>
