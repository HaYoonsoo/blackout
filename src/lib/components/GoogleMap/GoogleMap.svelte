<script lang="ts">
	import { onMount } from 'svelte';

	let { destinationCoordinates }: { destinationCoordinates: { lat: number; lng: number } } =
		$props();

	let start = $state('Empire State Building');

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
		// const endLocation = (await Place.searchByText({ textQuery: end, fields: ['*'] })).places[0]
		// 	.location;

		directionsService
			//@ts-ignore
			.route(
				{
					//@ts-ignore
					origin: { lat: startLocation.lat(), lng: startLocation.lng() },
					//@ts-ignore
					destination: { lat: destinationCoordinates.lat, lng: destinationCoordinates.lng },
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

	$effect(() => {
		if (destinationCoordinates.lat) {
			calculateAndDisplayRoute();
		}
	});

	onMount(async () => {
		await initMap();
	});
</script>

<div id="map" class="h-[700px] w-full"></div>
