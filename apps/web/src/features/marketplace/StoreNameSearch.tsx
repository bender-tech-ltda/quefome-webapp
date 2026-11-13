"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useId, useState } from "react";
import { Icon } from "@/components/Icon";
import { api } from "@/lib/api";

/**
 * Legacy qf-autocomplete over establishment names (home + search pages).
 * Native <datalist> keeps it accessible and works on phones; suggestions are fetched as the user types.
 */
export function StoreNameSearch({ initialQuery = "", variant }: { initialQuery?: string; variant: "home" | "search" }) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState(initialQuery);
  const [debounced, setDebounced] = useState(initialQuery);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 200);
    return () => clearTimeout(t);
  }, [query]);

  const suggestions = useQuery({
    queryKey: ["store-names", debounced],
    queryFn: ({ signal }) => api.suggestStoreNames(debounced, 8, signal),
    enabled: debounced.length >= 2,
    staleTime: 60_000,
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/restaurantes${params.size ? `?${params}` : ""}`);
  };

  const input = (
    <>
      <input
        type="search"
        className="query-field"
        name="q"
        list={listId}
        autoComplete="off"
        placeholder={variant === "home" ? "Qual o nome do restaurante?" : "Qual o nome do estabelecimento?"}
        aria-label="Nome do estabelecimento"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <datalist id={listId}>
        {(suggestions.data ?? []).map((s) => (
          <option key={s.slug} value={s.name} />
        ))}
      </datalist>
    </>
  );

  if (variant === "home") {
    return (
      <form className="query-search" onSubmit={submit} itemProp="potentialAction" itemScope itemType="http://schema.org/SearchAction">
        <h3 className="title" itemProp="name">Procure pelo seu restaurante favorito</h3>
        {input}
        <meta itemProp="target" content="/restaurantes?q={query}" />
        <button type="submit" className="btn btn-primary query-button" disabled={submitting}>
          {submitting ? (
            <>
              <span>Pesquisando...</span> <Icon name="loading" spin />
            </>
          ) : (
            <>
              <span>Pesquisar</span> <Icon name="search" />
            </>
          )}
        </button>
      </form>
    );
  }

  return (
    <div className="query-search">
      <h3 className="title">Procure pelo nome do estabelecimento</h3>
      <form className="query-group" onSubmit={submit}>
        {input}
        <span className="query-button-wrapper">
          <button type="submit" className="query-button" aria-label="Pesquisar">
            <Icon name="search" />
          </button>
        </span>
      </form>
    </div>
  );
}
