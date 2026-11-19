import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { requireClubAccess } from "./auth";
import { isUuid } from "@/lib/directory/validation";

export const directoryRoles = ["ADMIN", "DIRECTOR", "COUNSELOR"] as const;
export const memberPageSize = 15;
const historyPageSize = 12;
type Client = SupabaseClient<Database>;
export type HistoryFilters = { attendancePage?: string; pointsPage?: string };

function pageNumber(value: string | undefined) {
  const page = Number(value ?? 1);
  return Number.isSafeInteger(page) && page > 0 ? Math.min(page, 10000) : 1;
}

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

export async function getMemberDirectory(client: Client, filters: { q?: string; unit?: string; status?: string; page?: string }) {
  const q = typeof filters.q === "string" ? filters.q.trim().slice(0, 100) : "";
  const unitId = isUuid(filters.unit) ? filters.unit : "";
  const status = filters.status === "active" || filters.status === "inactive" ? filters.status : "";
  const page = pageNumber(filters.page);
  let query = client.from("members").select("id, name, unit_id, active, joined_on", { count: "exact" });
  if (q) query = query.ilike("name", "%" + q.replace(/[\\%_]/g, "\\$&") + "%");
  if (unitId) query = query.eq("unit_id", unitId);
  if (status) query = query.eq("active", status === "active");
  const from = (page - 1) * memberPageSize;
  const [members, units] = await Promise.all([
    query.order("name").order("id").range(from, from + memberPageSize - 1),
    client.from("units").select("id, name, active").order("name").order("id"),
  ]);
  if (members.error && members.error.code !== "PGRST103") throw members.error;
  if (units.error) throw units.error;
  return { members: members.data ?? [], count: members.count ?? 0, units: units.data, filters: { q, unit: unitId, status, page } };
}

export async function getUnitDirectory(client: Client) {
  const [units, staff, counselors] = await Promise.all([
    client.from("unit_directory").select("*").order("name").order("id"),
    client.from("unit_staff").select("unit_id, user_id").order("unit_id").order("user_id"),
    client.from("counselor_directory").select("*").order("display_name").order("id"),
  ]);
  if (units.error) throw units.error;
  if (staff.error) throw staff.error;
  if (counselors.error) throw counselors.error;
  return { units: units.data, staff: staff.data, counselors: counselors.data };
}

export async function getMemberDetail(client: Client, id: string) {
  if (!isUuid(id)) return null;
  const { data: member, error } = await client.from("members").select("id, name, unit_id, active, joined_on").eq("id", id).maybeSingle();
  if (error) throw error;
  return member;
}

export async function getMemberHistory(client: Client, memberId: string, filters: HistoryFilters = {}) {
  const attendancePage = pageNumber(filters.attendancePage);
  const pointsPage = pageNumber(filters.pointsPage);
  const attendanceFrom = (attendancePage - 1) * historyPageSize;
  const pointsFrom = (pointsPage - 1) * historyPageSize;
  const [attendance, points, present] = await Promise.all([
    client.from("attendance").select("event_id, status, updated_at, event:events(title, starts_at)", { count: "exact" }).eq("member_id", memberId).order("updated_at", { ascending: false }).order("event_id").range(attendanceFrom, attendanceFrom + historyPageSize - 1),
    client.from("point_transactions").select("id, amount, reason, created_at", { count: "exact" }).eq("member_id", memberId).eq("category", "INDIVIDUAL").order("created_at", { ascending: false }).order("id").range(pointsFrom, pointsFrom + historyPageSize - 1),
    client.from("attendance").select("event_id", { count: "exact", head: true }).eq("member_id", memberId).eq("status", "PRESENT"),
  ]);
  if (attendance.error && attendance.error.code !== "PGRST103") throw attendance.error;
  if (points.error && points.error.code !== "PGRST103") throw points.error;
  if (present.error) throw present.error;
  return {
    attendance: attendance.data ?? [], points: points.data ?? [], present: present.count ?? 0,
    attendancePage, pointsPage,
    attendanceNext: attendancePage * historyPageSize < (attendance.count ?? 0),
    pointsNext: pointsPage * historyPageSize < (points.count ?? 0),
  };
}
