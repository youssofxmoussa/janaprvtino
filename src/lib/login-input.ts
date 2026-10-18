export function validateLogin(input: { email: string; password: string }) {
  const email = String(input?.email ?? "").trim().toLowerCase();
  const password = typeof input?.password === "string" ? input.password : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length > 72) {
    throw new Error("Incorrect email or password.");
  }
  return { email, password };
}