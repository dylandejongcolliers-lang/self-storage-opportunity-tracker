import { Logo } from "@/components/logo";

export default function ShareNotFound() {
  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-5">
          <Logo height={32} />
        </div>
      </header>
      <div className="flex items-center justify-center px-6 py-24">
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Link not found
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            This share link is invalid or has been retired. Please contact your
            point of contact for an up-to-date link.
          </p>
        </div>
      </div>
    </div>
  );
}
