/** Legacy icomoon font (`qf-icon icon-*`). Decorative by default. */
export function Icon({ name, className, spin }: { name: string; className?: string; spin?: boolean }) {
  return <span className={["qf-icon", `icon-${name}`, spin ? "spin" : "", className ?? ""].filter(Boolean).join(" ")} aria-hidden="true" />;
}

export function Spinner({ label = "Carregando" }: { label?: string }) {
  return (
    <span role="status" aria-label={label}>
      <Icon name="loading" spin />
    </span>
  );
}
