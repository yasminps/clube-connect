import "server-only";

import { requireClubAccess } from "./auth";

export async function listUnits() {
  const { client } = await requireClubAccess();
  const { data, error } = await client.from("units").select("id, code, name, color, active").order("name");
  if (error) throw error;
  return data;
}

export async function listMembers(unitId?: string) {
  const { client } = await requireClubAccess();
  let query = client.from("members").select("id, name, unit_id, active, joined_on");
  if (unitId) query = query.eq("unit_id", unitId);
  const { data, error } = await query.order("name");
  if (error) throw error;
  return data;
}