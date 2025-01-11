import { redirect } from '@sveltejs/kit';
import { routes } from '$lib/routes';

export async function load() {
	redirect(303, routes.home);
}
