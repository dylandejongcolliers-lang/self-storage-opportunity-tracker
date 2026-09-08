import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { Wordmark } from "@/components/wordmark";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await isAuthenticated()) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="bg-brand-dark">
        <div className="mx-auto flex max-w-5xl items-center px-5 py-3">
          <Wordmark tone="light" />
        </div>
      </div>

      <main className="flex flex-1 items-center justify-center px-6 py-24">
        <div className="w-full max-w-sm">
          <p className="text-brand-dark text-xs font-semibold uppercase tracking-[0.2em]">
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
    </div>
  );
}
