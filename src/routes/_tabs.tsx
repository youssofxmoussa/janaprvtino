import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSessionUser } from "@/lib/supabase";
import { TabBar } from "@/components/ios/TabBar";
import { useStudyTimer } from "@/lib/activity";
import { useEffect } from "react";
import { courses } from "@/lib/courses";
import avatarJana from "@/assets/avatar-jana.webp";

export const Route = createFileRoute("/_tabs")({
  ssr: false,
  beforeLoad: async () => {
    const user = await getSessionUser();
    if (!user) throw redirect({ to: "/login", replace: true });
  },
  component: TabsLayout,
});

function TabsLayout() {
  useStudyTimer();
  useEffect(() => {
    // Warm the image cache so every picture appears instantly
    [...courses.map((c) => c.image).filter(Boolean), avatarJana].forEach((src) => {
      const img = new Image();
      img.decoding = "async";
      img.src = src as string;
    });
  }, []);

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <div
        className="mx-auto w-full max-w-md px-5 safe-top flex-1 flex flex-col"
      >
        <Outlet />
      </div>
      <TabBar />
    </div>
  );
}
