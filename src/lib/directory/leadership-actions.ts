"use server";

import { revalidatePath } from "next/cache";
import { panelRoles } from "@/lib/auth/access";
import { appOrigin } from "@/lib/auth/origin";
import { requirePageAccess } from "@/lib/auth/page-access";
import { createInviteClient } from "@/lib/services/leadership";
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

export async function inviteCounselor(_: DirectoryState, form: FormData): Promise<DirectoryState> {
  const { client, userId } = await requirePageAccess(panelRoles);
  const name = readField(form, "name");
  const email = readField(form, "email").toLowerCase();
  const units = unitIds(form);
  if (!name || name.length > 100 || email.length > 254 || !emailPattern.test(email) || !units?.length) {
    return { error: "Preencha o nome e o e-mail e selecione pelo menos uma unidade ativa." };
  }

  let admin: ReturnType<typeof createInviteClient>;
  let redirectTo: string;
  try {
    admin = createInviteClient();
    redirectTo = appOrigin() + "/aceitar-convite";
  } catch {
    return { error: "Os convites ainda precisam ser configurados no servidor." };
  }

  const prepared = await admin.rpc("prepare_counselor_invite", { actor: userId, email_address: email, counselor_name: name, targets: units });
  if (prepared.error) {
    if (prepared.error.code === "23505") return { error: "Já existe uma conta com esse e-mail. Confira a equipe ou consulte a administração." };
    return { error: "Não foi possível preparar o convite. Confira as unidades selecionadas e tente novamente." };
  }

  const invitation = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: { club_counselor_invite: prepared.data },
  });
  if (invitation.error || !invitation.data.user) {
    return { error: "Não foi possível concluir o envio. Confira a lista da equipe e a configuração de e-mail do Supabase antes de repetir." };
  }

  const registered = await client.from("leadership_directory").select("id").eq("id", invitation.data.user.id).maybeSingle();
  if (registered.error || !registered.data) {
    return { error: "Não foi possível confirmar o cadastro de liderança. Consulte a administração." };
  }
  refreshLeadership();
  return { success: "Conselheiro cadastrado e convite enviado." };
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

export async function resendCounselorInvite(_: DirectoryState, form: FormData): Promise<DirectoryState> {
  const { client } = await requirePageAccess(panelRoles);
  const id = readField(form, "id");
  if (!isUuid(id)) return { error: "Cadastro indisponível." };
  const { data, error } = await client.from("leadership_directory").select("email, active, confirmed").eq("id", id).maybeSingle();
  if (error || !data?.email || !data.active || data.confirmed) return { error: "A conta não tem um convite pendente." };

  try {
    const admin = createInviteClient();
    const result = await admin.auth.admin.inviteUserByEmail(data.email, { redirectTo: appOrigin() + "/aceitar-convite" });
    if (result.error || result.data.user?.id !== id) return { error: "Não foi possível reenviar o convite." };
  } catch {
    return { error: "Não foi possível reenviar. Confira a configuração de convites no servidor." };
  }
  return { success: "Convite reenviado." };
}
