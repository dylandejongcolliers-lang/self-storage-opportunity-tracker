export default function ShareNotFound() {
  return (
    <div className="flex min-h-full items-center justify-center bg-slate-50 px-6 py-24">
      <div className="max-w-sm text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Self-Storage Opportunity Tracker
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
          Link not found
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          This share link is invalid or has been retired. Please contact your
          point of contact for an up-to-date link.
        </p>
      </div>
    </div>
  );
}
