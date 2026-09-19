export type SearchCategory = "SUBSCRIBER" | "ROUTER" | "CPE" | "PAYMENT" | "TICKET";

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: SearchCategory;
  statusPill: string;
  statusColor: string;
  navigationUrl: string;
  metadata: Record<string, string>;
}

export interface OmniSearchResponse {
  query: string;
  executionTimeMs: number;
  results: SearchResultItem[];
}