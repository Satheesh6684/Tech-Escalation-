export type MediaType = "image" | "video" | "";

export interface Escalation {
  recordId: string;
  createdAt: string; // ISO string
  city: string;
  store: string;
  riderId: string;
  issue: "Incomplete Order";
  mediaType: MediaType;
  mediaUrl: string;
}

export interface EscalationInput {
  city: string;
  store: string;
  riderId: string;
  mediaType: MediaType;
  mediaUrl: string;
}

export interface ApiError {
  error: string;
}

/**
 * Standard/master City + Store data, sourced from a dedicated tab in the
 * same Google Sheet (see lib/googleSheets.ts). Stores are grouped by city
 * so the Store dropdown can be filtered to the selected City.
 */
export interface MasterData {
  cities: string[];
  storesByCity: Record<string, string[]>;
}
