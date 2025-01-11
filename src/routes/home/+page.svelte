<script lang="ts">
	import GoogleMap from '$lib/components/GoogleMap/GoogleMap.svelte';
	import SlideUpAddressBox from '$lib/components/SlideUpAddressBox/SlideUpAddressBox.svelte';
	import Splash from '$lib/components/Splash/Splash.svelte';

	let destinationCoordinates = $state({ lat: 0, lng: 0 });
</script>

<GoogleMap {destinationCoordinates} />
<SlideUpAddressBox
	onDestinationConfirmed={({ lat, lng }: { lat: number; lng: number }) => {
		destinationCoordinates = { lat, lng };
		console.log({ lat, lng });
	}}
/>
<Splash />
