export type Member = { id: string; name: string; unitId: string; since: string; status: "Ativo" | "Inativo" };
export type Unit = { id: string; name: string; counselor: string; points: number; color: string };
export type ClubEvent = { id: string; title: string; date: string; time: string; location: string; kind: "Reunião" | "Evento" | "Atividade" };
export type Challenge = { id: string; title: string; description: string; deadline: string; points: number; participants: string[] };
export type Notice = { id: string; title: string; body: string; date: string; important: boolean };
export type Attendance = { eventId: string; memberIds: string[] };
export type ClubData = {
  members: Member[]; units: Unit[]; events: ClubEvent[]; challenges: Challenge[]; notices: Notice[];
  attendance: Attendance[]; settings: { name: string; description: string };
};
export type ClubRepository = { read(): ClubData; save(data: ClubData): void };