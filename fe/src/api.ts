import { Campaign, Donation, DonationStatus, OverviewStats, PaginatedResult } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {})
    },
    ...init
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { error?: unknown };
      if (typeof body.error === "string") {
        message = body.error;
      }
    } catch {
      // Ignore parse errors and keep generic message.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function getOverview(): Promise<OverviewStats> {
  return request<OverviewStats>("/stats/overview");
}

export async function listCampaigns(search = ""): Promise<PaginatedResult<Campaign>> {
  const query = new URLSearchParams({ limit: "20", sortBy: "createdAt", sortDir: "desc" });
  if (search.trim()) {
    query.set("search", search.trim());
  }
  return request<PaginatedResult<Campaign>>(`/campaigns?${query.toString()}`);
}

export async function createCampaign(payload: {
  code: string;
  name: string;
  description?: string;
  targetAmount: number;
  isActive?: boolean;
}): Promise<Campaign> {
  return request<Campaign>("/campaigns", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function listDonations(filters?: {
  campaignCode?: string;
  status?: DonationStatus | "";
  search?: string;
}): Promise<PaginatedResult<Donation>> {
  const query = new URLSearchParams({ limit: "30", sortBy: "createdAt", sortDir: "desc" });

  if (filters?.campaignCode?.trim()) {
    query.set("campaignCode", filters.campaignCode.trim());
  }
  if (filters?.status) {
    query.set("status", filters.status);
  }
  if (filters?.search?.trim()) {
    query.set("search", filters.search.trim());
  }

  return request<PaginatedResult<Donation>>(`/donations?${query.toString()}`);
}

export async function createDonation(payload: {
  donorName: string;
  donorEmail: string;
  amount: number;
  campaignCode: string;
  note?: string;
}): Promise<Donation> {
  return request<Donation>("/donations", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateDonationStatus(id: string, status: DonationStatus): Promise<Donation> {
  return request<Donation>(`/donations/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}
