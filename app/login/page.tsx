import { LoginForm } from "./LoginForm";
import { getCurrentUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
export default async function LoginPage() {
  const user=await getCurrentUser();
  if(user && user.email?.toLowerCase()===process.env.ADMIN_EMAIL?.toLowerCase()) redirect("/");
  return <main className="login-page"><div className="login-card">
    <img src="/logo.png" className="login-logo" alt="The Seven Deadly Sins Origin"/>
    <div className="eyebrow">ORIGIN DATABASE</div><h1>Administration</h1>
    <p>Connexion privée. Seul le compte propriétaire peut modifier les bases.</p>
    <LoginForm />
    <a href="/" className="back-link">← Retour au dashboard</a>
  </div></main>;
}
