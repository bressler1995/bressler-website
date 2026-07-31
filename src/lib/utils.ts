import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * tailwind-merge only knows Tailwind's built-in scales. Our semantic type scale
 * (`text-h2`, `text-body-sm`, …) is defined in global.css via @theme, so merge
 * classifies those as *text colours* and drops them when a real colour like
 * `text-muted-foreground` appears later in the same cn() call — silently
 * resetting the element to the inherited font size.
 *
 * Registering the scale under `font-size` keeps size and colour in separate
 * conflict groups, so both survive.
 */
const twMerge = extendTailwindMerge({
	extend: {
		classGroups: {
			"font-size": [
				{
					text: [
						"display",
						"h1",
						"h2",
						"h3",
						"h4",
						"body-lg",
						"body",
						"body-sm",
						"caption",
					],
				},
			],
		},
	},
})

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}
