import type { ClubData } from "@/types/club";
import { demoDate } from "@/data/demo";

export const rankUnits = (units: ClubData["units"]) => [...units].sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, "pt-BR"));
export const nextEvent = (events: ClubData["events"]) => [...events].filter(event => event.date >= demoDate).sort((a,b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
export const latestAttendance = ({ attendance, events }: ClubData) =>
  [...events].filter(event => event.kind === "Reunião" && attendance.some(record => record.eventId === event.id)).sort((a,b) => (b.date + b.time).localeCompare(a.date + a.time))[0];