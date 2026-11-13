"use client";

import type { LoginRequest, SignupRequest, StaffUser } from "@quefome/contract";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const KEY = ["staff-session"] as const;

/** Merchant e-mail/password session (MVP). */
export function useStaffSession() {
  const query = useQuery({ queryKey: KEY, queryFn: () => api.admin.getSession().then((r) => r.user), staleTime: 60_000 });
  return { user: query.data ?? null, isChecked: query.isFetched || query.isError };
}

export function useStaffAuthActions() {
  const client = useQueryClient();
  const set = (user: StaffUser | null) => client.setQueryData(KEY, user);
  return {
    login: useMutation({ mutationFn: (body: LoginRequest) => api.admin.login(body), onSuccess: set }),
    signup: useMutation({ mutationFn: (body: SignupRequest) => api.admin.signup(body), onSuccess: set }),
    /** Re-read the session (e.g. after publishing the store). */
    refresh: () => client.invalidateQueries({ queryKey: KEY }),
    logout: useMutation({
      mutationFn: () => api.admin.logout(),
      onSuccess: () => {
        set(null);
        client.removeQueries({ queryKey: ["admin-orders"] });
        client.removeQueries({ queryKey: ["admin-settings"] });
        client.removeQueries({ queryKey: ["admin-catalog"] });
      },
    }),
  };
}
