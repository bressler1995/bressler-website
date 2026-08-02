import * as React from 'react';
import { navigate } from 'astro:transitions/client';
import {
	FolderGit2,
	Home,
	Mail,
	Menu,
	Moon,
	NotebookPen,
	Search,
	Sun,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command';
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

/**
 * Slide timing. The label's colour change is derived from the pill's geometry
 * rather than being a fixed delay: it begins the moment the pill first touches
 * the destination label and finishes as the pill fully covers it.
 *
 * A fixed delay can't work here — across the four nav items first contact
 * happens anywhere from 91ms to 340ms into the move depending on how far the
 * pill travels, so one number is off by up to ~150ms at the extremes. And the
 * label can't recolour on contact alone: --primary-foreground is only legible
 * on the pill (1.08:1 on the bare page), so the fade has to track coverage.
 */
const SLIDE_MS = 800;
/** Must match --ease-slide in global.css. */
const EASE = [0.33, 0, 0.2, 1] as const;
/** Floor so a short hop still reads as a fade rather than a snap. */
const MIN_FADE_MS = 140;

/** Solve a cubic-bezier for y at a given x (Newton, as the browser does). */
function easeAt(x: number) {
	const [p1x, p1y, p2x, p2y] = EASE;
	const cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx;
	const cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;
	const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
	const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
	const slope = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
	let t = x;
	for (let i = 0; i < 8; i++) {
		const err = sampleX(t) - x;
		const d = slope(t);
		if (Math.abs(err) < 1e-6 || d === 0) break;
		t -= err / d;
	}
	return sampleY(t);
}

type Box = { x: number; w: number };

/** When the pill touches, and then fully covers, the destination label. */
function labelTiming(from: Box, to: Box) {
	let touch = 1;
	let cover = 1;
	for (let i = 0; i <= 200; i++) {
		const p = i / 200;
		const e = easeAt(p);
		const x = from.x + (to.x - from.x) * e;
		const w = from.w + (to.w - from.w) * e;
		if (touch === 1 && x < to.x + to.w && x + w > to.x) touch = p;
		if (cover === 1 && x <= to.x + 1 && x + w >= to.x + to.w - 1) {
			cover = p;
			break;
		}
	}
	return {
		delay: Math.round(touch * SLIDE_MS),
		duration: Math.max(MIN_FADE_MS, Math.round((cover - touch) * SLIDE_MS)),
	};
}

const links = [
	{ href: '/', label: 'Home', icon: Home },
	{ href: '/projects', label: 'Projects', icon: FolderGit2 },
	{ href: '/blog', label: 'Blog', icon: NotebookPen },
	{ href: '/contact', label: 'Contact', icon: Mail },
];

export default function Nav() {
	// Empty until hydration so the server-rendered markup matches; the active
	// link only lights up once we know the real pathname.
	const [path, setPath] = React.useState('');
	const [searchOpen, setSearchOpen] = React.useState(false);
	const [mobileOpen, setMobileOpen] = React.useState(false);
	const [isDark, setIsDark] = React.useState(true);
	// The bar starts roomy and tightens once you leave the top of the page.
	const [compact, setCompact] = React.useState(false);

	// A single pill slides between the desktop links rather than each link
	// carrying its own background — that's what makes the nav read as one track
	// with a moving selection instead of four independent buttons.
	const listRef = React.useRef<HTMLUListElement>(null);
	const [pill, setPill] = React.useState({ x: 0, w: 0, shown: false });
	const prevPill = React.useRef<{ x: number; w: number } | null>(null);
	const [labelFade, setLabelFade] = React.useState({
		delay: 0,
		duration: MIN_FADE_MS,
	});
	// Which link is *coloured* as active. Deliberately separate from `path`: the
	// colour has to change in the same commit as its timing, and the timing
	// isn't known until the new target has been measured. Driving the colour
	// straight off `path` recolours it a render early, with the previous hop's
	// delay still applied — which recoloured the label before the pill reached
	// it. Both land in the layout effect, so this is still pre-paint.
	const [colouredHref, setColouredHref] = React.useState('');
	// The first measurement positions the pill without animating, so it doesn't
	// fly in from the left edge on load.
	const [slide, setSlide] = React.useState(false);

	React.useEffect(() => {
		const sync = () => {
			setPath(window.location.pathname);
			setMobileOpen(false);
		};
		sync();
		setIsDark(document.documentElement.classList.contains('dark'));
		// Fires after every client-side navigation, including back/forward.
		document.addEventListener('astro:page-load', sync);
		return () => document.removeEventListener('astro:page-load', sync);
	}, []);

	React.useEffect(() => {
		// One step down the size scale rather than arbitrary values, so the
		// compact bar is still built from the same button sizes as everything
		// else. 24px of travel is enough to feel deliberate without flickering
		// when a scroll animation overshoots slightly.
		const sync = () => setCompact(window.scrollY > 24);
		sync();
		window.addEventListener('scroll', sync, { passive: true });

		// Re-sync on `astro:after-swap`, not `astro:page-load`. The router resets
		// scroll during the swap, but page-load fires several frames later — long
		// enough that the previous page's compact bar is visibly wrong on the new
		// one before it corrects itself.
		// The size change animates here exactly as it does while scrolling — the
		// bar is persisted across navigations, so letting it ease between states
		// keeps it reading as one continuous shell rather than a new page's
		// header appearing at a different size.
		document.addEventListener('astro:after-swap', sync);
		return () => {
			window.removeEventListener('scroll', sync);
			document.removeEventListener('astro:after-swap', sync);
		};
	}, []);

	// offsetLeft is relative to the nearest positioned ancestor, which is the
	// <ul> — so the pill and the measurement share a coordinate space.
	const measure = React.useCallback(() => {
		const active = listRef.current?.querySelector<HTMLElement>(
			'[data-active="true"]'
		);
		if (!active) {
			setPill((p) => ({ ...p, shown: false }));
			setColouredHref('');
			return;
		}
		const next = { x: active.offsetLeft, w: active.offsetWidth };
		const prev = prevPill.current;
		// Only recompute when the pill actually moves; a resize or font reflow
		// shouldn't restage the colour change.
		if (prev && (prev.x !== next.x || prev.w !== next.w)) {
			setLabelFade(labelTiming(prev, next));
		}
		prevPill.current = next;
		setPill({ ...next, shown: true });
		setColouredHref(active.getAttribute('href') ?? '');
	}, []);

	React.useLayoutEffect(() => {
		measure();
		// Enable the transition only after the pill has been placed once.
		const id = requestAnimationFrame(() => setSlide(true));
		return () => cancelAnimationFrame(id);
		// `compact` matters: the bar's padding changes link geometry.
	}, [measure, path, compact]);

	React.useEffect(() => {
		window.addEventListener('resize', measure);
		// Web fonts land after first paint and change label widths.
		document.fonts?.ready.then(measure).catch(() => {});
		return () => window.removeEventListener('resize', measure);
	}, [measure]);

	React.useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setSearchOpen((open) => !open);
			}
		};
		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	}, []);

	const toggleTheme = () => {
		const next = !isDark;
		setIsDark(next);
		document.documentElement.classList.toggle('dark', next);
		localStorage.setItem('theme', next ? 'dark' : 'light');
	};

	const go = (href: string) => {
		setSearchOpen(false);
		setMobileOpen(false);
		navigate(href);
	};

	const isActive = (href: string) =>
		href === '/' ? path === '/' : path.startsWith(href);

	return (
		<>
			<header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
				<nav
					aria-label="Main"
					// rounded-xl matches Card — the nav is a surface, so it takes the
					// same radius step as other surfaces rather than a pill shape.
					className={cn(
						'bg-background/70 border-border/60 max-w-page flex w-full items-center gap-2 rounded-xl border shadow-lg backdrop-blur-md',
						'transition-[padding] duration-300 motion-reduce:transition-none',
						compact ? 'p-2' : 'p-3'
					)}
				>
					<a
						href="/"
						className={cn(
							'font-heading text-label hover:bg-accent focus-visible:ring-ring-accent focus-visible:ring-offset-background ml-1 rounded-lg px-3 tracking-tight outline-none focus-visible:ring-[3px] focus-visible:ring-offset-[3px]',
							'transition-all duration-300 motion-reduce:transition-none',
							compact ? 'py-1.5' : 'py-2.5'
						)}
					>
						BR
					</a>

					{/* Desktop links — a track with one sliding selection. `relative`
					    makes this the offsetParent the pill is measured against. */}
					<ul ref={listRef} className="relative hidden items-center gap-1 md:flex">
						<span
							aria-hidden="true"
							className={cn(
								'bg-primary pointer-events-none absolute inset-y-0 rounded-lg',
								slide &&
									'ease-slide transition-[transform,width,opacity] motion-reduce:transition-none',
								pill.shown ? 'opacity-100' : 'opacity-0'
							)}
							style={{
								transform: `translateX(${pill.x}px)`,
								width: `${pill.w}px`,
								// Before the first measurement the pill is 0-wide. Setting a
								// duration without a transition-property lets CSS fall back to
								// `all`, which animates that 0 -> full width on load. Disable
								// transitions outright until the first size is committed.
								...(slide
									? { transitionDuration: `${SLIDE_MS}ms` }
									: { transitionProperty: 'none' }),
							}}
						/>
						{links.map(({ href, label }) => (
							<li key={href}>
								<a
									href={href}
									data-active={isActive(href) ? 'true' : undefined}
									aria-current={isActive(href) ? 'page' : undefined}
									// Values are [colour, padding]. The incoming label waits
									// for the pill to reach it and fades as it's covered;
									// leaving is immediate, since that direction fades toward
									// a colour that's legible anywhere.
									style={
										// Before the first measurement the active link has no
										// colour yet, so transitioning here would fade it in on
										// arrival. Same guard the pill uses for its position.
										!slide
											? { transitionDuration: '0ms' }
											: colouredHref === href
												? {
														transitionDelay: `${labelFade.delay}ms, 0ms`,
														transitionDuration: `${labelFade.duration}ms, 300ms`,
													}
												: {
														transitionDelay: '0ms, 0ms',
														transitionDuration: '160ms, 300ms',
													}
									}
									className={cn(
										// Nav links are controls, not prose — they take the
										// prominent face like the buttons beside them.
										'font-heading text-body-sm focus-visible:ring-ring-accent focus-visible:ring-offset-background relative z-10 block rounded-lg px-3 outline-none focus-visible:ring-[3px] focus-visible:ring-offset-[3px]',
										// Colour moves quickly (180ms) while the pill glides (520ms), so the
										// label feels responsive rather than dragged along. Padding
										// keeps the bar's own 300ms so it stays in step when the nav
										// compacts.
										'[transition-property:color,padding] [transition-timing-function:ease-out,var(--ease-slide)] motion-reduce:transition-none',
										compact ? 'py-1.5' : 'py-2.5',
										// The pill supplies the active background, so the link
										// only owns its text colour. Inactive links get no
										// background of their own — a hover fill would cover
										// the pill as it slides past.
										colouredHref === href
											? 'text-primary-foreground'
											: 'text-muted-foreground hover:text-foreground'
									)}
								>
									{label}
								</a>
							</li>
						))}
					</ul>

					<div className="ml-auto flex items-center gap-1">
						<Button
							variant="ghost"
							size={compact ? 'icon-sm' : 'icon'}
							aria-label="Search"
							onClick={() => setSearchOpen(true)}
						>
							<Search />
						</Button>

						<Button
							variant="ghost"
							size={compact ? 'icon-sm' : 'icon'}
							aria-label="Toggle theme"
							onClick={toggleTheme}
						>
							{isDark ? <Sun /> : <Moon />}
						</Button>

						{/* Steps down with the bar, but stays one notch above the icon
						    buttons beside it — it's the call to action, not chrome. */}
						<Button
							size={compact ? 'sm' : 'default'}
							onClick={() => go('/contact')}
						>
							Hire me
						</Button>

						{/* Mobile menu */}
						<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
							<SheetTrigger asChild>
								<Button
									variant="ghost"
									size={compact ? 'icon-sm' : 'icon'}
									aria-label="Open menu"
									className="md:hidden"
								>
									<Menu />
								</Button>
							</SheetTrigger>
							<SheetContent side="right" className="w-64">
								<SheetHeader>
									<SheetTitle>Menu</SheetTitle>
								</SheetHeader>
								<ul className="flex flex-col gap-1 px-4">
									{links.map(({ href, label, icon: Icon }) => (
										<li key={href}>
											<a
												href={href}
												className={cn(
													'font-heading text-body-sm focus-visible:ring-ring-accent focus-visible:ring-offset-background rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-offset-[3px] flex items-center gap-3 px-3 py-2 transition-colors',
													isActive(href)
														? 'text-label bg-primary text-primary-foreground hover:bg-primary/80'
														: 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
												)}
											>
												<Icon className="size-4" />
												{label}
											</a>
										</li>
									))}
								</ul>
							</SheetContent>
						</Sheet>
					</div>
				</nav>
			</header>

			<CommandDialog
				open={searchOpen}
				onOpenChange={setSearchOpen}
				title="Search"
				description="Jump to a page"
			>
				<CommandInput placeholder="Search pages…" />
				<CommandList>
					<CommandEmpty>No results found.</CommandEmpty>
					<CommandGroup heading="Pages">
						{links.map(({ href, label, icon: Icon }) => (
							<CommandItem key={href} value={label} onSelect={() => go(href)}>
								<Icon className="size-4" />
								{label}
							</CommandItem>
						))}
						<CommandItem
							value="Design system"
							onSelect={() => go('/design-system')}
						>
							Design system
						</CommandItem>
					</CommandGroup>
				</CommandList>
			</CommandDialog>
		</>
	);
}
