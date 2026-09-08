import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in · Self-Storage Opportunity Tracker" };

export default async function LoginPage() {
  if (await isAuthenticated()) {
    redirect("/dashboard");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm">
        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.2em]">
          Internal
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Self-Storage Opportunity Tracker
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Enter the shared team password to continue.
        </p>

        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
