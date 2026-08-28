"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setError("Identifiants invalides.");
    router.push("/");
    router.refresh();
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={login}>
        <div className="eyebrow">ORIGIN</div>
        <h1>Administration</h1>
        <p>Connexion réservée au propriétaire de la base.</p>
        <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
        <label>Mot de passe<input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
        {error && <div className="error">{error}</div>}
        <button className="primary" type="submit">Se connecter</button>
        <a href="/" className="back-link">← Retour aux données</a>
      </form>
    </main>
  );
}
