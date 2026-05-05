import { Campaign, Donation, DonationStatus, OverviewStats, PaginatedResult } from "./types";
import {
  mockCreateCampaign,
  mockCreateDonation,
  mockGetOverview,
  mockListCampaigns,
  mockListDonations,
  mockUpdateDonationStatus
} from "./mockApi";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080/api";
const AUTH_EMAIL = import.meta.env.VITE_AUTH_EMAIL || "superadmin@charity.local";
const AUTH_PASSWORD = import.meta.env.VITE_AUTH_PASSWORD || "Demo@123";
const DEFAULT_BRANCH_ID = import.meta.env.VITE_DEFAULT_BRANCH_ID || "660000000000000000000002";
const USE_MOCK = (import.meta.env.VITE_USE_MOCK || "false").toString().toLowerCase() === "true";
const TOKEN_KEY = "charity_fe_access_token";

export const runtimeConfig = {
  apiBase: API_BASE,
  useMock: USE_MOCK,
  authEmail: AUTH_EMAIL,
  defaultBranchId: DEFAULT_BRANCH_ID
};

if (USE_MOCK) {
  console.warn("[FE] Dang chay MOCK mode. Dat VITE_USE_MOCK=false de su dung backend that.");
}

interface BackendAuthResponse {
  success: boolean;
  data: {
    accessToken: string;
    expiresIn: number;
  };
}

interface BackendCampaign {
  _id: string;
  code: string;
  title?: string;
  name?: string;
  description?: string;
  targetAmount: number;
  currentAmount?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

type BackendPaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

interface BackendDonation {
  _id: string;
  donorSnapshot?: {
    fullName?: string;
    email?: string;
  };
  campaignSnapshot?: {
    code?: string;
    title?: string;
  };
  amount: number;
  paymentStatus: BackendPaymentStatus;
  message?: string;
  donatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface BackendDonor {
  _id: string;
}

async function loginDemoUser(): Promise<string> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: AUTH_EMAIL, password: AUTH_PASSWORD })
  });

  if (!response.ok) {
    throw new Error(`Khong dang nhap duoc backend demo (${response.status}). Hay chay seed user truoc.`);
  }

  const body = (await response.json()) as BackendAuthResponse;
  const token = body.data.accessToken;
  localStorage.setItem(TOKEN_KEY, token);
  return token;
}

async function getAccessToken(): Promise<string> {
  const existingToken = localStorage.getItem(TOKEN_KEY);
  if (existingToken) {
    return existingToken;
  }

  return loginDemoUser();
}

async function request<T>(path: string, init?: RequestInit, retried = false): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {})
    },
    ...init
  });

  if (response.status === 401 && !retried) {
    localStorage.removeItem(TOKEN_KEY);
    return request<T>(path, init, true);
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { error?: unknown; message?: unknown };
      if (typeof body.error === "string") {
        message = body.error;
      } else if (typeof body.message === "string") {
        message = body.message;
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

function mapCampaign(row: BackendCampaign): Campaign {
  return {
    _id: row._id,
    code: row.code,
    name: row.title ?? row.name ?? row.code,
    description: row.description,
    targetAmount: Number(row.targetAmount ?? 0),
    currentAmount: Number(row.currentAmount ?? 0),
    isActive: row.status === "ACTIVE",
    status: row.status ?? "DRAFT",
    startDate: row.startDate,
    endDate: row.endDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function mapDonation(row: BackendDonation): Donation {
  return {
    _id: row._id,
    donorName: row.donorSnapshot?.fullName ?? "Nguoi ung ho",
    donorEmail: row.donorSnapshot?.email ?? "",
    amount: Number(row.amount ?? 0),
    campaignCode: row.campaignSnapshot?.code ?? "",
    note: row.message,
    status: mapPaymentStatusToUi(row.paymentStatus),
    createdAt: row.donatedAt ?? row.createdAt,
    updatedAt: row.updatedAt
  };
}

function mapOverview(row: OverviewStats): OverviewStats {
  return {
    ...row,
    donations: {
      ...row.donations,
      byStatus: row.donations.byStatus.map((statusRow) => ({
        ...statusRow,
        status: mapPaymentStatusToUi(statusRow.status as unknown as BackendPaymentStatus)
      }))
    }
  };
}

function mapPaymentStatusToUi(status: BackendPaymentStatus): DonationStatus {
  if (status === "SUCCESS") return "verified";
  if (status === "FAILED" || status === "REFUNDED") return "rejected";
  return "pending";
}

function mapUiStatusToPaymentStatus(status: DonationStatus): BackendPaymentStatus {
  if (status === "verified") return "SUCCESS";
  if (status === "rejected") return "FAILED";
  return "PENDING";
}

export async function getOverview(): Promise<OverviewStats> {
  if (USE_MOCK) {
    return mockGetOverview();
  }
  return mapOverview(await request<OverviewStats>("/stats/overview"));
}

export async function listCampaigns(search = ""): Promise<PaginatedResult<Campaign>> {
  if (USE_MOCK) {
    return mockListCampaigns(search);
  }
  const query = new URLSearchParams({ limit: "20", sortBy: "createdAt", sortDir: "desc" });
  if (search.trim()) {
    query.set("search", search.trim());
  }
  const result = await request<PaginatedResult<BackendCampaign>>(`/campaigns?${query.toString()}`);
  return {
    ...result,
    data: result.data.map(mapCampaign)
  };
}

export async function createCampaign(payload: {
  code: string;
  name: string;
  description?: string;
  targetAmount: number;
  isActive?: boolean;
}): Promise<Campaign> {
  if (USE_MOCK) {
    return mockCreateCampaign(payload);
  }
  const status = payload.isActive === false ? "PAUSED" : "ACTIVE";
  const result = await request<BackendCampaign>("/campaigns", {
    method: "POST",
    body: JSON.stringify({
      branchId: DEFAULT_BRANCH_ID,
      code: payload.code,
      title: payload.name,
      description: payload.description,
      targetAmount: payload.targetAmount,
      status,
      location: {
        province: "Hai Phong",
        address: "Demo frontend"
      }
    })
  });
  return mapCampaign(result);
}

export async function listDonations(filters?: {
  campaignCode?: string;
  status?: DonationStatus | "";
  search?: string;
}): Promise<PaginatedResult<Donation>> {
  if (USE_MOCK) {
    return mockListDonations(filters);
  }
  const query = new URLSearchParams({ limit: "100", sortBy: "donatedAt", sortDir: "desc" });

  if (filters?.status) {
    query.set("paymentStatus", mapUiStatusToPaymentStatus(filters.status));
  }

  const result = await request<PaginatedResult<BackendDonation>>(`/donations?${query.toString()}`);
  const campaignCode = filters?.campaignCode?.trim().toLowerCase();
  const search = filters?.search?.trim().toLowerCase();
  const rows = result.data
    .map(mapDonation)
    .filter((donation) => !campaignCode || donation.campaignCode.toLowerCase() === campaignCode)
    .filter((donation) => {
      if (!search) return true;
      return [
        donation.donorName,
        donation.donorEmail,
        donation.note,
        donation.campaignCode
      ].some((value) => value?.toLowerCase().includes(search));
    });

  return {
    data: rows,
    pagination: {
      ...result.pagination,
      total: rows.length,
      totalPages: rows.length === 0 ? 0 : Math.ceil(rows.length / result.pagination.limit)
    }
  };
}

export async function createDonation(payload: {
  donorName: string;
  donorEmail: string;
  amount: number;
  campaignCode: string;
  note?: string;
}): Promise<Donation> {
  if (USE_MOCK) {
    return mockCreateDonation(payload);
  }
  const campaigns = await listCampaigns(payload.campaignCode);
  const campaign = campaigns.data.find((item) => item.code === payload.campaignCode);
  if (!campaign) {
    throw new Error(`Khong tim thay chien dich ${payload.campaignCode}`);
  }

  const donor = await request<BackendDonor>("/donors", {
    method: "POST",
    body: JSON.stringify({
      fullName: payload.donorName,
      email: payload.donorEmail,
      donorType: "INDIVIDUAL"
    })
  });

  const result = await request<BackendDonation>("/donations", {
    method: "POST",
    body: JSON.stringify({
      campaignId: campaign._id,
      donorId: donor._id,
      amount: payload.amount,
      paymentMethod: "BANK_TRANSFER",
      paymentStatus: "PENDING",
      message: payload.note,
      transactionCode: `FE-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    })
  });
  return mapDonation(result);
}

export async function updateDonationStatus(id: string, status: DonationStatus): Promise<Donation> {
  if (USE_MOCK) {
    return mockUpdateDonationStatus(id, status);
  }
  const result = await request<BackendDonation>(`/donations/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ paymentStatus: mapUiStatusToPaymentStatus(status) })
  });
  return mapDonation(result);
}
