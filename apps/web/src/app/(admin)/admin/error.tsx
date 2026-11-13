"use client";

/** Error boundary for admin pages (e.g. the API is unavailable). */
export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="not-found" role="alert">
      <p className="title">Tivemos um problema</p>
      <p>Não conseguimos carregar essa página agora. Tente novamente em instantes.</p>
      <button type="button" className="btn btn-primary" onClick={reset}>
        Tentar novamente
      </button>
    </div>
  );
}
