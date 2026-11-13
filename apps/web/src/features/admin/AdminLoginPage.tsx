"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { ApiRequestError } from "@/lib/api";
import Link from "next/link";
import { useStaffAuthActions, useStaffSession } from "./useStaffSession";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Merchant login ("keep me logged in" defaults to true: the board usually stays open all day). */
export function AdminLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, isChecked } = useStaffSession();
  const { login } = useStaffAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeep] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const next = params.get("next");
  const target = next && next.startsWith("/admin") && !next.startsWith("/admin/login") ? next : "/admin";

  useEffect(() => {
    if (isChecked && user) router.replace(target);
  }, [isChecked, user, router, target]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return setError("Por favor, informe seu email");
    if (!password) return setError("Por favor, informe sua senha");
    if (!EMAIL_PATTERN.test(email.trim())) return setError("Por favor, informe um email válido");
    setError(null);
    login.mutate(
      { email: email.trim(), password, keepLoggedIn },
      {
        onSuccess: () => router.replace(target),
        onError: (err) =>
          setError(err instanceof ApiRequestError && (err.isUnauthenticated || err.isBusinessError) ? err.message : "Desculpe, não estamos conseguindo fazer login nesse momento."),
      },
    );
  };
  const processing = login.isPending;

  return (
    <div className="login-page">
      <div className="quefome-brand" />
      <div className="login-panel">
        <form onSubmit={submit} noValidate>
          <fieldset>
            <legend>Acesso restrito</legend>
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            <div className="form-group">
              <div className="input-group">
                <span className={`input-group-addon${processing ? " disabled" : ""}`}>
                  <Icon name="email" />
                </span>
                <input type="email" className="form-control" placeholder="Email" aria-label="Email" autoComplete="username" value={email} disabled={processing} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <div className="input-group">
                <span className={`input-group-addon${processing ? " disabled" : ""}`}>
                  <Icon name="lock" />
                </span>
                <input type="password" className="form-control" placeholder="Senha" aria-label="Senha" autoComplete="current-password" value={password} disabled={processing} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>
            <div className="checkbox">
              <label>
                <input type="checkbox" checked={keepLoggedIn} disabled={processing} onChange={(e) => setKeep(e.target.checked)} /> Mantenha-me conectado
              </label>
            </div>
            <hr />
            <button type="submit" className="btn btn-primary btn-block" disabled={processing}>
              {processing ? <Icon name="loading" spin /> : <span>Login</span>}
            </button>
            <p className="qf-signup-link">
              Ainda não tem conta? <Link href="/admin/cadastro">Cadastre seu restaurante</Link>
            </p>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
