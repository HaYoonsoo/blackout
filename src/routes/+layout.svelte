<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<div class="relative flex h-screen flex-col items-center justify-center bg-gray-300">
	<div
		class="relative h-full w-full rounded-none bg-white shadow-none sm:h-[844px] sm:w-[390px] sm:rounded-lg sm:shadow-lg sm:shadow-gray-400"
	>
		<div class="relative w-full overflow-y-hidden" style="height: calc(100% - 1px);">
			{@render children()}
		</div>
	</div>
</div>
