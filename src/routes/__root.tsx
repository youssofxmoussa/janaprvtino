import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportError } from "../lib/error-reporting";
import { applyAppearance, readAppearance } from "../lib/appearance";

import {
  SITE,
  abs,
  buildMeta,
  organizationSchema,
  webSiteSchema,
  softwareAppSchema,
  ldJson,
} from "../lib/seo";

const siteIcon = abs(SITE.icon);


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>

        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Page not found
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);

  const router = useRouter();

  useEffect(() => {
    reportError(error, {
      boundary: "tanstack_root_error_component",
    });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back
          home.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>

          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route =
  createRootRouteWithContext<{ queryClient: QueryClient }>()({
    head: () => ({
      meta: [
        { charSet: "utf-8" },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1, viewport-fit=cover",
        },

        // Progressive web app / iOS
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
        { name: "color-scheme", content: "light dark" },

        // Sitewide defaults — leaf routes override title/description/og:url
        ...buildMeta({
          title: `${SITE.name} — ${SITE.tagline}`,
          description: SITE.description,
          path: "/",
        }).filter((tag) => !tag.property?.startsWith("og:image") && !tag.name?.startsWith("twitter:image")),
      ],

      links: [
        { rel: "stylesheet", href: appCss },

        // Favicons / app icons
        { rel: "icon", href: siteIcon, type: "image/png" },
        { rel: "shortcut icon", href: siteIcon, type: "image/png" },
        { rel: "apple-touch-icon", href: siteIcon, sizes: "180x180" },
        { rel: "mask-icon", href: siteIcon, color: SITE.themeColor },

        // Performance hints
        { rel: "preconnect", href: SITE.url },
        { rel: "dns-prefetch", href: SITE.url },
      ],

      scripts: [
        ldJson(organizationSchema()),
        ldJson(webSiteSchema()),
        ldJson(softwareAppSchema()),
      ],
    }),


    shellComponent: RootShell,
    component: RootComponent,
    notFoundComponent: NotFoundComponent,
    errorComponent: ErrorComponent,
  });

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>

      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    applyAppearance(readAppearance());

    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    const onChange = () => {
      applyAppearance(readAppearance());
    };

    mq.addEventListener("change", onChange);

    return () => {
      mq.removeEventListener("change", onChange);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
