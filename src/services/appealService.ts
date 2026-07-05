import type { Records } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://api.example.com";

export type SubmitAppealResult = {
  submitted: boolean;
  appealId?: string;
};

export async function submitAppeal(record: Records, docket: string): Promise<SubmitAppealResult> {
  const response = await fetch(`${API_BASE_URL}/appeals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ record, docket }),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit appeal: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return { submitted: true, appealId: data.appealId };
}
