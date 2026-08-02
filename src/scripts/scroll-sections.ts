/**
 * Eased section-to-section scrolling.
 *
 * CSS scroll-snap has no duration or easing control — the browser snaps on its
 * own instant timing after a wheel gesture, which reads as abrupt. So when JS is
 * available we disable CSS snapping (via the `js-scroll` class) and drive the
 * scroll ourselves with requestAnimationFrame.
 *
 * CSS snapping stays in the stylesheet as the no-JS fallback, and this module
 * bails out entirely under reduced-motion or short viewports so the CSS
 * fallback's own media query is the single source of truth for those cases.
 */

/** Milliseconds for a full section-to-section transition. */
const DURATION = 1000;

/** Wheel deltas below this are ignored (trackpad jitter, horizontal drift). */
const WHEEL_THRESHOLD = 4;

/** Minimum vertical swipe in px before a touch counts as a section change. */
const SWIPE_THRESHOLD = 45;

/**
 * A quiet gap this long (ms) marks the end of a wheel gesture. Trackpads emit a
 * long momentum tail after the fingers lift; without this, that tail would be
 * read as additional scrolls and skip several sections per flick.
 */
const GESTURE_GAP = 140;

/** Tolerance in px when comparing scroll offsets — avoids sub-pixel jitter. */
const EPSILON = 2;

const easeInOutCubic = (t: number) =>
	t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

let teardown: (() => void) | null = null;

export function initScrollSections() {
	// The router keeps this module alive across navigations, so always detach
	// the previous page's listeners before binding new ones.
	teardown?.();
	teardown = null;

	// Per-page opt-out from BaseLayout's `snap` prop. Checked before anything
	// else so an opted-out page binds no listeners at all.
	if (document.documentElement.dataset.snap === 'false') return;

	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	// Read the threshold from CSS so this can't drift from the `short` variant.
	const shortValue =
		getComputedStyle(document.documentElement)
			.getPropertyValue('--viewport-short')
			.trim() || '600px';
	const shortViewport = window.matchMedia(`(max-height: ${shortValue})`);
	const sections = Array.from(
		document.querySelectorAll<HTMLElement>('[data-section]')
	);

	if (reducedMotion.matches || shortViewport.matches || sections.length < 2) {
		return;
	}

	const root = document.documentElement;
	root.classList.add('js-scroll');

	let animating = false;
	let frame = 0;

	/** Index of the section currently occupying the top of the viewport. */
	const currentIndex = () => {
		const y = window.scrollY + EPSILON;
		let index = 0;
		sections.forEach((section, i) => {
			if (section.offsetTop <= y) index = i;
		});
		return index;
	};

	let index = currentIndex();

	const scrollTargetFor = (i: number) => {
		const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
		return Math.min(sections[i].offsetTop, Math.max(0, maxScroll));
	};

	const animateTo = (i: number) => {
		const clamped = Math.max(0, Math.min(sections.length - 1, i));
		const from = window.scrollY;
		const to = scrollTargetFor(clamped);
		index = clamped;

		if (Math.abs(to - from) < 1) return;

		cancelAnimationFrame(frame);
		animating = true;
		const start = performance.now();

		const step = (now: number) => {
			const t = Math.min(1, (now - start) / DURATION);
			window.scrollTo(0, from + (to - from) * easeInOutCubic(t));
			if (t < 1) {
				frame = requestAnimationFrame(step);
			} else {
				animating = false;
			}
		};

		frame = requestAnimationFrame(step);
	};

	/**
	 * Sections taller than the viewport must stay freely scrollable, otherwise
	 * their overflow is unreachable. Returns true when the native scroll should
	 * be left alone instead of hijacked.
	 */
	const shouldDeferToNative = (direction: number) => {
		const section = sections[index];
		if (!section) return false;
		if (section.offsetHeight <= window.innerHeight + EPSILON) return false;

		const rect = section.getBoundingClientRect();
		if (direction > 0) return rect.bottom > window.innerHeight + EPSILON;
		return rect.top < -EPSILON;
	};

	const step = (direction: number, event: Event) => {
		if (animating) {
			event.preventDefault();
			return;
		}
		if (shouldDeferToNative(direction)) return;

		const next = index + direction;
		if (next < 0 || next >= sections.length) return;

		event.preventDefault();
		animateTo(next);
	};

	let lastWheelTime = 0;
	let gestureConsumed = false;

	const onWheel = (e: WheelEvent) => {
		if (Math.abs(e.deltaY) < WHEEL_THRESHOLD) return;
		if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

		const now = performance.now();
		if (now - lastWheelTime > GESTURE_GAP) gestureConsumed = false;
		lastWheelTime = now;

		const direction = e.deltaY > 0 ? 1 : -1;
		if (shouldDeferToNative(direction)) return;

		// One section per gesture: swallow the rest of the flick's momentum.
		if (animating || gestureConsumed) {
			e.preventDefault();
			return;
		}

		const next = index + direction;
		if (next < 0 || next >= sections.length) return;

		e.preventDefault();
		gestureConsumed = true;
		animateTo(next);
	};

	let touchStartY = 0;
	const onTouchStart = (e: TouchEvent) => {
		touchStartY = e.touches[0]?.clientY ?? 0;
		gestureConsumed = false;
	};

	const onTouchMove = (e: TouchEvent) => {
		const delta = touchStartY - (e.touches[0]?.clientY ?? 0);
		if (Math.abs(delta) < SWIPE_THRESHOLD) return;

		const direction = delta > 0 ? 1 : -1;
		if (shouldDeferToNative(direction)) return;

		// touchmove streams continuously; without this one drag would advance
		// through several sections.
		if (animating || gestureConsumed) {
			e.preventDefault();
			return;
		}

		const next = index + direction;
		if (next < 0 || next >= sections.length) return;

		e.preventDefault();
		gestureConsumed = true;
		animateTo(next);
	};

	const onKeyDown = (e: KeyboardEvent) => {
		const target = e.target as HTMLElement | null;
		// Never swallow keys aimed at a form control or anything editable.
		if (
			target &&
			(target.isContentEditable ||
				['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
		) {
			return;
		}
		if (e.metaKey || e.ctrlKey || e.altKey) return;

		switch (e.key) {
			case 'ArrowDown':
			case 'PageDown':
				step(1, e);
				break;
			case 'ArrowUp':
			case 'PageUp':
				step(-1, e);
				break;
			case 'Home':
				e.preventDefault();
				animateTo(0);
				break;
			case 'End':
				e.preventDefault();
				animateTo(sections.length - 1);
				break;
		}
	};

	/** Same-page anchors (e.g. the hero's "Skills" button) get the same easing. */
	const onClick = (e: MouseEvent) => {
		const anchor = (e.target as HTMLElement | null)?.closest?.('a[href^="#"]');
		if (!(anchor instanceof HTMLAnchorElement)) return;

		const id = anchor.getAttribute('href')?.slice(1);
		if (!id) return;

		const targetIndex = sections.findIndex((section) => section.id === id);
		if (targetIndex === -1) return;

		e.preventDefault();
		history.replaceState(null, '', `#${id}`);
		animateTo(targetIndex);
	};

	/** Keep the index honest when the user scrolls natively or resizes. */
	const onScroll = () => {
		if (!animating) index = currentIndex();
	};

	const onResize = () => {
		if (!animating) index = currentIndex();
	};

	window.addEventListener('wheel', onWheel, { passive: false });
	window.addEventListener('touchstart', onTouchStart, { passive: true });
	window.addEventListener('touchmove', onTouchMove, { passive: false });
	window.addEventListener('keydown', onKeyDown);
	document.addEventListener('click', onClick);
	window.addEventListener('scroll', onScroll, { passive: true });
	window.addEventListener('resize', onResize);

	teardown = () => {
		cancelAnimationFrame(frame);
		animating = false;
		root.classList.remove('js-scroll');
		window.removeEventListener('wheel', onWheel);
		window.removeEventListener('touchstart', onTouchStart);
		window.removeEventListener('touchmove', onTouchMove);
		window.removeEventListener('keydown', onKeyDown);
		document.removeEventListener('click', onClick);
		window.removeEventListener('scroll', onScroll);
		window.removeEventListener('resize', onResize);
	};
}
