/** Legacy qf-loading-animation directive (pacman). */
export function LoadingAnimation({ message }: { message?: string }) {
  return (
    <div className="loading-page" role="status" aria-live="polite">
      <div className="qf-loading-animation" aria-hidden="true">
        <div className="pacman-top" />
        <div className="pacman-bottom" />
        <div className="ball" />
        <div className="ball" />
        <div className="ball" />
      </div>
      <p className="loading-message">{message ?? "Carregando..."}</p>
    </div>
  );
}
