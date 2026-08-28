"use client";

import { useEffect, useState } from "react";
import { AdminPanel } from "./AdminPanel";

export function AdminGate({ kind, rows }: { kind: "personnages"|"donjons"; rows: any[] }) {
  const [admin, setAdmin] = useState(false);
  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(d => setAdmin(Boolean(d.admin))).catch(() => {});
  }, []);
  return admin ? <AdminPanel kind={kind} rows={rows} /> : null;
}
