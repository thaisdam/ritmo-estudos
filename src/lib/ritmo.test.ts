import { describe, it, expect } from "vitest";
import { PLANOS, gerarAgendaSemana, formatBRL, maskWhatsapp } from "./ritmo";

const segunda = new Date(2026, 9, 26); // 26/10/2026, segunda

describe("regras do Ritmo", () => {
  it("preços dos planos", () => {
    expect(PLANOS.essencial.preco).toBe(29.9);
    expect(PLANOS.foco.preco).toBe(49.9);
    expect(PLANOS.intensivo.preco).toBe(89.9);
  });
  it("formata em reais", () => {
    expect(formatBRL(49.9).replace(/\s/g, " ")).toBe("R$ 49,90");
  });
  it("Essencial: plano na segunda e check-in na sexta", () => {
    const r = gerarAgendaSemana([{ id: "a", plano: "essencial" }], segunda);
    expect(r).toEqual([
      { assinante_id: "a", tipo: "plano_semanal", data: "2026-10-26" },
      { assinante_id: "a", tipo: "check_in", data: "2026-10-30" },
    ]);
  });
  it("Foco: check-ins seg, qua, sex", () => {
    const r = gerarAgendaSemana([{ id: "a", plano: "foco" }], segunda).filter((e) => e.tipo === "check_in");
    expect(r.map((e) => e.data)).toEqual(["2026-10-26", "2026-10-28", "2026-10-30"]);
  });
  it("Intensivo: check-ins seg a sex e chamada na quarta", () => {
    const r = gerarAgendaSemana([{ id: "a", plano: "intensivo" }], segunda);
    expect(r.filter((e) => e.tipo === "check_in")).toHaveLength(5);
    expect(r.filter((e) => e.tipo === "chamada").map((e) => e.data)).toEqual(["2026-10-28"]);
  });
  it("máscara de WhatsApp", () => {
    expect(maskWhatsapp("34999999999")).toBe("(34) 99999-9999");
  });
});
