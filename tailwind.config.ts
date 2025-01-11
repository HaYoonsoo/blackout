import containerQueries from '@tailwindcss/container-queries';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {
			fontFamily: {
				sans: ['Pretendard', ...defaultTheme.fontFamily.sans]
			},
			lineHeight: { normal: '1.4' },
			fontWeight: {
				regular: '400',
				medium: '500',
				bold: '700'
			},
			colors: {
				'primary-500': '#26C86E',
				'primary-600': '#0CB950',
				'gray-25': '#FDFDFD',
				'gray-50': '#FAFAFA',
				'gray-100': '#F5F5F5',
				'gray-200': '##E5E6E7',
				'gray-300': '#CBCCCF',
				'gray-400': '#A4A7AE',
				'gray-500': '#8F939C',
				'gray-600': '#717680',
				'gray-700': '#535862',
				'gray-800': '#414651',
				'gray-900': '#25282F',
				'gray-950': '#0A0D12'
			}
		}
	},

	plugins: [typography, forms, containerQueries]
} satisfies Config;
