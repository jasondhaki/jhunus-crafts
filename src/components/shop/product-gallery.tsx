"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { shimmerDataUrl } from "@/lib/blur-placeholder";
import { useFocusTrap } from "@/lib/use-focus-trap";

const BLUR_DATA_URL = shimmerDataUrl(800, 800);

interface ProductGalleryProps {
  images: string[];
  title: string;
}

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const fullscreenDialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(fullscreenDialogRef, fullscreenOpen);

  const activeImage = images[activeIndex];

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(((index % images.length) + images.length) % images.length);
    },
    [images.length],
  );

  useEffect(() => {
    if (!fullscreenOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setFullscreenOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fullscreenOpen]);

  if (!activeImage) {
    return <div className="aspect-square rounded-lg bg-jute/10" />;
  }

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(activeIndex + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(activeIndex - 1);
    }
  }

  return (
    <div>
      <div
        role="group"
        aria-label={`${title} image gallery`}
        aria-roledescription="carousel"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseMove={handleMouseMove}
        onClick={() => setFullscreenOpen(true)}
        className="group relative aspect-square cursor-zoom-in overflow-hidden rounded-lg bg-jute/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jute focus-visible:ring-offset-2 focus-visible:ring-offset-parchment"
      >
        <Image
          src={activeImage}
          alt={`${title} — view ${activeIndex + 1} of ${images.length}`}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
          // priority alone still stops this from lazy-loading, but as of
          // Next 16 it no longer sets fetchpriority="high" on the <img>
          // itself (deprecated in favor of the new `preload` prop, which
          // the docs then say to avoid too — fetchPriority is the
          // recommended way to hint the LCP image). Confirmed via a real
          // Lighthouse run: the rendered <img> had no fetchpriority
          // attribute at all until this was added explicitly.
          priority
          fetchPriority="high"
          className="object-cover"
        />

        {/* Desktop magnifier: a second copy of the same image, scaled up
            and panned via backgroundPosition to follow the cursor. Only
            shown >=lg since hover has no meaning on touch devices. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 lg:block"
          style={{
            backgroundImage: `url(${activeImage})`,
            backgroundSize: "250%",
            backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
            backgroundRepeat: "no-repeat",
          }}
        />

        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-bark/60 px-3 py-1.5 text-xs font-medium text-cream lg:hidden">
          <ZoomIn className="size-3.5" aria-hidden="true" />
          Tap to zoom
        </div>
      </div>

      {images.length > 1 && (
        <div className="mt-4 flex gap-3" role="tablist" aria-label="Product images">
          {images.map((image, index) => (
            <button
              key={image + index}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`View image ${index + 1} of ${images.length}`}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-md border transition-colors duration-200 ease-out sm:size-20",
                index === activeIndex
                  ? "border-terracotta"
                  : "border-hairline hover:border-jute",
              )}
            >
              <Image src={image} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {fullscreenOpen && (
          <motion.div
            ref={fullscreenDialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${title} — fullscreen image`}
            className="fixed inset-0 z-50 flex items-center justify-center bg-bark/95"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={() => setFullscreenOpen(false)}
          >
            <button
              type="button"
              onClick={() => setFullscreenOpen(false)}
              aria-label="Close fullscreen image"
              className="absolute right-4 top-4 inline-flex size-11 items-center justify-center rounded-full bg-cream/10 text-cream transition-colors duration-200 ease-out hover:bg-cream/20"
            >
              <X className="size-6" aria-hidden="true" />
            </button>
            {/* A plain <img> at natural size inside a scrollable container —
                relies on the browser/OS's native pinch-zoom, which Next's
                default viewport meta doesn't disable. */}
            <div className="max-h-[90vh] w-full max-w-4xl overflow-auto p-4">
              {/* eslint-disable-next-line @next/next/no-img-element -- needs natural sizing for native pinch-zoom, not next/image's fill/object-cover model */}
              <img
                src={activeImage}
                alt={`${title} — full size`}
                className="mx-auto h-auto max-w-full"
                onClick={(event) => event.stopPropagation()}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
