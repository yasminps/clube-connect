import type { ClubData } from "@/types/club";

export const demoDate = "2026-11-19";
export const demo: ClubData = {
  settings: { name: "Clube Connect", description: "Clube de adolescentes e suas unidades." },
  units: [
    { id: "orion", name: "Órion", counselor: "Conselheiro Alfa", points: 2840, color: "purple" },
    { id: "phoenix", name: "Phoenix", counselor: "Conselheira Beta", points: 2510, color: "orange" },
    { id: "atlas", name: "Atlas", counselor: "Conselheiro Gama", points: 2280, color: "blue" },
    { id: "lumen", name: "Lúmen", counselor: "Conselheira Delta", points: 1960, color: "green" },
  ],
  members: Array.from({ length: 48 }, (_, index) => ({
    id: "m" + (index + 1),
    name: ["Alex", "Dani", "Cris", "Noa", "Sam", "Ari", "Luca", "Isa", "Teo", "Lu", "Kim", "Robin"][index % 12] + " · " + ["Alfa", "Beta", "Gama", "Delta"][Math.floor(index / 12)],
    unitId: ["orion", "phoenix", "atlas", "lumen"][Math.floor(index / 12)],
    since: "2026-07-04", status: index >= 46 ? "Inativo" : "Ativo",
  })),
  events: [
    { id: "e1", title: "Reunião geral", date: "2026-11-14", time: "15:00", location: "Sede do clube", kind: "Reunião" },
    { id: "e2", title: "Encontro de Unidades", date: "2026-11-21", time: "15:00", location: "Sede do clube", kind: "Evento" },
    { id: "e3", title: "Oficina de liderança", date: "2026-11-28", time: "14:00", location: "Sala de atividades", kind: "Atividade" },
  ],
  attendance: [{ eventId: "e1", memberIds: Array.from({ length: 42 }, (_, index) => "m" + (index + 1)) }],
  challenges: [
    { id: "c1", title: "Missão Solidária", description: "Organize uma ação de arrecadação com sua unidade.", deadline: "2026-11-28", points: 300, participants: ["orion", "atlas"] },
    { id: "c2", title: "Trilha do Conhecimento", description: "Conclua o quiz de conhecimentos em equipe.", deadline: "2026-12-05", points: 200, participants: ["phoenix"] },
  ],
  notices: [
    { id: "n1", title: "Orientações para o Encontro de Unidades", body: "Cheguem às 14h45 com a identificação da unidade. Os conselheiros receberão as equipes na entrada.", date: "2026-11-18", important: true },
    { id: "n2", title: "Inscrições para a oficina de liderança", body: "Confirme a participação da sua unidade com o conselheiro até 25 de novembro.", date: "2026-11-16", important: false },
  ],
};

export const pointHistory = [
  { month: "Jun", orion: 480, phoenix: 410, atlas: 300, lumen: 250 },
  { month: "Jul", orion: 910, phoenix: 670, atlas: 530, lumen: 460 },
  { month: "Ago", orion: 1250, phoenix: 1100, atlas: 780, lumen: 650 },
  { month: "Set", orion: 1740, phoenix: 1380, atlas: 1200, lumen: 980 },
  { month: "Out", orion: 2180, phoenix: 1940, atlas: 1670, lumen: 1390 },
  { month: "Nov", orion: 2840, phoenix: 2510, atlas: 2280, lumen: 1960 },
];