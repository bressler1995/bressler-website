/**
 * Ambient wash behind the globe. Pure CSS, driven entirely by the --hero-glow-*
 * tokens so it follows the theme.
 *
 * A horizontal linear gradient rather than radial blobs: it sweeps the section
 * left-to-right through the indigo surfaces, which reads as one continuous
 * field instead of three light sources, and keeps the left edge — where the
 * headline and buttons sit — as the calmest part of the composition.
 *
 * A single soft radial of Slate Indigo still sits over the globe so the sphere
 * reads as lit rather than pasted on.
 */
export function HeroGradient() {
	return (
		<div
			aria-hidden="true"
			className="pointer-events-none absolute inset-0"
			style={{
				background: [
					// The slate lift on the globe, kept soft and local.
					'radial-gradient(60% 70% at 72% 46%, var(--hero-glow-2), transparent 72%)',
					// The sweep: transparent at the left where the copy sits, deepening
					// through the alternate surface and settling into slate at the right.
					'linear-gradient(100deg, transparent 0%, var(--hero-glow-1) 38%, var(--hero-glow-3) 100%)',
				].join(', '),
			}}
		/>
	);
}

export default HeroGradient;
