"use client";

import type { Menu, Product } from "@quefome/contract";
import { formatMoney, parseMoneyInput } from "@quefome/domain";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { Modal, ModalCloseButton } from "@/components/Modal";
import { ApiRequestError, api } from "@/lib/api";

type Editing =
  | { kind: "category"; id: string | null; name: string; sequence: number }
  | { kind: "product"; id: string | null; categoryId: string; name: string; description: string; price: string; available: boolean; sequence: number; hasOptions: boolean };

const errorMessage = (err: unknown) => (err instanceof ApiRequestError && (err.isBusinessError || err.isNotFound) ? err.message : "Não foi possível salvar. Tente de novo.");

/**
 * Basic menu CRUD: categories, items, prices, in-stock toggle.
 * DISCUSS: editor for advanced options (pizza flavors, option groups, extras). They are kept untouched here.
 */
export function MenuPage() {
  const client = useQueryClient();
  const catalog = useQuery({ queryKey: ["admin-catalog"], queryFn: () => api.admin.getCatalog() });
  const [editing, setEditing] = useState<Editing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refresh = () => client.invalidateQueries({ queryKey: ["admin-catalog"] });

  const availability = useMutation({
    mutationFn: ({ id, available }: { id: string; available: boolean }) => api.admin.setAvailability(id, available),
    onMutate: ({ id, available }) => {
      client.setQueryData<Menu>(["admin-catalog"], (old) => old && { ...old, products: old.products.map((p) => (p.id === id ? { ...p, available } : p)) });
    },
    onError: (err) => {
      setError(errorMessage(err));
      void refresh();
    },
  });

  const remove = useMutation({
    mutationFn: (target: { kind: "category" | "product"; id: string }) => (target.kind === "category" ? api.admin.deleteCategory(target.id) : api.admin.deleteProduct(target.id)),
    onSuccess: () => {
      setError(null);
      void refresh();
    },
    onError: (err) => setError(errorMessage(err)),
  });

  if (!catalog.data) return <p className="qf-empty">Carregando cardápio...</p>;
  const { categories, products } = catalog.data;
  const sorted = [...categories].sort((a, b) => a.sequence - b.sequence || a.name.localeCompare(b.name, "pt-BR"));

  return (
    <div className="qf-menu-admin">
      <div className="qf-page-head">
        <h1>Cardápio</h1>
        <button type="button" className="btn btn-primary" onClick={() => setEditing({ kind: "category", id: null, name: "", sequence: categories.length + 1 })}>
          Nova categoria
        </button>
      </div>
      {error && (
        <p className="qf-error" role="alert">
          {error}
        </p>
      )}
      {sorted.length === 0 && <p className="qf-empty">Comece criando uma categoria (ex.: Lanches, Pizzas, Bebidas).</p>}

      {sorted.map((category) => {
        const items = products.filter((p) => p.categoryId === category.id);
        return (
          <section key={category.id} className="qf-card" aria-label={category.name}>
            <div className="qf-category-head">
              <h2>{category.name}</h2>
              <span>
                <button type="button" className="btn btn-link btn-sm" onClick={() => setEditing({ kind: "category", id: category.id, name: category.name, sequence: category.sequence })}>
                  Renomear
                </button>
                <button
                  type="button"
                  className="btn btn-link btn-sm qf-danger"
                  onClick={() => window.confirm(`Excluir a categoria "${category.name}"?`) && remove.mutate({ kind: "category", id: category.id })}
                >
                  Excluir
                </button>
              </span>
            </div>
            <ul className="qf-product-list">
              {items.map((p) => (
                <ProductRow
                  key={p.id}
                  product={p}
                  onToggle={(available) => availability.mutate({ id: p.id, available })}
                  onEdit={() =>
                    setEditing({
                      kind: "product", id: p.id, categoryId: p.categoryId, name: p.name, description: p.description, price: formatMoney(p.priceCents),
                      available: p.available, sequence: items.indexOf(p) + 1, hasOptions: p.flavors.length > 0 || p.components.length > 0,
                    })
                  }
                  onDelete={() => window.confirm(`Excluir "${p.name}" do cardápio?`) && remove.mutate({ kind: "product", id: p.id })}
                />
              ))}
            </ul>
            <button
              type="button"
              className="btn btn-default btn-block"
              onClick={() => setEditing({ kind: "product", id: null, categoryId: category.id, name: "", description: "", price: "", available: true, sequence: items.length + 1, hasOptions: false })}
            >
              + Novo item em {category.name}
            </button>
          </section>
        );
      })}

      {editing && (
        <Modal open onClose={() => setEditing(null)} title={editing.kind === "category" ? "Categoria" : "Item do cardápio"}>
          <EditForm
            editing={editing}
            categories={sorted}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              setError(null);
              void refresh();
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function ProductRow({ product, onToggle, onEdit, onDelete }: { product: Product; onToggle: (available: boolean) => void; onEdit: () => void; onDelete: () => void }) {
  return (
    <li className={`qf-product-row${product.available ? "" : " unavailable"}`}>
      <div className="qf-product-info">
        <strong>{product.name}</strong>
        <span>{product.priceCents > 0 ? `R$ ${formatMoney(product.priceCents)}` : product.flavors.length ? "Preço pelos sabores" : "R$ 0,00"}</span>
      </div>
      <label className="qf-switch">
        <input type="checkbox" checked={product.available} onChange={(e) => onToggle(e.target.checked)} aria-label={`${product.name} disponível`} />
        <span>{product.available ? "Disponível" : "Esgotado"}</span>
      </label>
      <span className="qf-row-actions">
        <button type="button" className="btn btn-link btn-sm" onClick={onEdit} aria-label={`Editar ${product.name}`}>
          Editar
        </button>
        <button type="button" className="btn btn-link btn-sm qf-danger" onClick={onDelete} aria-label={`Excluir ${product.name}`}>
          Excluir
        </button>
      </span>
    </li>
  );
}

function EditForm({ editing, categories, onClose, onSaved }: { editing: Editing; categories: Menu["categories"]; onClose: () => void; onSaved: () => void }) {
  const [state, setState] = useState(editing);
  const [error, setError] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: async () => {
      if (state.kind === "category") {
        const body = { name: state.name.trim(), icon: null, sequence: state.sequence };
        return state.id ? api.admin.updateCategory(state.id, body) : api.admin.createCategory(body);
      }
      const priceCents = parseMoneyInput(state.price);
      const body = { categoryId: state.categoryId, name: state.name.trim(), description: state.description.trim(), priceCents: priceCents ?? 0, available: state.available, sequence: state.sequence };
      return state.id ? api.admin.updateProduct(state.id, body) : api.admin.createProduct(body);
    },
    onSuccess: onSaved,
    onError: (err) => setError(errorMessage(err)),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!state.name.trim()) return setError("Informe o nome.");
    if (state.kind === "product" && parseMoneyInput(state.price) === null) return setError("Informe o preço, por exemplo 25,90.");
    setError(null);
    save.mutate();
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="modal-header">
        <ModalCloseButton onClick={onClose} />
        <h4 className="modal-title">{state.kind === "category" ? (state.id ? "Renomear categoria" : "Nova categoria") : state.id ? "Editar item" : "Novo item"}</h4>
      </div>
      <div className="modal-body">
        {error && (
          <p className="qf-error" role="alert">
            {error}
          </p>
        )}
        <div className="qf-field">
          <label htmlFor="e-name">Nome</label>
          <input id="e-name" className="form-control" value={state.name} onChange={(e) => setState({ ...state, name: e.target.value })} />
        </div>
        {state.kind === "product" && (
          <>
            <div className="qf-field">
              <label htmlFor="e-description">Descrição</label>
              <textarea id="e-description" className="form-control" rows={2} value={state.description} onChange={(e) => setState({ ...state, description: e.target.value })} />
            </div>
            <div className="qf-row">
              <div className="qf-field">
                <label htmlFor="e-price">Preço (R$)</label>
                <input id="e-price" className="form-control" inputMode="decimal" placeholder="25,90" value={state.price} onChange={(e) => setState({ ...state, price: e.target.value })} />
              </div>
              <div className="qf-field">
                <label htmlFor="e-category">Categoria</label>
                <select id="e-category" className="form-control" value={state.categoryId} onChange={(e) => setState({ ...state, categoryId: e.target.value })}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <label className="qf-switch">
              <input type="checkbox" checked={state.available} onChange={(e) => setState({ ...state, available: e.target.checked })} />
              <span>Disponível para pedidos</span>
            </label>
            {state.hasOptions && <p className="qf-hint">Esse item tem opções configuradas (sabores/adicionais). Elas são mantidas; a edição de opções virá numa próxima versão.</p>}
          </>
        )}
        <div className="qf-field">
          <label htmlFor="e-sequence">Posição no cardápio</label>
          <input id="e-sequence" className="form-control" type="number" min={0} value={state.sequence} onChange={(e) => setState({ ...state, sequence: Number(e.target.value) || 0 })} />
        </div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-link" onClick={onClose}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={save.isPending}>
          Salvar
        </button>
      </div>
    </form>
  );
}
