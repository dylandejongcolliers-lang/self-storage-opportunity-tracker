import { requireAuth } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { DashboardNav } from "@/components/dashboard-nav";
import { Logo } from "@/components/logo";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <div className="bg-paper flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6 px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Logo href="/dashboard" height={30} />
            <DashboardNav />
          </div>
          <form action={logout}>
            <Button
              variant="ghost"
              size="sm"
              type="submit"
              className="text-slate-500 hover:text-slate-900"
            >
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 lg:px-8">
        {children}
      </main>

      <footer className="border-t border-slate-200/70">
        <div className="mx-auto w-full max-w-6xl px-6 py-5 lg:px-8">
          <p className="text-xs text-slate-400">
            de Jong Self Storage Team · internal tool
          </p>
        </div>
      </footer>
    </div>
  );
}
