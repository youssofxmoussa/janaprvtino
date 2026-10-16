import { AlertCircle, RotateCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface PdfViewerProps {
  src: string;
  className?: string;
  /** Called with (pagesRendered, totalPages) as pages come in. */
  onProgress?: (pagesRendered: number, totalPages: number) => void;
}

/** Cache of already-painted pages, keyed by document url then page number. */
const pageCache = new Map<string, Map<number, HTMLCanvasElement>>();
const EAGER_PAGES = 2;

function cacheFor(src: string) {
  let map = pageCache.get(src);
  if (!map) {
    map = new Map();
    pageCache.set(src, map);
  }
  return map;
}

/**
 * Inline PDF renderer that streams the document in HTTP range chunks,
 * renders the first pages immediately, pre-fetches pages ahead of the
 * viewport, and caches painted canvases so revisits are instant.
 */
export function PdfViewer({ src, className, onProgress }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(onProgress);
  progressRef.current = onProgress;
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let observer: IntersectionObserver | null = null;
    let pdfDoc: { numPages: number; getPage: (n: number) => Promise<any>; destroy?: () => void } | null =
      null;

    const run = async () => {
      const container = containerRef.current;
      if (!container) return;
      setError(null);
      setPageCount(0);
      container.replaceChildren();

      try {
        const pdfjs = await import("pdfjs-dist");
        const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

        // Stream the file in small HTTP range chunks instead of downloading it
        // whole: pages become readable as soon as their bytes arrive.
        const doc = await pdfjs.getDocument({
          url: src,
          disableAutoFetch: true,
          disableStream: false,
          disableRange: false,
          rangeChunkSize: 65536,
        }).promise;
        if (cancelled) {
          void (doc as unknown as { destroy?: () => void }).destroy?.();
          return;
        }
        pdfDoc = doc as unknown as typeof pdfDoc;
        setPageCount(doc.numPages);
        container.replaceChildren();

        const width = container.clientWidth || 390;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const cache = cacheFor(src);
        const inFlight = new Set<number>();
        const painted = new Set<number>();

        const report = () => progressRef.current?.(painted.size, doc.numPages);

        const attach = (slot: HTMLDivElement, canvas: HTMLCanvasElement, pageNumber: number) => {
          slot.replaceChildren(canvas);
          slot.style.minHeight = "";
          painted.add(pageNumber);
          report();
        };

        const renderPage = async (slot: HTMLDivElement, pageNumber: number) => {
          if (cancelled || inFlight.has(pageNumber)) return;

          const cached = cache.get(pageNumber);
          if (cached) {
            attach(slot, cached, pageNumber);
            return;
          }


          inFlight.add(pageNumber);
          try {
            const page = await doc.getPage(pageNumber);
            if (cancelled) return;
            const base = page.getViewport({ scale: 1 });
            const viewport = page.getViewport({ scale: width / base.width });

            const canvas = document.createElement("canvas");
            canvas.width = Math.floor(viewport.width * dpr);
            canvas.height = Math.floor(viewport.height * dpr);
            canvas.style.width = "100%";
            canvas.style.height = "auto";
            canvas.style.display = "block";
            canvas.className = "bg-white select-none pointer-events-none";
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.scale(dpr, dpr);
            await page.render({ canvasContext: ctx, viewport }).promise;
            if (cancelled) return;
            cache.set(pageNumber, canvas);
            attach(slot, canvas, pageNumber);
          } finally {
            inFlight.delete(pageNumber);
          }
        };

        // Use page 1 to estimate the placeholder height for every page.
        const first = await doc.getPage(1);
        const firstBase = first.getViewport({ scale: 1 });
        const estHeight = Math.round((width / firstBase.width) * firstBase.height);

        observer = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              const slot = entry.target as HTMLDivElement;
              const n = Number(slot.dataset["page"]);
              observer?.unobserve(slot);
              void renderPage(slot, n);
              // Pre-fetch the next page so scrolling never waits.
              const nextSlot = slots.get(n + 1);
              if (nextSlot) {
                observer?.unobserve(nextSlot);
                void renderPage(nextSlot, n + 1);
              }
            }
          },
          // Big lookahead: start work well before a page reaches the screen.
          { rootMargin: "1600px 0px" },
        );

        const slots = new Map<number, HTMLDivElement>();
        for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
          const slot = document.createElement("div");
          slot.dataset["page"] = String(pageNumber);
          slot.style.minHeight = `${estHeight}px`;
          slot.className = "w-full overflow-hidden rounded-md";
          container.appendChild(slot);
          slots.set(pageNumber, slot);
        }

        // Paint the opening pages right away instead of waiting for scroll.
        for (let pageNumber = 1; pageNumber <= Math.min(EAGER_PAGES, doc.numPages); pageNumber++) {
          const slot = slots.get(pageNumber);
          if (slot) void renderPage(slot, pageNumber);
        }

        for (const [pageNumber, slot] of slots) {
          if (pageNumber > EAGER_PAGES) observer.observe(slot);
        }

        report();
      } catch (e) {
        if (!cancelled) {
          console.error("Course PDF failed to load", e);
          setError("The course PDF couldn't be loaded. Check your connection and try again.");
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
      observer?.disconnect();
      pdfDoc?.destroy?.();
    };
  }, [attempt, src]);

  return (
    <div className={className}>
      <div ref={containerRef} className="flex w-full flex-col gap-3" />
      {!error && pageCount === 0 && (
        <p className="px-4 py-6 text-center text-[0.8125rem] font-medium text-muted-foreground">
          Loading document…
        </p>
      )}
      {error && (
        <div role="alert" className="flex min-h-64 flex-col items-center justify-center gap-4 px-6 text-center">
          <span className="grid size-11 place-items-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="size-5" aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <p className="font-semibold text-foreground">PDF unavailable</p>
            <p className="text-[0.8125rem] font-medium leading-relaxed text-muted-foreground">{error}</p>
          </div>
          <Button type="button" variant="outline" onClick={() => setAttempt((value) => value + 1)}>
            <RotateCw aria-hidden="true" />
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
