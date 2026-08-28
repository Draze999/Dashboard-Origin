"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient, requireAdmin } from "@/lib/supabase/server";
import { ARMES, ELEMENTS, ETATS_DONJON, HISTOIRES, RARETES, TYPES_DONJON, TYPES_PERSONNAGE, type Donjon, type Personnage } from "@/lib/types";

const pSchema = z.object({
  personnage: z.string().trim().min(1).max(120),
  rarete: z.enum(RARETES),
  arme: z.enum(ARMES),
  element: z.enum(ELEMENTS),
  type_personnage: z.enum(TYPES_PERSONNAGE),
  histoire: z.enum(HISTOIRES),
  image_url: z.string().trim().max(1000).optional().or(z.literal(""))
});

const dSchema = z.object({
  nom_donjon: z.string().trim().min(1).max(160),
  faiblesses: z.array(z.enum(ELEMENTS)).max(2).refine(v => new Set(v).size === v.length, "Une faiblesse ne peut pas être sélectionnée deux fois."),
  etat: z.enum(ETATS_DONJON),
  type: z.enum(TYPES_DONJON)
});

function weaknesses(fd: FormData) {
  return fd.getAll("faiblesses").map(String).filter(Boolean);
}

export async function loginAdmin(_prev: { error: string }, fd: FormData) {
  const email = String(fd.get("email") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  if (!email || !password) return { error: "Renseigne ton e-mail et ton mot de passe." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Connexion refusée. Vérifie l'e-mail, le mot de passe et que le compte Supabase existe." };

  const { data: { user } } = await supabase.auth.getUser();
  const expected = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!user || !expected || user.email?.toLowerCase() !== expected) {
    await supabase.auth.signOut();
    return { error: "Ce compte n'est pas autorisé comme administrateur." };
  }

  redirect("/");
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  redirect("/");
}

export async function savePersonnage(fd: FormData): Promise<{ ok: true; row: Personnage }> {
  await requireAdmin();
  const parsed = pSchema.safeParse({
    personnage: fd.get("personnage"),
    rarete: fd.get("rarete"),
    arme: fd.get("arme"),
    element: fd.get("element"),
    type_personnage: fd.get("type_personnage"),
    histoire: fd.get("histoire"),
    image_url: fd.get("image_url") || ""
  });
  if (!parsed.success) throw new Error("Données personnage invalides.");

  const data = { ...parsed.data, image_url: parsed.data.image_url || null };
  const id = String(fd.get("id") || "");
  const db = createSupabaseAdminClient();
  const result = id
    ? await db.from("personnages").update(data).eq("id", id).select("*").single()
    : await db.from("personnages").insert(data).select("*").single();

  if (result.error || !result.data) throw new Error(result.error?.message || "Impossible d'enregistrer le personnage.");
  revalidatePath("/");
  return { ok: true, row: result.data as Personnage };
}

export async function deletePersonnage(fd: FormData): Promise<{ ok: true; id: string }> {
  await requireAdmin();
  const id = String(fd.get("id") || "");
  if (!id) throw new Error("ID manquant.");
  const { error } = await createSupabaseAdminClient().from("personnages").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  return { ok: true, id };
}

export async function saveDonjon(fd: FormData): Promise<{ ok: true; row: Donjon }> {
  await requireAdmin();
  const parsed = dSchema.safeParse({
    nom_donjon: fd.get("nom_donjon"),
    faiblesses: weaknesses(fd),
    etat: fd.get("etat"),
    type: fd.get("type")
  });
  if (!parsed.success) throw new Error("Données donjon invalides.");

  const id = String(fd.get("id") || "");
  const db = createSupabaseAdminClient();
  const result = id
    ? await db.from("donjons").update(parsed.data).eq("id", id).select("*").single()
    : await db.from("donjons").insert(parsed.data).select("*").single();

  if (result.error || !result.data) throw new Error(result.error?.message || "Impossible d'enregistrer le donjon.");
  revalidatePath("/");
  return { ok: true, row: result.data as Donjon };
}

export async function deleteDonjon(fd: FormData): Promise<{ ok: true; id: string }> {
  await requireAdmin();
  const id = String(fd.get("id") || "");
  if (!id) throw new Error("ID manquant.");
  const { error } = await createSupabaseAdminClient().from("donjons").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  return { ok: true, id };
}

export async function importCsv(fd: FormData): Promise<{ ok: true; inserted: number }> {
  await requireAdmin();
  const kind = String(fd.get("kind"));
  const file = fd.get("file");
  if (!(file instanceof File)) throw new Error("Fichier CSV manquant.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Le CSV est trop volumineux (10 Mo maximum).");

  const rows = parseCSV(await file.text());
  if (!rows.length) return { ok: true, inserted: 0 };

  const db = createSupabaseAdminClient();
  const BATCH = 400;
  let inserted = 0;

  if (kind === "personnages") {
    const data = rows.map(r => pSchema.parse({
      personnage: r.personnage,
      rarete: r.rarete,
      arme: r.arme,
      element: r.element,
      type_personnage: r.type_personnage,
      histoire: r.histoire,
      image_url: r.image_url || ""
    })).map(r => ({ ...r, image_url: r.image_url || null }));
    const batches = Array.from({ length: Math.ceil(data.length / BATCH) }, (_, index) => data.slice(index * BATCH, (index + 1) * BATCH));
    for (let i = 0; i < batches.length; i += 4) {
      const results = await Promise.all(batches.slice(i, i + 4).map(batch => db.from("personnages").insert(batch)));
      const failed = results.find(r => r.error);
      if (failed?.error) throw new Error(`Import personnages interrompu après ${inserted} ligne(s) : ${failed.error.message}`);
      inserted += results.reduce((sum, _, index) => sum + (batches[i + index]?.length ?? 0), 0);
    }
  } else if (kind === "donjons") {
    const data = rows.map(r => dSchema.parse({
      nom_donjon: r.nom_donjon,
      faiblesses: (r.faiblesses || "").split("|").filter(Boolean),
      etat: r.etat,
      type: r.type
    }));
    const batches = Array.from({ length: Math.ceil(data.length / BATCH) }, (_, index) => data.slice(index * BATCH, (index + 1) * BATCH));
    for (let i = 0; i < batches.length; i += 4) {
      const results = await Promise.all(batches.slice(i, i + 4).map(batch => db.from("donjons").insert(batch)));
      const failed = results.find(r => r.error);
      if (failed?.error) throw new Error(`Import donjons interrompu après ${inserted} ligne(s) : ${failed.error.message}`);
      inserted += results.reduce((sum, _, index) => sum + (batches[i + index]?.length ?? 0), 0);
    }
  } else {
    throw new Error("Type d'import inconnu.");
  }

  revalidatePath("/");
  return { ok: true, inserted };
}

function parseCSV(text: string) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(x => x.trim());
  if (!lines.length) return [];
  const parse = (line: string) => {
    const out: string[] = [];
    let cur = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (quoted && line[i + 1] === '"') { cur += '"'; i++; }
        else quoted = !quoted;
      } else if (c === "," && !quoted) { out.push(cur); cur = ""; }
      else cur += c;
    }
    out.push(cur);
    return out;
  };
  const headers = parse(lines[0]).map(x => x.trim());
  return lines.slice(1).map(line => {
    const vals = parse(line);
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""]));
  });
}
