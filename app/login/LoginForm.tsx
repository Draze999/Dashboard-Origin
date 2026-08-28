"use client";
import { useActionState } from "react";
import { loginAdmin } from "@/app/actions";
const initial={error:""};
export function LoginForm(){
 const [state,action,pending]=useActionState(loginAdmin,initial);
 return <form action={action} className="login-form">
  <label>E-mail<input name="email" type="email" autoComplete="username" required/></label>
  <label>Mot de passe<input name="password" type="password" autoComplete="current-password" required/></label>
  {state.error&&<div className="error">{state.error}</div>}
  <button className="primary wide" disabled={pending}>{pending?"Connexion…":"Se connecter"}</button>
 </form>
}
