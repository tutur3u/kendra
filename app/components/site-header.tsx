"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation, site } from "../content";
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

export function SiteHeader() {
	const pathname = usePathname();
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);

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

	// Close menu on navigation
	useEffect(() => {
		setIsMenuOpen(false);
	}, [pathname]);

	return (
		<>
			<header
				className={cn(
					shell,
					"sticky top-0 z-50 flex items-center justify-between gap-4 py-4 md:py-8 transition-all duration-300 animate-[header-drop_620ms_ease_both]",
					isScrolled ? "bg-white/80 backdrop-blur-md border-b border-line py-4 md:py-6" : "bg-transparent border-b border-transparent"
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
							Portfolio
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
