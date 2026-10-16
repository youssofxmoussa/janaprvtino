import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

/** Breadcrumb trail rendered as semantic, crawlable HTML. */
export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[0.8125rem] text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-1.5">
            {item.to ? (
              <Link to={item.to} className="hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-foreground">
                {item.label}
              </span>
            )}
            {i < items.length - 1 && <span aria-hidden="true">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function breadcrumbSchema(items: { label: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      item: item.path,
    })),
  };
}

/** Shared shell for public, indexable marketing/support pages. */
export function PublicPage({
  title,
  lede,
  crumbs,
  children,
}: {
  title: string;
  lede: string;
  crumbs: { label: string; to?: string }[];
  children: ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="mx-auto w-full max-w-2xl px-5 py-10 safe-top">
        <Breadcrumbs items={crumbs} />
        <header className="mt-6">
          <h1 className="text-[2rem] font-black leading-[1.1] tracking-tight sm:text-[2.5rem]">
            {title}
          </h1>
          <p className="mt-3 text-[1.0625rem] leading-relaxed text-muted-foreground">{lede}</p>
        </header>
        <main className="mt-10 space-y-10 pb-16">{children}</main>
        <footer className="border-t border-border pt-6 text-[0.8125rem] text-muted-foreground">
          <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-2">
            <Link to="/" className="hover:text-foreground">
              Home
            </Link>
            <Link to="/about" className="hover:text-foreground">
              About
            </Link>
            <Link to="/faq" className="hover:text-foreground">
              FAQ
            </Link>
          </nav>
          <p className="mt-4">Jana Prvt Course — study tools for medical and science students.</p>
        </footer>
      </div>
    </div>
  );
}
