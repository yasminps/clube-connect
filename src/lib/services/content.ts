import "server-only";

import { requireClubAccess } from "./auth";

export async function listEvents() {
  const { client } = await requireClubAccess();
  const { data, error } = await client.from("events").select("*").order("starts_at");
  if (error) throw error;
  return data;
}

export async function listChallenges() {
  const { client } = await requireClubAccess();
  const { data, error } = await client.from("challenges").select("*").order("deadline");
  if (error) throw error;
  return data;
}

export async function listAnnouncements() {
  const { client } = await requireClubAccess();
  const { data, error } = await client.from("announcements").select("*").order("published_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data;
}