<script>
	import { onMount } from 'svelte';

	let start = $state('Empire State Building');
	let end = $state('Madison Square Park');

	let map;

	let directionsService = $state(null);
	let directionsRenderer = $state(null);
	let Place = $state(null);

	async function initMap() {
		// @ts-ignore
		const { Map } = await google.maps.importLibrary('maps');
		// @ts-ignore
		const { DirectionsService, DirectionsRenderer } = await google.maps.importLibrary('routes');
		// @ts-ignore
		const { Place: p } = await google.maps.importLibrary('places');
		Place = p;
		directionsService = new DirectionsService();
		directionsRenderer = new DirectionsRenderer();
		//@ts-ignore

		map = new Map(document.getElementById('map'), {
			center: { lat: 40.7484333, lng: -73.9856556 },
			zoom: 16,
			disableDefaultUI: true
		});

		// @ts-ignore
		directionsRenderer.setMap(map);
	}

	//@ts-ignore
	async function calculateAndDisplayRoute() {
		if (!directionsService || !directionsRenderer) {
			return;
		}
		//@ts-ignore
		const startLocation = (await Place.searchByText({ textQuery: start, fields: ['*'] })).places[0]
			.location;
		//@ts-ignore
		const endLocation = (await Place.searchByText({ textQuery: end, fields: ['*'] })).places[0]
			.location;

		directionsService
			//@ts-ignore
			.route(
				{
					//@ts-ignore
					origin: { lat: startLocation.lat(), lng: startLocation.lng() },
					//@ts-ignore
					destination: { lat: endLocation.lat(), lng: endLocation.lng() },
					travelMode: 'BICYCLING'
				},
				//@ts-ignore
				function (result, status) {
					if (status === 'OK') {
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
