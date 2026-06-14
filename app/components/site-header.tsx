"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { navigation, site } from "../content";
import {
	adminFetch,
	scheduleKendraAdminSessionRefresh,
} from "./kendra-admin-session-client";
import {
	clearKendraAdminSessionHint,
	readKendraAdminSessionHint,
	writeKendraAdminSessionHint,
	writeKendraAdminSessionRefreshHint,
} from "./kendra-admin-session-hint";
import { cn, shell } from "./ui";

function Mark() {
	return (
		<span
			className="grid h-[32px] w-[32px] place-items-center bg-ink text-white"
			aria-hidden="true"
		>
			<svg viewBox="0 0 42 42" role="img" className="h-[24px] w-[24px]">
				<path
					className="animate-[draw-wave_1.2s_220ms_ease_both] fill-none stroke-current stroke-[2] [stroke-dasharray:84] [stroke-dashoffset:84] [stroke-linecap:square]"
					d="M8 28C12 28 12 14 16 14C20 14 20 34 24 34C28 34 28 8 32 8C36 8 36 22 40 22"
				/>
			</svg>
		</span>
	);
}

type AdminSessionState = {
	authenticated: boolean;
	email: string | null;
	expiresAt?: string | null;
	refreshEarlySeconds?: number | null;
};

export function SiteHeader() {
	const pathname = usePathname();
	const router = useRouter();
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);
	const [adminSession, setAdminSession] = useState<AdminSessionState | null>(null);
	const refreshedAdminPathRef = useRef<string | null>(null);
	const isAdminSignedIn = adminSession?.authenticated === true;

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 10);
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	// Prevent scrolling when menu is open
	useEffect(() => {
		if (isMenuOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "unset";
		}
		return () => {
			document.body.style.overflow = "unset";
		};
	}, [isMenuOpen]);

	useEffect(() => {
		if (!isAvatarMenuOpen || adminSession) return;

		let cancelled = false;

		async function loadAdminSession() {
			try {
				const response = await adminFetch("/api/admin/session");
				const payload = (await response.json().catch(() => null)) as AdminSessionState | null;

				if (!cancelled) {
					setAdminSession(payload ?? { authenticated: false, email: null });
					if (payload?.authenticated && payload.expiresAt) {
						writeKendraAdminSessionHint({
							email: payload.email,
							expiresAt: payload.expiresAt,
							refreshEarlySeconds: payload.refreshEarlySeconds ?? null,
						});
					} else if (payload && !payload.authenticated) {
						clearKendraAdminSessionHint();
					}
				}
			} catch {
				if (!cancelled) {
					setAdminSession({ authenticated: false, email: null });
					clearKendraAdminSessionHint();
				}
			}
		}

		void loadAdminSession();

		return () => {
			cancelled = true;
		};
	}, [adminSession, isAvatarMenuOpen]);

	useEffect(() => {
		const hint = readKendraAdminSessionHint();
		if (!hint) return;

		let cancelled = false;

		const updateVerifiedSession = (payload: AdminSessionState) => {
			if (!payload.authenticated || !payload.expiresAt) {
				clearKendraAdminSessionHint();
				setAdminSession({ authenticated: false, email: null });
				return;
			}

			writeKendraAdminSessionHint({
				email: payload.email,
				expiresAt: payload.expiresAt,
				refreshEarlySeconds: payload.refreshEarlySeconds ?? null,
			});
			setAdminSession(payload);

			if (
				pathname.startsWith("/admin") &&
				refreshedAdminPathRef.current !== pathname
			) {
				refreshedAdminPathRef.current = pathname;
				router.refresh();
			}
		};

		async function verifyHintSession() {
			try {
				const response = await adminFetch("/api/admin/session", {
					cache: "no-store",
				});
				const payload = (await response
					.json()
					.catch(() => null)) as AdminSessionState | null;

				if (!cancelled) {
					updateVerifiedSession(
						payload ?? { authenticated: false, email: null },
					);
				}
			} catch {
				if (!cancelled) {
					clearKendraAdminSessionHint();
					setAdminSession({ authenticated: false, email: null });
				}
			}
		}

		void verifyHintSession();

		const stopRefresh = scheduleKendraAdminSessionRefresh({
			expiresAt: hint.expiresAt,
			onRefresh: (payload) => {
				writeKendraAdminSessionRefreshHint({
					fallbackEmail: hint.email,
					payload,
				});
				if (payload.expiresAt) {
					updateVerifiedSession({
						authenticated: true,
						email: payload.email ?? hint.email,
						expiresAt: payload.expiresAt,
						refreshEarlySeconds:
							payload.refreshEarlySeconds ?? hint.refreshEarlySeconds ?? null,
					});
				}
			},
			onRefreshFailed: () => {
				clearKendraAdminSessionHint();
				setAdminSession({ authenticated: false, email: null });
			},
			refreshEarlySeconds: hint.refreshEarlySeconds,
			retryOnRefreshFailure: false,
		});

		return () => {
			cancelled = true;
			stopRefresh();
		};
	}, [pathname, router]);

	return (
		<>
			<header
				className={cn(
					"sticky top-0 z-50 border-b transition-all duration-300 animate-[header-drop_620ms_ease_both]",
					isScrolled ? "border-line bg-white/80 backdrop-blur-md" : "border-transparent bg-transparent",
				)}
			>
				<div
					className={cn(
						shell,
						"flex items-center justify-between gap-4 transition-all duration-300",
						isScrolled ? "py-4 md:py-6" : "py-4 md:py-8",
					)}
				>
					<Link
						href="/"
						className="inline-flex min-w-max items-center gap-2 md:gap-4 group"
						aria-label={`${site.name} home`}
					>
						<Mark />
						<div className="flex flex-col">
							<strong className="block font-serif text-[1rem] md:text-[1.2rem] leading-none tracking-tight group-hover:italic transition-all">
								{site.name}
							</strong>
							<span className="mt-1 block text-[0.5rem] md:text-[0.6rem] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-accent">
								Voice Actor
							</span>
						</div>
					</Link>

					{/* Desktop Navigation */}
					<nav
						aria-label="Primary navigation"
						className="hidden md:flex items-center gap-8"
					>
						{navigation.map((item) => {
							const isActive =
								item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

							return (
								<Link
									key={item.href}
									href={item.href}
									className={cn(
										"text-[0.75rem] font-bold uppercase tracking-[0.2em] text-ink-soft transition duration-300 hover:text-accent hover:italic",
										isActive && "text-accent italic",
									)}
									aria-current={isActive ? "page" : undefined}
								>
									{item.label}
								</Link>
							);
						})}
					</nav>

					<div className="relative">
						<button
							type="button"
							className={cn(
								"grid h-10 w-10 place-items-center rounded-full border text-[0.72rem] font-bold uppercase tracking-[0.08em] transition duration-300",
								pathname.startsWith("/admin")
									? "border-accent bg-accent text-white"
									: "border-line bg-white/70 text-ink hover:border-accent hover:text-accent",
							)}
							aria-expanded={isAvatarMenuOpen}
							aria-haspopup="menu"
							aria-label="Open account menu"
							onClick={() => setIsAvatarMenuOpen((value) => !value)}
						>
							KB
						</button>
						<div
							className={cn(
								"absolute right-0 top-12 z-50 grid min-w-56 gap-1 border border-line bg-white p-2 shadow-[0_22px_70px_rgba(10,10,10,0.14)] transition",
								isAvatarMenuOpen
									? "translate-y-0 opacity-100"
									: "pointer-events-none -translate-y-1 opacity-0",
							)}
							role="menu"
						>
							<div className="border-b border-line px-3 py-2">
								<span className="block text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink-soft">
									Account
								</span>
								<span className="mt-1 block truncate text-sm font-semibold text-ink">
									{isAdminSignedIn
										? (adminSession.email ?? "Admin session")
										: "Not signed in"}
								</span>
							</div>
							<Link
								href="/admin"
								className="px-3 py-2 text-sm font-medium text-ink transition hover:bg-surface hover:text-accent"
								onClick={() => setIsAvatarMenuOpen(false)}
								role="menuitem"
							>
								{isAdminSignedIn ? "Dashboard" : "Open admin login"}
							</Link>
							{isAdminSignedIn ? (
								<Link
									href="/admin/logout"
									className="px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-surface hover:text-accent"
									onClick={() => {
										clearKendraAdminSessionHint();
										setIsAvatarMenuOpen(false);
									}}
									role="menuitem"
								>
									Log out
								</Link>
							) : null}
						</div>
					</div>

					{/* Mobile Menu Toggle */}
					<button
						onClick={() => setIsMenuOpen(!isMenuOpen)}
						className="flex flex-col items-end gap-1.5 p-2 md:hidden"
						aria-expanded={isMenuOpen}
						aria-label={isMenuOpen ? "Close menu" : "Open menu"}
					>
						<span className={cn("h-0.5 bg-ink transition-all duration-300", isMenuOpen ? "w-6 translate-y-2 rotate-45" : "w-6")} />
						<span className={cn("h-0.5 bg-ink transition-all duration-300", isMenuOpen ? "opacity-0" : "w-4")} />
						<span className={cn("h-0.5 bg-ink transition-all duration-300", isMenuOpen ? "w-6 -translate-y-2 -rotate-45" : "w-6")} />
					</button>
				</div>
			</header>

			{/* Mobile Navigation Overlay */}
			<div
				className={cn(
					"fixed inset-0 z-40 bg-white transition-all duration-500 ease-in-out md:hidden",
					isMenuOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
				)}
			>
				<nav className="flex flex-col items-center justify-center h-full gap-8 px-6">
					{navigation.map((item, index) => {
						const isActive =
							item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

						return (
							<Link
								key={item.href}
								href={item.href}
								className={cn(
									"text-4xl font-serif italic tracking-tight text-ink transition-all duration-300",
									isActive ? "text-accent" : "opacity-60",
									isMenuOpen ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
								)}
								style={{ transitionDelay: `${index * 100}ms` }}
								onClick={() => setIsMenuOpen(false)}
							>
								{item.label}
							</Link>
						);
					})}
					<div 
						className={cn(
							"mt-12 flex flex-col items-center gap-4 transition-all duration-500 delay-300",
							isMenuOpen ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
						)}
					>
						<span className="text-[0.65rem] font-bold uppercase tracking-[0.3em] text-accent">Status</span>
						<span className="flex items-center gap-2 text-sm font-medium tracking-wide">
							<span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
							Now Booking
						</span>
					</div>
				</nav>
			</div>
		</>
	);
}
