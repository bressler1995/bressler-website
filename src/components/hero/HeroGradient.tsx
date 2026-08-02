/**
 * Ambient colour wash sitting behind the globe. Pure CSS, no JS, and driven
 * entirely by the --hero-glow-* tokens so it follows the theme.
 *
 * Placement: the magenta accent is centred on the globe (~70% / 42%) so it
 * reads as the sphere being lit, rather than as a coloured blob in a corner.
 * Plum — the darkest and least saturated of the three — takes the lower left,
 * behind the headline and buttons, where a strong tint would only fight the
 * text. Mist closes the bottom-right corner.
 *
 * Radii are deliberately large with late `transparent` stops: a wide, slow
 * falloff reads as light, whereas a tight one reads as a shape.
 */
export function HeroGradient() {
	return (
		<div
			aria-hidden="true"
			className="pointer-events-none absolute inset-0"
			style={{
				background: [
					// Accent, on the globe.
					'radial-gradient(70% 75% at 68% 44%, var(--hero-glow-2), transparent 75%)',
					// Deep base wash under the copy.
					'radial-gradient(75% 75% at 20% 76%, var(--hero-glow-1), transparent 78%)',
					// Cool corner.
					'radial-gradient(62% 58% at 92% 86%, var(--hero-glow-3), transparent 80%)',
				].join(', '),
			}}
		/>
	);
}

export default HeroGradient;
