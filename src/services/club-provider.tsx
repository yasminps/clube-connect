"use client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { demo } from "@/data/demo";
import type { ClubData } from "@/types/club";
import { clubRepository } from "./club-repository";

const ClubContext = createContext({ data: demo, update: (_change: (data: ClubData) => ClubData) => {} });
export function ClubProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(demo);
  const [error, setError] = useState(false);
  const current = useRef(demo);
  useEffect(() => {
    current.current = clubRepository.read();
    setData(current.current);
  }, []);
  function update(change: (data: ClubData) => ClubData) {
    const next = change(current.current);
    current.current = next;
    setData(next);
    try { clubRepository.save(next); setError(false); }
    catch { setError(true); }
  }
  return <ClubContext.Provider value={{ data, update }}>
    {error && <p className="storage-error" role="alert">O navegador não conseguiu salvar as alterações. Elas estão disponíveis nesta sessão.</p>}
    {children}
  </ClubContext.Provider>;
}
export const useClub = () => useContext(ClubContext);