import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { getSessionUser, isAdmin } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jana Prvt Course" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "Jana Prvt Course study app." },
    ],
  }),
  component: HomeRedirect,
});

function HomeRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    void getSessionUser().then((user) =>
      navigate({ to: !user ? "/login" : isAdmin(user) ? "/admin" : "/courses", replace: true }),
    );
  }, [navigate]);

  return <div className="min-h-[100dvh] bg-background" />;
}
