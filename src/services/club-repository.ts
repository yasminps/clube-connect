import { demo } from "@/data/demo";
import type { ClubRepository } from "@/types/club";

const key = "clube-connect-demo-v1";
export const clubRepository: ClubRepository = {
  read() {
    try {
      const saved = window.localStorage.getItem(key);
      return saved ? JSON.parse(saved) : demo;
    } catch {
      return demo;
    }
  },
  save(data) {
    window.localStorage.setItem(key, JSON.stringify(data));
  },
};