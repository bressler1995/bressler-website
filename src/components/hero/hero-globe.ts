/**
 * Rotating wireframe globe for the hero background.
 *
 * Hand-rolled canvas 2D rather than a 3D library: this is ~1300 projected
 * points and some line segments, which doesn't justify shipping three.js
 * (~150KB gzipped) to render it. Doing it directly also means the lines can
 * read the site's own colour tokens and follow the theme.
 *
 * Decorative only — the canvas is aria-hidden and the animation stops for
 * reduced-motion users, hidden tabs, and when scrolled out of view.
 */

/** Seconds for one full rotation. Slow enough to read as ambient, not busy. */
const ROTATION_PERIOD = 70;

/** Tilt of the pole toward the viewer, in degrees. */
const TILT = 16;

/** Latitude rings drawn between the poles (exclusive). */
const LAT_STEP = 15;

/** Meridians around the sphere. Denser than a plain sphere would need, so the
    spiked silhouette is described by more than a handful of lines. */
const LON_STEP = 15;

/** Points sampled per ring / per meridian. More = smoother curves.
    Sharpened peaks are narrow, so a coarse step walks straight over them and
    the spikes come out as angular kinks rather than points — these are double
    what a plain sphere needs. */
const RING_SEGMENTS = 160;
const MERIDIAN_SEGMENTS = 80;

/**
 * Below this the globe centres itself instead of sitting off to the right.
 * Matches the `md` breakpoint (48rem) — canvas layout can't read the CSS scale,
 * so keep the two in sync by hand.
 */
const WIDE_BREAKPOINT = 768;

/** Camera distance in sphere radii. Larger = flatter, more orthographic. */
const CAMERA_DISTANCE = 2.6;

/* --- Form -----------------------------------------------------------------
   A superquadric, not a sphere. The exponent controls the whole silhouette:

     2.0   sphere        outline is a circle at every angle
     1.0   octahedron    a diamond — six points, flat faces
     <1    spiked        faces go concave, so the points sharpen

   Below 1 pulls the faces inward, sharpening the six axis points. Measured on
   the outline, a sphere's min/max radius ratio is 1.000; at 0.85 it's 0.63, and
   unlike a sphere it changes as the form turns.

   Set this to 1.0 for a plain octahedron with flat faces, or below 0.7 to make
   the points genuinely spiky. */

/** Superquadric exponent. Lower = sharper points, more concave faces. */
const DIAMOND_EXPONENT = 0.9;

/** Equal axes — the form is symmetrical; the geometry supplies the character. */
const AXIS_X = 1.0;
const AXIS_Y = 1.0;
const AXIS_Z = 1.0;

/** Depth is quantised into this many alpha levels so each is one stroke call. */
const DEPTH_BUCKETS = 8;

/** Opacity of the frontmost and backmost lines. */
const ALPHA_FRONT = 0.55;
const ALPHA_BACK = 0.06;

/** Only used if --hero-globe-line can't be read for some reason. */
const FALLBACK_COLOR = '#ffffff';

const DEG = Math.PI / 180;

type Line = Float32Array; // flat [x,y,z, x,y,z, ...] on the unit sphere

let teardown: (() => void) | null = null;

const noop = () => {};

/**
 * Radius at a given latitude/longitude, in radians. A pure superquadric — the
 * form comes entirely from the exponent, with no additional displacement, so
 * the facets stay clean and the edges read as straight lines.
 */
function radiusAt(lat: number, lon: number) {
	const cosLat = Math.cos(lat);
	const x = Math.abs(cosLat * Math.cos(lon));
	const y = Math.abs(Math.sin(lat));
	const z = Math.abs(cosLat * Math.sin(lon));

	const n = DIAMOND_EXPONENT;
	return Math.pow(Math.pow(x, n) + Math.pow(y, n) + Math.pow(z, n), -1 / n);
}

/** A surface point, displaced and scaled onto the unequal axes. */
function pointAt(lat: number, lon: number, out: Float32Array, i: number) {
	const r = radiusAt(lat, lon);
	const cosLat = Math.cos(lat);
	out[i] = r * cosLat * Math.cos(lon) * AXIS_X;
	out[i + 1] = r * Math.sin(lat) * AXIS_Y;
	out[i + 2] = r * cosLat * Math.sin(lon) * AXIS_Z;
}

/** Geometry, built once — only the rotation changes per frame. */
function buildGeometry(): Line[] {
	const lines: Line[] = [];

	// Latitude rings.
	for (let lat = -90 + LAT_STEP; lat < 90; lat += LAT_STEP) {
		const points = new Float32Array((RING_SEGMENTS + 1) * 3);
		for (let i = 0; i <= RING_SEGMENTS; i++) {
			pointAt(lat * DEG, (i / RING_SEGMENTS) * 360 * DEG, points, i * 3);
		}
		lines.push(points);
	}

	// Meridians, pole to pole.
	for (let lon = 0; lon < 360; lon += LON_STEP) {
		const points = new Float32Array((MERIDIAN_SEGMENTS + 1) * 3);
		for (let i = 0; i <= MERIDIAN_SEGMENTS; i++) {
			pointAt((-90 + (i / MERIDIAN_SEGMENTS) * 180) * DEG, lon * DEG, points, i * 3);
		}
		lines.push(points);
	}

	return lines;
}

/**
 * Starts the globe and returns a disposer. The React component owns the
 * lifecycle via useEffect, so this hands the teardown back rather than only
 * stashing it module-side.
 */
export function initHeroGlobe(): () => void {
	teardown?.();
	teardown = null;

	const canvas = document.querySelector<HTMLCanvasElement>('[data-hero-globe]');
	if (!canvas) return noop;

	const ctx = canvas.getContext('2d');
	if (!ctx) return noop;

	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	const geometry = buildGeometry();

	let width = 0;
	let height = 0;
	let frame = 0;
	let running = false;
	let visible = true;
	let angle = 0;
	let lastTime = 0;
	let color = FALLBACK_COLOR;

	const readColor = () => {
		const value = getComputedStyle(document.documentElement)
			.getPropertyValue('--hero-globe-line')
			.trim();
		color = value || FALLBACK_COLOR;
	};

	const resize = () => {
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const rect = canvas.getBoundingClientRect();
		width = rect.width;
		height = rect.height;
		canvas.width = Math.round(width * dpr);
		canvas.height = Math.round(height * dpr);
		// Draw in CSS pixels; the transform handles device pixel scaling.
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	};

	const render = () => {
		ctx.clearRect(0, 0, width, height);
		if (width === 0 || height === 0) return;

		// Sized to read as decoration rather than an object in the scene: the
		// form is larger than the section and bleeds off the top, bottom and
		// right, so what's visible is a fragment of something bigger. Scaled off
		// the larger dimension on wide screens so it keeps spanning as the
		// viewport widens, instead of being pinned to a short height.
		const wide = width >= WIDE_BREAKPOINT;
		const radius = wide
			? Math.max(width * 0.42, height * 0.78)
			: Math.min(width, height) * 0.8;
		const cx = width * (wide ? 0.62 : 0.5);
		const cy = height * 0.5;

		const cosA = Math.cos(angle);
		const sinA = Math.sin(angle);
		const cosT = Math.cos(TILT * DEG);
		const sinT = Math.sin(TILT * DEG);

		const buckets: Path2D[] = Array.from(
			{ length: DEPTH_BUCKETS },
			() => new Path2D()
		);

		for (const line of geometry) {
			const count = line.length / 3;
			let prevX = 0;
			let prevY = 0;
			let prevZ = 0;

			for (let i = 0; i < count; i++) {
				const x = line[i * 3];
				const y = line[i * 3 + 1];
				const z = line[i * 3 + 2];

				// Spin about the pole, then tilt the pole toward the camera.
				const rx = x * cosA + z * sinA;
				const rz = -x * sinA + z * cosA;
				const ty = y * cosT - rz * sinT;
				const tz = y * sinT + rz * cosT;

				// Perspective divide; tz is in [-1, 1] so the denominator is safe.
				const scale = CAMERA_DISTANCE / (CAMERA_DISTANCE - tz);
				const sx = cx + rx * radius * scale;
				const sy = cy + ty * radius * scale;

				if (i > 0) {
					// Depth of the segment midpoint, mapped to 0 (back) .. 1 (front).
					const depth = ((prevZ + tz) / 2 + 1) / 2;
					const bucket = Math.min(
						DEPTH_BUCKETS - 1,
						Math.max(0, Math.floor(depth * DEPTH_BUCKETS))
					);
					const path = buckets[bucket];
					path.moveTo(prevX, prevY);
					path.lineTo(sx, sy);
				}

				prevX = sx;
				prevY = sy;
				prevZ = tz;
			}
		}

		ctx.lineWidth = 1;
		ctx.strokeStyle = color;
		for (let i = 0; i < DEPTH_BUCKETS; i++) {
			const t = i / (DEPTH_BUCKETS - 1);
			ctx.globalAlpha = ALPHA_BACK + (ALPHA_FRONT - ALPHA_BACK) * t;
			ctx.stroke(buckets[i]);
		}
		ctx.globalAlpha = 1;
	};

	const tick = (now: number) => {
		const elapsed = lastTime ? now - lastTime : 0;
		lastTime = now;
		angle += (elapsed / 1000 / ROTATION_PERIOD) * Math.PI * 2;
		render();
		frame = requestAnimationFrame(tick);
	};

	const start = () => {
		if (running || reducedMotion.matches) return;
		running = true;
		lastTime = 0;
		frame = requestAnimationFrame(tick);
	};

	const stop = () => {
		if (!running) return;
		running = false;
		cancelAnimationFrame(frame);
	};

	const syncPlayback = () => {
		if (visible && !document.hidden) start();
		else stop();
	};

	const onResize = () => {
		resize();
		render();
	};

	const onVisibilityChange = () => syncPlayback();

	// Don't burn frames animating a globe that's scrolled off screen.
	const observer = new IntersectionObserver(
		([entry]) => {
			visible = entry?.isIntersecting ?? true;
			syncPlayback();
		},
		{ threshold: 0 }
	);
	observer.observe(canvas);

	// Follow the theme toggle, which swaps the token values on <html>.
	const themeObserver = new MutationObserver(() => {
		readColor();
		if (!running) render();
	});
	themeObserver.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ['class'],
	});

	const onReducedMotionChange = () => {
		if (reducedMotion.matches) {
			stop();
			render();
		} else {
			syncPlayback();
		}
	};
	reducedMotion.addEventListener('change', onReducedMotionChange);

	window.addEventListener('resize', onResize);
	document.addEventListener('visibilitychange', onVisibilityChange);

	readColor();
	resize();
	render();
	syncPlayback();

	teardown = () => {
		stop();
		observer.disconnect();
		themeObserver.disconnect();
		reducedMotion.removeEventListener('change', onReducedMotionChange);
		window.removeEventListener('resize', onResize);
		document.removeEventListener('visibilitychange', onVisibilityChange);
	};

	return () => {
		teardown?.();
		teardown = null;
	};
}
