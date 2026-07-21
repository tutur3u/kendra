"use client";

import { Suspense, useEffect, type ReactNode, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

function restoreNativeScrollState() {
  document.documentElement.classList.remove(
    "lenis",
    "lenis-smooth",
    "lenis-stopped",
    "lenis-scrolling",
  );
  document.documentElement.style.removeProperty("overflow");
  document.body.style.removeProperty("overflow");
  document.body.style.removeProperty("height");
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={children}>
      <SmoothScrollController>{children}</SmoothScrollController>
    </Suspense>
  );
}

function SmoothScrollController({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);
  const isAdminRoute = pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdminRoute) {
      lenisRef.current?.destroy();
      lenisRef.current = null;
      restoreNativeScrollState();
      return;
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    });

    lenisRef.current = lenis;
    let frameId = 0;

    function raf(time: number) {
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    }

    frameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frameId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [isAdminRoute]);

  useEffect(() => {
    if (!isAdminRoute && lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    }
  }, [isAdminRoute, pathname]);

  return <>{children}</>;
}
