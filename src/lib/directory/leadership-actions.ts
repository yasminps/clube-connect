"use server";

import { revalidatePath } from "next/cache";
import { panelRoles } from "@/lib/auth/access";
import { requirePageAccess } from "@/lib/auth/page-access";
import { passwordMinimum } from "@/lib/auth/state";
import { createLeadershipAdminClient } from "@/lib/services/leadership";
import { isUuid, readField, type DirectoryState } from "./validation";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function unitIds(form: FormData) {
  const ids = form.getAll("units");
  if (ids.length > 50 || !ids.every(isUuid)) return null;
  return [...new Set(ids)].sort();
}

function refreshLeadership() {
  revalidatePath("/equipe");
  revalidatePath("/unidades");
  revalidatePath("/conselheiro");
}

export async function registerCounselor(_: DirectoryState, form: FormData): Promise<DirectoryState> {
  const { client, userId } = await requirePageAccess(panelRoles);
  const name = readField(form, "name");
  const email = readField(form, "email").toLowerCase();
  const password = form.get("password");
  const units = unitIds(form);
  if (!name || name.length > 100 || email.length > 254 || !emailPattern.test(email) || !units?.length) {
    return { error: "Preencha o nome e o e-mail e selecione pelo menos uma unidade ativa." };
  }
  if (typeof password !== "string" || password.trim().length < passwordMinimum || new TextEncoder().encode(password).length > 72) {
    return { error: "Use pelo menos 12 caracteres para a senha temporária, até o limite de 72 bytes." };
  }

  let admin: ReturnType<typeof createLeadershipAdminClient>;
  try { admin = createLeadershipAdminClient(); }
  catch { return { error: "O cadastro de contas ainda precisa ser configurado no servidor." }; }

  const prepared = await admin.rpc("prepare_counselor_account", { actor: userId, email_address: email, counselor_name: name, targets: units });
  if (prepared.error) {
    if (prepared.error.code === "23505") return { error: "Já existe uma conta com esse e-mail." };
    return { error: "Não foi possível preparar o cadastro. Confira as unidades selecionadas e tente novamente." };
  }

  const creation = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    app_metadata: { club_counselor_provisioning: prepared.data },
  });
  if (creation.error || !creation.data.user) {
    if (creation.error?.code === "email_exists") return { error: "Já existe uma conta com esse e-mail." };
    if (creation.error?.code === "weak_password") return { error: "O Supabase recusou a senha. Escolha uma senha temporária mais forte." };
    return { error: "Não foi possível confirmar o cadastro. Confira a lista da equipe antes de tentar novamente." };
  }

  const registered = await client.from("leadership_directory").select("id").eq("id", creation.data.user.id).maybeSingle();
  if (registered.error || !registered.data) {
    return { error: "Não foi possível confirmar o cadastro de liderança. Confira a lista da equipe." };
  }

  refreshLeadership();
  return { success: "Conta criada para " + email + ". Entregue a senha temporária que você definiu por um canal privado. A troca será exigida no primeiro acesso." };
}

export async function renameCounselor(_: DirectoryState, form: FormData): Promise<DirectoryState> {
  const { client } = await requirePageAccess(panelRoles);
  const id = readField(form, "id");
  const name = readField(form, "name");
  if (!isUuid(id) || !name || name.length > 100) return { error: "Informe um nome válido." };
  const result = await client.rpc("rename_counselor", { target: id, counselor_name: name });
  if (result.error) return { error: "Não foi possível atualizar o nome." };
  refreshLeadership();
  return { success: "Nome atualizado." };
}

export async function updateCounselor(_: DirectoryState, form: FormData): Promise<DirectoryState> {
  const { client } = await requirePageAccess(panelRoles);
  const id = readField(form, "id");
  const operation = readField(form, "operation");
  const units = operation === "links" ? unitIds(form) : null;
  if (!isUuid(id) || !["links", "activate", "deactivate"].includes(operation) || (operation === "links" && units === null)) {
    return { error: "Confira o cadastro e as unidades selecionadas." };
  }

  const result = await client.rpc("manage_counselor", {
    target: id,
    targets: units,
    enabled: operation === "links" ? null : operation === "activate",
  });
  if (result.error) return { error: "Não foi possível alterar o cadastro. Confira suas permissões e tente novamente." };
  refreshLeadership();
  return { success: operation === "links" ? "Vínculos atualizados." : operation === "activate" ? "Acesso reativado." : "Acesso desativado." };
}