"use server";

import { suggestValuationRates, type ValuationRates } from "@/lib/claude";
import { MOCK_ENTREPRENEUR_SECTOR } from "@/lib/investors";
import { createClient } from "@/lib/supabase/server";

const PROJECTION_YEARS = 3;
const MAX_CASH_FLOW = 1e12;

export type Valuation = {
  valuation: number;
  rates: ValuationRates;
  sector: string;
  readinessScore: number;
  presentValues: number[]; // PV of each year's cash flow
  terminalValue: number;
  presentTerminalValue: number;
};

export type ValuationResult = { ok: true; result: Valuation } | { ok: false; error: string };

// Three-year DCF with a Gordon Growth terminal value: TV = CF3 * (1 + g) / (r - g), discounted at year 3.
function discountedCashFlow(cashFlows: number[], r: number, g: number) {
  const presentValues = cashFlows.map((cf, i) => cf / (1 + r) ** (i + 1));
  const lastCashFlow = cashFlows[cashFlows.length - 1];
  const terminalValue = (lastCashFlow * (1 + g)) / (r - g);
  const presentTerminalValue = terminalValue / (1 + r) ** cashFlows.length;
  const valuation = presentValues.reduce((sum, pv) => sum + pv, 0) + presentTerminalValue;
  return { presentValues, terminalValue, presentTerminalValue, valuation };
}

export async function calculateValuation(cashFlows: number[]): Promise<ValuationResult> {
  if (
    !Array.isArray(cashFlows) ||
    cashFlows.length !== PROJECTION_YEARS ||
    !cashFlows.every((cf) => typeof cf === "number" && Number.isFinite(cf) && Math.abs(cf) <= MAX_CASH_FLOW)
  ) {
    return { ok: false, error: "Enter a projected free cash flow for each of the 3 years." };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "You must be logged in to calculate a valuation." };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("readiness_score")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) return { ok: false, error: `Could not load your readiness score: ${profileError.message}` };

  const readinessScore: number = profile?.readiness_score ?? 0;
  const sector = MOCK_ENTREPRENEUR_SECTOR;

  let rates: ValuationRates;
  try {
    rates = await suggestValuationRates(readinessScore, sector);
  } catch (error) {
    console.error("suggestValuationRates failed", error);
    return { ok: false, error: "The AI could not suggest valuation rates. Please try again in a moment." };
  }

  const dcf = discountedCashFlow(cashFlows, rates.discount_rate, rates.terminal_growth_rate);

  return { ok: true, result: { ...dcf, rates, sector, readinessScore } };
}
