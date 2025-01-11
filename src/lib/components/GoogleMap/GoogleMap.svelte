<script>
	import { onMount } from 'svelte';

	let start = $state('Chicago, IL');
	let end = $state('Los Angeles, CA');

	let map;

	let directionsService = $state(null);
	let directionsRenderer = $state(null);

	async function initMap() {
		// @ts-ignore
		const { Map } = await google.maps.importLibrary('maps');
		// @ts-ignore
		const { DirectionsService, DirectionsRenderer } = await google.maps.importLibrary('routes');
		directionsService = new DirectionsService();
		directionsRenderer = new DirectionsRenderer();
		console.log(directionsRenderer);

		map = new Map(document.getElementById('map'), {
			center: { lat: 37.58639, lng: 127.02917 },
			zoom: 16,
			disableDefaultUI: true
		});

		// @ts-ignore
		directionsRenderer.setMap(map);
	}

	//@ts-ignore
	function calculateAndDisplayRoute() {
		if (!directionsService || !directionsRenderer) {
			return;
		}

		directionsService
			//@ts-ignore
			.route(
				{
					origin: start,
					destination: end,
					travelMode: 'BICYCLING'
				},
				//@ts-ignore
				function (result, status) {
					if (status === 'OK') {
						console.log('done');
						//@ts-ignore
						directionsRenderer.setDirections(result);
					} else {
						window.alert('Directions request failed due to ' + status);
					}
				}
			);
	}

	onMount(async () => {
		await initMap();
	});
</script>

<div id="map" class="aspect-square w-full"></div>

<div>
	<form
		id="form"
		class="flex flex-col gap-2"
		method="POST"
		onsubmit={(e) => {
			e.preventDefault();
			calculateAndDisplayRoute();
		}}
	>
		<input class="border" type="text" bind:value={start} placeholder="출발지" />
		<input class="border" type="text" bind:value={end} placeholder="도착지" />
		<button class="bg-blue-400 font-bold text-white" type="submit">길찾기</button>
	</form>
</div>
