import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { Field } from "@/components/ios/Field";
import { Pressable, spring } from "@/components/ios/press";
import { appHead } from "@/lib/seo";
import { getSessionUser, isAdmin, supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    ...appHead({
      title: "Sign in · Jana Prvt Course",
      description: "Sign in to Jana Prvt Course and continue your first-year science courses.",
      path: "/login",
    }),
  }),
  component: SignIn,
});

function SignIn() {
  const navigate = useNavigate();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  useEffect(() => {
    void getSessionUser().then((user) => {
      if (user) void navigate({ to: isAdmin(user) ? "/admin" : "/courses", replace: true });
      else void router.preloadRoute({ to: "/courses" });
    });
  }, [navigate, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status !== "idle") return;
    setError(null);

    // Slow down repeated guessing on this device (the sign-in service also limits attempts).
    const lock = JSON.parse(localStorage.getItem("jp_login_lock") || '{"n":0,"until":0}') as { n: number; until: number };
    if (lock.until > Date.now()) {
      setError(`Too many attempts. Try again in ${Math.ceil((lock.until - Date.now()) / 1000)}s.`);
      return;
    }
    setStatus("loading");

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase().slice(0, 254),
      password: password.slice(0, 72),
    });
    if (signInError || !data.user) {
      const msg = signInError?.message ?? "";
      const n = lock.n + 1;
      localStorage.setItem("jp_login_lock", JSON.stringify({ n: n >= 5 ? 0 : n, until: n >= 5 ? Date.now() + 60_000 : 0 }));
      setError(/banned/i.test(msg) ? "Your account is paused. Contact your teacher." : "Incorrect email or password.");
      setStatus("idle");
      return;
    }
    localStorage.removeItem("jp_login_lock");

    const role = data.user.app_metadata?.["role"];
    if (role !== "admin" && role !== "student") {
      await supabase.auth.signOut();
      setError("This account has no access. Contact your teacher.");
      setStatus("idle");
      return;
    }

    setStatus("success");
    await navigate({ to: isAdmin(data.user) ? "/admin" : "/courses", replace: true });
  };

  const loading = status === "loading";
  const success = status === "success";

  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-background px-6 pt-12 pb-12 safe-top safe-bottom">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="relative z-10 flex w-full max-w-sm flex-col justify-center gap-[clamp(1rem,3.5vh,1.75rem)]"
      >
        <header className="flex flex-col items-center text-center">
          <div className="relative flex items-center justify-center">
            <div
              aria-hidden="true"
              className="absolute size-[clamp(9rem,30vw,12rem)] rounded-full bg-primary/15 blur-3xl"
            />
            <img
              src="/brand/jana-logo.png"
              alt="Jana Prvt Course logo"
              width={3200}
              height={2369}
              className="relative h-[clamp(7.5rem,22vh,11rem)] w-full object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
            />
          </div>
          <h1 className="mt-[clamp(0.5rem,2vh,1rem)] text-[clamp(1.75rem,5.5vw,2.125rem)] leading-tight font-bold tracking-tight">
            Welcome Back, <br />
            Jana Prvt Course
          </h1>
        </header>

        <form onSubmit={handleSubmit} className="rounded-3xl p-[clamp(0.875rem,2.5vh,1.25rem)]">
          <div className="space-y-3">
            <Field label="Email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Field label="Password" reveal autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="mt-3 text-center text-[0.875rem] font-medium text-destructive">{error}</p>}
          <Pressable type="submit" disabled={loading || success} className="mt-[clamp(0.875rem,2.5vh,1.25rem)] gap-2 disabled:opacity-100">
            {loading && <span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />}
            {success && <span className="grid size-5 place-items-center rounded-full bg-mint text-primary-foreground"><Check className="size-3.5" strokeWidth={3.5} /></span>}
            {success ? "Signed in" : loading ? "Logging in…" : "Login"}
          </Pressable>
          <button type="button" onClick={() => setError("Ask your teacher to reset your password.")} className="mt-3 w-full text-center text-[0.9375rem] font-medium text-primary">Forgot password?</button>
        </form>
      </motion.div>
    </main>
  );
}
