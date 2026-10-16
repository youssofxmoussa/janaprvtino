import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { getSessionUser, isAdmin } from "@/lib/supabase";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const user = await getSessionUser();
    if (!user) throw redirect({ to: "/login", replace: true });
    if (!isAdmin(user)) throw redirect({ to: "/courses", replace: true });
  },
  head: () => ({
    meta: [
      { title: "Admin · Jana Prvt Course" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "Admin area for Jana Prvt Course." },
    ],
  }),
  component: Admin,
});

function Admin() {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col gap-4 bg-background px-5 pt-16 safe-top">
      <h1 className="text-[2rem] font-bold tracking-tight">Admin</h1>
      <p className="text-muted-foreground">The admin panel is being built.</p>
      <Link to="/courses" className="clay rounded-2xl px-4 py-3.5 text-primary">Open the app</Link>
    </main>
  );
}
