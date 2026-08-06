/**
 * Ambient wash behind the globe. Pure CSS, driven entirely by the --hero-wash-*
 * tokens so it follows the theme.
 *
 * A diagonal depth field rather than a left-to-right sweep: the section falls
 * away into its darkest point at the lower left and lifts toward the upper
 * right, so the globe reads as emerging from the dark rather than sitting on a
 * flat panel. The diagonal also matches the axis the form leans along when the
 * pointer moves it, so the lighting and the interaction agree.
 *
 * The copy still sits in the calmest part of the composition — the deep corner
 * is a single flat-ish tone, so it anchors the headline without any gradient
 * banding running through the text.
 */
export function HeroGradient() {
	return (
		<div
			aria-hidden="true"
			className="pointer-events-none absolute inset-0"
			style={{
				background: [
					// Halo on the globe. Centred on the canvas's own centre — 62% / 50%,
					// the same figures hero-globe.ts uses for cx/cy above the wide
					// breakpoint — so the lift tracks the form instead of floating near
					// it.
					'radial-gradient(52% 62% at 62% 50%, var(--hero-wash-bloom), transparent 72%)',
					// Lit corner, upper right.
					'linear-gradient(205deg, var(--hero-wash-lift) 0%, transparent 58%)',
					// Deep corner, lower left.
					'linear-gradient(25deg, var(--hero-wash-deep) 0%, transparent 62%)',
				].join(', '),
			}}
		/>
	);
}

export default HeroGradient;
