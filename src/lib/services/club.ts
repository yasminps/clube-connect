import "server-only";

import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import type { Insert, Row } from "@/types/database";
import { requireClubAccess } from "./auth";

const leadership = ["ADMIN", "DIRECTOR"] as const;
const attendanceStaff = [...leadership, "COUNSELOR"] as const;

function unwrap<T>(response: PostgrestSingleResponse<T>): T {
  if (response.error) throw response.error;
  return response.data;
}

export async function createEvent(input: Pick<Insert<"events">, "unit_id" | "title" | "kind" | "starts_at" | "ends_at" | "location" | "description">) {
  const { client } = await requireClubAccess(leadership);
  return unwrap(await client.from("events").insert(input).select().single());
}

export async function listEventParticipants(eventId: string, unitId?: string) {
  const { client } = await requireClubAccess(attendanceStaff);
  const event = unwrap(await client.from("events").select("unit_id").eq("id", eventId).single());
  if (event.unit_id && unitId && event.unit_id !== unitId) return [];

  let query = client.from("members").select("id, name, unit_id").eq("active", true);
  const scopedUnit = event.unit_id ?? unitId;
  if (scopedUnit) query = query.eq("unit_id", scopedUnit);
  return unwrap(await query.order("name"));
}

export async function listAttendanceHistory(filter: { eventId?: string; memberId?: string } = {}) {
  const { client } = await requireClubAccess();
  let query = client.from("attendance").select("event_id, member_id, unit_id, status, justification, updated_at");
  if (filter.eventId) query = query.eq("event_id", filter.eventId);
  if (filter.memberId) query = query.eq("member_id", filter.memberId);
  return unwrap(await query.order("updated_at", { ascending: false }));
}

export async function recordAttendance(
  eventId: string,
  entries: Array<Pick<Row<"attendance">, "member_id" | "status" | "justification">>,
) {
  const { client } = await requireClubAccess(attendanceStaff);
  if (!entries.length) return [];
  return unwrap(await client.rpc("save_attendance", {
    event: eventId,
    entries: entries.map(({ member_id, status, justification }) => ({ member_id, status, justification })),
  }));
}

type PointFields = Pick<Insert<"point_transactions">, "category" | "member_id" | "unit_id" | "amount" | "reason" | "origin" | "event_id" | "challenge_id" | "reversal_of">;

export async function postPoints(input: PointFields) {
  const { client } = await requireClubAccess(leadership);
  return unwrap(await client.from("point_transactions").insert(input).select().single());
}

export async function listUnitRanking() {
  const { client } = await requireClubAccess();
  return unwrap(await client.from("unit_ranking").select("unit_id, name, color, points, position").order("position").order("name"));
}