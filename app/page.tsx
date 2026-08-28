import { getDonjons, getPersonnages } from "@/lib/data";
import { Dashboard } from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [personnages, donjons] = await Promise.all([getPersonnages(), getDonjons()]);
  return <Dashboard personnages={personnages} donjons={donjons} />;
}
