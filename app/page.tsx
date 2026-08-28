import { getDonjons,getPersonnages } from "@/lib/data";
import { getCurrentUser } from "@/lib/supabase/server";
import { Dashboard } from "@/components/Dashboard";
export const dynamic="force-dynamic";
export default async function Home(){
 const [personnages,donjons,user]=await Promise.all([getPersonnages(),getDonjons(),getCurrentUser()]);
 const isAdmin=Boolean(user?.email&&process.env.ADMIN_EMAIL&&user.email.toLowerCase()===process.env.ADMIN_EMAIL.toLowerCase());
 return <Dashboard personnages={personnages} donjons={donjons} isAdmin={isAdmin}/>;
}
