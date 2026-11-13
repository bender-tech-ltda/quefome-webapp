"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Icon } from "@/components/Icon";
import { ApiRequestError } from "@/lib/api";
import { useStaffAuthActions } from "./useStaffSession";

/** Restaurant sign-up: account + store in one step; setup continues in "Loja". */
export function SignupPage() {
  const router = useRouter();
  const { signup } = useStaffAuthActions();
  const [form, setForm] = useState({ name: "", email: "", password: "", storeName: "", whatsapp: "" });
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (Object.values(form).some((v) => !v.trim())) return setError("Preencha todos os campos.");
    if (form.password.length < 8) return setError("A senha deve ter pelo menos 8 caracteres.");
    setError(null);
    signup.mutate(
      { ...form, email: form.email.trim(), name: form.name.trim(), storeName: form.storeName.trim() },
      {
        onSuccess: () => router.replace("/admin/loja"),
        onError: (err) => setError(err instanceof ApiRequestError && (err.isBusinessError || err.status === 429) ? err.message : "Não foi possível concluir o cadastro agora."),
      },
    );
  };

  return (
    <div className="qf-auth">
      <h1>Cadastre seu restaurante</h1>
      <p className="qf-hint">Cardápio digital com pedidos no seu WhatsApp. Sem comissão.</p>
      <form onSubmit={submit} noValidate>
        {error && (
          <p className="qf-error" role="alert">
            {error}
          </p>
        )}
        <div className="qf-field">
          <label htmlFor="s-store">Nome do restaurante</label>
          <input id="s-store" className="form-control" value={form.storeName} onChange={set("storeName")} />
        </div>
        <div className="qf-field">
          <label htmlFor="s-whatsapp">WhatsApp do restaurante</label>
          <input id="s-whatsapp" className="form-control" type="tel" placeholder="(51) 99999-8888" value={form.whatsapp} onChange={set("whatsapp")} />
          <p className="qf-hint">Os pedidos chegam nesse número.</p>
        </div>
        <div className="qf-field">
          <label htmlFor="s-name">Seu nome</label>
          <input id="s-name" className="form-control" autoComplete="name" value={form.name} onChange={set("name")} />
        </div>
        <div className="qf-field">
          <label htmlFor="s-email">E-mail</label>
          <input id="s-email" className="form-control" type="email" autoComplete="username" value={form.email} onChange={set("email")} />
        </div>
        <div className="qf-field">
          <label htmlFor="s-password">Senha (mínimo 8 caracteres)</label>
          <input id="s-password" className="form-control" type="password" autoComplete="new-password" value={form.password} onChange={set("password")} />
        </div>
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={signup.isPending}>
          {signup.isPending ? <Icon name="loading" spin /> : "Criar minha loja"}
        </button>
      </form>
      <p className="qf-signup-link">
        Já tem conta? <Link href="/admin/login">Entrar</Link>
      </p>
    </div>
  );
}
