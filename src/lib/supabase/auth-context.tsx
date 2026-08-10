import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./client";

export interface RegistrierungsDaten {
  vorname: string;
  nachname: string;
  geburtsdatum?: string; // ISO (YYYY-MM-DD)
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, daten: RegistrierungsDaten) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  resendConfirmation: (email: string) => Promise<{ error: string | null }>;
  deleteAccount: () => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Übersetzt die häufigsten Supabase-Auth-Fehlermeldungen ins Deutsche. */
function uebersetzeFehler(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-Mail oder Passwort ist falsch.";
  if (m.includes("user already registered") || m.includes("already registered"))
    return "Für diese E-Mail existiert bereits ein Konto. Bitte anmelden.";
  if (m.includes("password should be at least")) return "Das Passwort muss mindestens 6 Zeichen lang sein.";
  if (m.includes("email not confirmed")) return "Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse.";
  if (m.includes("rate limit")) return "Zu viele Versuche. Bitte kurz warten und erneut versuchen.";
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn: AuthContextValue["signIn"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? uebersetzeFehler(error.message) : null };
  };

  const signUp: AuthContextValue["signUp"] = async (email, password, daten) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/email-bestaetigt`,
        data: {
          vorname: daten.vorname,
          nachname: daten.nachname,
          geburtsdatum: daten.geburtsdatum || undefined,
        },
      },
    });
    return { error: error ? uebersetzeFehler(error.message) : null };
  };

  const resendConfirmation: AuthContextValue["resendConfirmation"] = async (email) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/email-bestaetigt` },
    });
    return { error: error ? uebersetzeFehler(error.message) : null };
  };

  const deleteAccount: AuthContextValue["deleteAccount"] = async () => {
    const { error } = await supabase.functions.invoke("delete-account");
    if (!error) await supabase.auth.signOut();
    return { error: error ? uebersetzeFehler(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword: AuthContextValue["resetPassword"] = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    return { error: error ? uebersetzeFehler(error.message) : null };
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        resendConfirmation,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth muss innerhalb von <AuthProvider> verwendet werden.");
  return ctx;
}
