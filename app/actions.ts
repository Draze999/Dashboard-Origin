"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/server";
import { ARMES, ELEMENTS, ETATS_DONJON, HISTOIRES, TYPES_DONJON, TYPES_PERSONNAGE } from "@/lib/types";

const personnageSchema = z.object({
  personnage: z.string().trim().min(1).max(120),
  arme: z.enum(ARMES),
  element: z.enum(ELEMENTS),
  type_personnage: z.enum(TYPES_PERSONNAGE),
  histoire: z.enum(HISTOIRES)
});

const donjonSchema = z.object({
  nom_donjon: z.string().trim().min(1).max(160),
  faiblesses: z.array(z.enum(ELEMENTS)).max(2),
  etat: z.enum(ETATS_DONJON),
  type: z.enum(TYPES_DONJON)
});

function cleanWeaknesses(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value) return [];
  return value.split(",").filter(Boolean);
}

export async function savePersonnage(formData: FormData) {
  await requireAdmin();
  const parsed = personnageSchema.safeParse({
    personnage: formData.get("personnage"),
    arme: formData.get("arme"),
    element: formData.get("element"),
    type_personnage: formData.get("type_personnage"),
    histoire: formData.get("histoire")
  });
  if (!parsed.success) throw new Error("Données personnage invalides.");

  const id = formData.get("id");
  const db = createSupabaseAdminClient();
  const result = id
    ? await db.from("personnages").update(parsed.data).eq("id", String(id))
    : await db.from("personnages").insert(parsed.data);

  if (result.error) throw new Error(result.error.message);
  revalidatePath("/");
}

export async function deletePersonnage(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("ID manquant.");
  const { error } = await createSupabaseAdminClient().from("personnages").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function saveDonjon(formData: FormData) {
  await requireAdmin();
  const parsed = donjonSchema.safeParse({
    nom_donjon: formData.get("nom_donjon"),
    faiblesses: cleanWeaknesses(formData.get("faiblesses")),
    etat: formData.get("etat"),
    type: formData.get("type")
  });
  if (!parsed.success) throw new Error("Données donjon invalides.");

  const id = formData.get("id");
  const db = createSupabaseAdminClient();
  const result = id
    ? await db.from("donjons").update(parsed.data).eq("id", String(id))
    : await db.from("donjons").insert(parsed.data);

  if (result.error) throw new Error(result.error.message);
  revalidatePath("/");
}

export async function deleteDonjon(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("ID manquant.");
  const { error } = await createSupabaseAdminClient().from("donjons").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function logout() {
  const supabase = await (await import("@/lib/supabase/server")).createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/");
}
