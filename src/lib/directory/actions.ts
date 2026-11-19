"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requirePageAccess } from "@/lib/auth/page-access";
import { panelRoles } from "@/lib/auth/access";
import { directoryRoles } from "@/lib/services/directory";
import { isDate, isUuid, readField, unitColors, type DirectoryState } from "./validation";
import { unitSymbolLimit, unitSymbolMime } from "@/features/directory/unit-symbol-rules";

function message(error: { code: string }): DirectoryState {
  switch (error.code) {
    case "23505": return { error: "Já existe um registro com essa identificação ou vínculo." };
    case "23514": return { error: "Verifique os dados, a situação da unidade e o papel da conta selecionada." };
    case "42501": return { error: "Sua conta não tem permissão para esta operação." };
    default: return { error: "Não foi possível salvar. Tente novamente." };
  }
}
const unavailable = { error: "Registro indisponível para esta operação." };
const invalidSymbol = { error: "Escolha uma imagem válida em PNG, JPG ou WebP de até 200 KB." };

function matchesImage(bytes: Buffer, type: string) {
  if (type === "image/png") return bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a";
  if (type === "image/jpeg") return bytes.subarray(0, 3).toString("hex") === "ffd8ff";
  return bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
}

function refreshDirectory() {
  revalidatePath("/membros");
  revalidatePath("/membros/[id]", "page");
  revalidatePath("/conselheiro");
  revalidatePath("/conselheiro/membros");
  revalidatePath("/conselheiro/membros/[id]", "page");
  revalidatePath("/unidades");
  revalidatePath("/relatorios");
  revalidatePath("/");
  revalidatePath("/diretoria");
}

export async function saveUnit(_: DirectoryState, form: FormData): Promise<DirectoryState> {
  const { client } = await requirePageAccess(panelRoles);
  const id = readField(form, "id");
  const name = readField(form, "name");
  const description = readField(form, "description");
  const color = readField(form, "color");
  if ((id && !isUuid(id)) || !name || name.length > 100 || description.length > 600 || !unitColors.some(value => value === color)) {
    return { error: "Confira o nome, a descrição e a cor." };
  }
  const file = form.get("symbol");
  let symbol: string | null | undefined;
  if (file instanceof File && file.size > 0) {
    if (file.size > unitSymbolLimit || !unitSymbolMime.some(type => type === file.type)) return invalidSymbol;
    const bytes = Buffer.from(await file.arrayBuffer());
    if (!matchesImage(bytes, file.type)) return invalidSymbol;
    symbol = "data:" + file.type + ";base64," + bytes.toString("base64");
  } else if (form.has("removeSymbol")) {
    symbol = null;
  }
  const fields = { name, description, color, ...(symbol === undefined ? {} : { symbol_image: symbol }) };
  const result = id
    ? await client.from("units").update(fields).eq("id", id).select("id").maybeSingle()
    : await client.from("units").insert({ ...fields, code: "uni-" + randomUUID() }).select("id").maybeSingle();
  if (result.error) return message(result.error);
  if (!result.data) return unavailable;
  refreshDirectory();
  return { success: id ? "Unidade atualizada." : "Unidade cadastrada." };
}

export async function setDirectoryStatus(_: DirectoryState, form: FormData): Promise<DirectoryState> {
  const kind = readField(form, "kind");
  const id = readField(form, "id");
  const value = readField(form, "active");
  if ((kind !== "unit" && kind !== "member") || !isUuid(id) || !["true", "false"].includes(value)) return unavailable;
  const { client } = await requirePageAccess(kind === "unit" ? panelRoles : directoryRoles);
  const result = await client.from(kind === "unit" ? "units" : "members")
    .update({ active: value === "true" }).eq("id", id).select("id").maybeSingle();
  if (result.error) return message(result.error);
  if (!result.data) return unavailable;
  refreshDirectory();
  return { success: value === "true" ? "Registro ativado." : "Registro desativado." };
}

export async function saveMember(_: DirectoryState, form: FormData): Promise<DirectoryState> {
  const { client } = await requirePageAccess(directoryRoles);
  const id = readField(form, "id");
  const name = readField(form, "name");
  const unit = readField(form, "unit");
  const joined = readField(form, "joined");
  if ((id && !isUuid(id)) || !name || name.length > 100 || !isUuid(unit) || !isDate(joined)) {
    return { error: "Informe o nome, a unidade e uma data de ingresso válida." };
  }
  const fields = { name, unit_id: unit, joined_on: joined };
  const result = id
    ? await client.from("members").update(fields).eq("id", id).select("id").maybeSingle()
    : await client.from("members").insert(fields).select("id").maybeSingle();
  if (result.error) return message(result.error);
  if (!result.data) return unavailable;
  refreshDirectory();
  return { success: id ? "Cadastro atualizado." : "Membro cadastrado." };
}

export async function setCounselor(_: DirectoryState, form: FormData): Promise<DirectoryState> {
  const { client } = await requirePageAccess(panelRoles);
  const unitId = readField(form, "unit");
  const userId = readField(form, "user");
  const operation = readField(form, "operation");
  if (!isUuid(unitId) || !isUuid(userId) || !["assign", "remove"].includes(operation)) return unavailable;
  const result = operation === "assign"
    ? await client.from("unit_staff").insert({ unit_id: unitId, user_id: userId }).select("user_id").maybeSingle()
    : await client.from("unit_staff").delete().eq("unit_id", unitId).eq("user_id", userId).select("user_id").maybeSingle();
  if (result.error) return message(result.error);
  if (!result.data) return unavailable;
  refreshDirectory();
  return { success: operation === "assign" ? "Conselheiro vinculado." : "Vínculo removido." };
}

export async function setMemberAccount(_: DirectoryState, form: FormData): Promise<DirectoryState> {
  const { client } = await requirePageAccess(["ADMIN"]);
  const id = readField(form, "id");
  const userId = readField(form, "user");
  if (!isUuid(id) || (userId && !isUuid(userId))) return { error: "Informe o UUID de uma conta com papel MEMBER." };
  const result = await client.from("members").update({ user_id: userId || null }).eq("id", id).select("id").maybeSingle();
  if (result.error) return message(result.error);
  if (!result.data) return unavailable;
  refreshDirectory();
  revalidatePath("/minha-area");
  return { success: userId ? "Conta vinculada." : "Vínculo removido." };
}

export async function saveClubSettings(_: DirectoryState, form: FormData): Promise<DirectoryState> {
  const { client } = await requirePageAccess(panelRoles);
  const name = readField(form, "name");
  const description = readField(form, "description");
  if (!name || name.length > 60 || description.length > 300) return { error: "Confira o nome e a descrição do clube." };
  const result = await client.from("club_settings").update({ name, description }).eq("id", 1).select("id").maybeSingle();
  if (result.error) return message(result.error);
  if (!result.data) return unavailable;
  revalidatePath("/", "layout");
  return { success: "Configurações atualizadas." };
}
