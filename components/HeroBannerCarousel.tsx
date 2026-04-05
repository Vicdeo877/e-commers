"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import AppImage from "@/components/AppImage";
import { cn, imgUrl } from "@/lib/utils";

export interface HeroBanner {
  id?: number;
  title: string;
  subtitle: string;
  link_url?: string;
  image_path?: string;
}

const AUTO_MS = 5000;

type Props = {
  banners: HeroBanner[];
  /** Shown when API returns no hero banners */
  fallbackTitle?: string;
  fallbackSubtitle?: string;
};

export default function HeroBannerCarousel({
  banners,
  fallbackTitle = "BlissFruitz,\nDirect from Farm",
  fallbackSubtitle = "Experience the taste of nature delivered in its purest form to your home. Organic, handpicked, and quality-assured.",
}: Props) {
  const slides: HeroBanner[] =
    banners.length > 0
      ? banners
      : [
          {
            title: fallbackTitle,
            subtitle: fallbackSubtitle,
            link_url: "/shop",
            image_path: undefined,
          },
        ];

  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const n = slides.length;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.style.setProperty("--hero-n", String(n));
    el.style.setProperty("--hero-index", String(index));
  }, [n, index]);
  const go = useCallback(
    (dir: -1 | 1) => {
      setIndex((i) => (i + dir + n) % n);
    },
    [n]
  );

  /** Auto-advance; `index` in deps restarts the timer after each slide (manual or auto) */
  useEffect(() => {
    if (n <= 1 || reduceMotion) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % n);
    }, AUTO_MS);
    return () => window.clearInterval(t);
  }, [n, index, reduceMotion]);

  return (
    <section className="relative bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 text-white overflow-hidden min-h-[480px] flex items-center">
      <div className="hero-banner-dots absolute inset-0 opacity-[0.12] pointer-events-none" aria-hidden />
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
        <div className="overflow-hidden rounded-3xl sm:rounded-none">
          <div ref={trackRef} className="hero-banner-track">
            {slides.map((heroBanner, i) => (
              <div
                key={heroBanner.id ?? `slide-${i}`}
                className="hero-banner-slide grid md:grid-cols-2 gap-10 items-center"
              >
                <div className="order-2 md:order-1">
                  <span className="inline-block bg-white/20 text-white text-sm px-4 py-1 rounded-full mb-4">
                    100% Organic &amp; Fresh
                  </span>
                  <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4 whitespace-pre-line">
                    {heroBanner.title}
                  </h1>
                  <p className="text-white/90 text-lg mb-8 max-w-md">{heroBanner.subtitle}</p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={heroBanner.link_url ?? "/shop"}
                      className="bg-white text-green-700 hover:bg-green-50 font-bold px-6 py-3 rounded-full flex items-center gap-2 transition-colors"
                    >
                      Shop Now <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/blog"
                      className="border-2 border-white/60 text-white hover:bg-white/10 px-6 py-3 rounded-full transition-colors"
                    >
                      Read Blog
                    </Link>
                  </div>
                </div>
                <div className="order-1 md:order-2 flex items-center justify-center">
                  <div className="relative w-full max-w-lg aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl ring-2 ring-white/30 bg-white/10">
                    <AppImage
                      src={heroBanner.image_path ? imgUrl(heroBanner.image_path) : "/images/banner-hero.jpg"}
                      alt={heroBanner.title}
                      fill
                      className="object-cover"
                      placeholderName={heroBanner.title}
                      placeholderType="banner"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {n > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/25 hover:bg-black/40 text-white flex items-center justify-center transition-colors"
              aria-label="Previous banner"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/25 hover:bg-black/40 text-white flex items-center justify-center transition-colors"
              aria-label="Next banner"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <div className="flex justify-center gap-2 mt-8">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    i === index ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
                  )}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
