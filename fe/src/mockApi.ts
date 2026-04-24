import { Campaign, Donation, DonationStatus, OverviewStats, PaginatedResult } from "./types";

function nowIso(): string {
  return new Date().toISOString();
}

function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
}

const baseCampaigns: Campaign[] = [
  {
    _id: "camp-1",
    code: "hoc-bong-2026",
    name: "Hoc bong sinh vien vuot kho",
    description: "Ho tro hoc phi va sinh hoat phi cho sinh vien co hoan canh kho khan.",
    targetAmount: 50000000,
    isActive: true,
    startDate: "2026-01-01T00:00:00.000Z",
    endDate: "2026-12-31T00:00:00.000Z",
    createdAt: "2026-01-02T10:00:00.000Z",
    updatedAt: "2026-01-02T10:00:00.000Z"
  },
  {
    _id: "camp-2",
    code: "y-te-cong-dong",
    name: "Tu thuoc cho tram y te xa",
    description: "Bo sung vat tu va thiet bi y te co ban cho cac tram y te vung xa.",
    targetAmount: 80000000,
    isActive: true,
    startDate: "2026-02-01T00:00:00.000Z",
    endDate: "2026-10-31T00:00:00.000Z",
    createdAt: "2026-02-03T09:00:00.000Z",
    updatedAt: "2026-02-03T09:00:00.000Z"
  },
  {
    _id: "camp-3",
    code: "cuu-tro-mien-trung",
    name: "Cuu tro mien Trung sau bao lu",
    description: "Ho tro luong thuc, nuoc sach va sua chua nha cho ho dan bi anh huong.",
    targetAmount: 200000000,
    isActive: true,
    startDate: "2026-03-01T00:00:00.000Z",
    endDate: "2026-09-30T00:00:00.000Z",
    createdAt: "2026-03-05T07:30:00.000Z",
    updatedAt: "2026-03-05T07:30:00.000Z"
  },
  {
    _id: "camp-4",
    code: "me-va-be",
    name: "Dinh duong cho me va be",
    description: "Cung cap sua va goi dinh duong cho phu nu mang thai va tre nho.",
    targetAmount: 60000000,
    isActive: true,
    startDate: "2026-01-15T00:00:00.000Z",
    endDate: "2026-11-30T00:00:00.000Z",
    createdAt: "2026-01-16T08:00:00.000Z",
    updatedAt: "2026-01-16T08:00:00.000Z"
  },
  {
    _id: "camp-5",
    code: "an-sinh-xa-hoi",
    name: "An sinh xa hoi khu pho",
    description: "Ho tro khan cap tien tro cap va nhu yeu pham cho ho kho khan.",
    targetAmount: 120000000,
    isActive: false,
    startDate: "2025-09-01T00:00:00.000Z",
    endDate: "2026-02-28T00:00:00.000Z",
    createdAt: "2025-09-02T08:30:00.000Z",
    updatedAt: "2026-03-01T08:30:00.000Z"
  },
  {
    _id: "camp-6",
    code: "nuoc-sach-nong-thon",
    name: "Nuoc sach cho truong hoc nong thon",
    description: "Xay dung he thong loc nuoc va bon chua nuoc cho truong hoc vung sau.",
    targetAmount: 90000000,
    isActive: true,
    startDate: "2026-04-01T00:00:00.000Z",
    endDate: "2026-12-15T00:00:00.000Z",
    createdAt: "2026-04-02T11:45:00.000Z",
    updatedAt: "2026-04-02T11:45:00.000Z"
  }
];

const baseDonations: Donation[] = [
  {
    _id: "don-1",
    donorName: "Nguyen Van An",
    donorEmail: "an.nguyen@example.com",
    amount: 250000,
    campaignCode: "hoc-bong-2026",
    note: "Ho tro hoc bong thang 4",
    status: "verified",
    createdAt: "2026-04-02T09:10:00.000Z",
    updatedAt: "2026-04-02T09:10:00.000Z"
  },
  {
    _id: "don-2",
    donorName: "Tran Thi Bich",
    donorEmail: "bich.tran@example.com",
    amount: 150000,
    campaignCode: "y-te-cong-dong",
    note: "Ung ho mua thuoc",
    status: "pending",
    createdAt: "2026-04-03T03:15:00.000Z",
    updatedAt: "2026-04-03T03:15:00.000Z"
  },
  {
    _id: "don-3",
    donorName: "Le Quang Huy",
    donorEmail: "huy.le@example.com",
    amount: 500000,
    campaignCode: "cuu-tro-mien-trung",
    note: "Dong gop khan cap",
    status: "verified",
    createdAt: "2026-04-03T08:30:00.000Z",
    updatedAt: "2026-04-03T08:30:00.000Z"
  },
  {
    _id: "don-4",
    donorName: "Pham Minh Chau",
    donorEmail: "chau.pham@example.com",
    amount: 100000,
    campaignCode: "hoc-bong-2026",
    note: "Dong gop nho",
    status: "rejected",
    createdAt: "2026-04-04T01:00:00.000Z",
    updatedAt: "2026-04-04T01:00:00.000Z"
  },
  {
    _id: "don-5",
    donorName: "Vo Thi Lan",
    donorEmail: "lan.vo@example.com",
    amount: 300000,
    campaignCode: "me-va-be",
    note: "Ho tro me va be",
    status: "pending",
    createdAt: "2026-04-04T10:20:00.000Z",
    updatedAt: "2026-04-04T10:20:00.000Z"
  },
  {
    _id: "don-6",
    donorName: "Do Anh Kiet",
    donorEmail: "kiet.do@example.com",
    amount: 750000,
    campaignCode: "cuu-tro-mien-trung",
    note: "Dot cao diem",
    status: "verified",
    createdAt: "2026-04-05T07:45:00.000Z",
    updatedAt: "2026-04-05T07:45:00.000Z"
  },
  {
    _id: "don-7",
    donorName: "Nguyen Thi Mai",
    donorEmail: "mai.nguyen@example.com",
    amount: 200000,
    campaignCode: "me-va-be",
    note: "Ung ho sua bot",
    status: "pending",
    createdAt: "2026-04-06T02:30:00.000Z",
    updatedAt: "2026-04-06T02:30:00.000Z"
  },
  {
    _id: "don-8",
    donorName: "Tran Duc Long",
    donorEmail: "long.tran@example.com",
    amount: 1200000,
    campaignCode: "cuu-tro-mien-trung",
    note: "Ho tro vat tu sua nha",
    status: "verified",
    createdAt: "2026-04-07T05:00:00.000Z",
    updatedAt: "2026-04-07T05:00:00.000Z"
  },
  {
    _id: "don-9",
    donorName: "Hoang Thu Ha",
    donorEmail: "ha.hoang@example.com",
    amount: 450000,
    campaignCode: "an-sinh-xa-hoi",
    note: "Tro cap cho ho ngheo",
    status: "pending",
    createdAt: "2026-04-08T11:00:00.000Z",
    updatedAt: "2026-04-08T11:00:00.000Z"
  },
  {
    _id: "don-10",
    donorName: "Le Thanh Nhan",
    donorEmail: "nhan.le@example.com",
    amount: 700000,
    campaignCode: "nuoc-sach-nong-thon",
    note: "Lap bon chua nuoc",
    status: "verified",
    createdAt: "2026-04-09T09:20:00.000Z",
    updatedAt: "2026-04-09T09:20:00.000Z"
  },
  {
    _id: "don-11",
    donorName: "Truong Ngoc Yen",
    donorEmail: "yen.truong@example.com",
    amount: 420000,
    campaignCode: "y-te-cong-dong",
    note: "Ung ho vat tu y te",
    status: "verified",
    createdAt: "2026-04-10T01:10:00.000Z",
    updatedAt: "2026-04-10T01:10:00.000Z"
  },
  {
    _id: "don-12",
    donorName: "Vu Anh Tuan",
    donorEmail: "tuan.vu@example.com",
    amount: 1100000,
    campaignCode: "cuu-tro-mien-trung",
    note: "Tai tro ao phao",
    status: "verified",
    createdAt: "2026-04-11T07:30:00.000Z",
    updatedAt: "2026-04-11T07:30:00.000Z"
  }
];

function toIsoByOffset(dayOffset: number): string {
  return new Date(Date.UTC(2026, 0, 1 + dayOffset, 8, 0, 0)).toISOString();
}

function generateCampaigns(startIndex: number, count: number): Campaign[] {
  const themes = [
    "Hoc bong vung cao",
    "Tu sach cho tre em",
    "Bua an cho nguoi gia",
    "Phuc hoi sau mua lu",
    "Ho tro benh nhi",
    "Nha tinh thuong",
    "Sua truong hoc",
    "Nuoc sach cong dong"
  ];

  return Array.from({ length: count }, (_, idx) => {
    const index = startIndex + idx;
    const seq = String(index + 1).padStart(2, "0");
    const code = `chien-dich-${seq}`;
    const theme = themes[idx % themes.length];
    const createdAt = toIsoByOffset(20 + idx * 3);
    const targetAmount = 30000000 + (idx % 8) * 15000000;

    return {
      _id: `camp-auto-${seq}`,
      code,
      name: `${theme} ${seq}`,
      description: `Chien dich mo rong ${seq} de kiem thu danh sach va phan trang FE.`,
      targetAmount,
      isActive: idx % 5 !== 0,
      startDate: toIsoByOffset(18 + idx * 3),
      endDate: toIsoByOffset(220 + idx * 2),
      createdAt,
      updatedAt: createdAt
    };
  });
}

function generateDonations(campaigns: Campaign[], startIndex: number, count: number): Donation[] {
  const firstNames = ["Anh", "Binh", "Chau", "Dung", "Giang", "Hanh", "Khanh", "Linh", "Nam", "Phuong"];
  const lastNames = ["Nguyen", "Tran", "Le", "Pham", "Hoang", "Vo", "Do", "Bui", "Dang", "Trinh"];
  const notes = ["Dong hanh", "Ung ho dot 1", "Gop suc", "Tai tro vat tu", "Chia se yeu thuong"];
  const statuses: DonationStatus[] = ["pending", "verified", "verified", "rejected", "verified"];

  return Array.from({ length: count }, (_, idx) => {
    const index = startIndex + idx;
    const seq = String(index + 1).padStart(3, "0");
    const first = firstNames[idx % firstNames.length];
    const last = lastNames[(idx * 3) % lastNames.length];
    const campaign = campaigns[idx % campaigns.length];
    const createdAt = toIsoByOffset(45 + idx);
    const amount = 100000 + (idx % 15) * 50000;

    return {
      _id: `don-auto-${seq}`,
      donorName: `${last} ${first}`,
      donorEmail: `${first.toLowerCase()}.${last.toLowerCase()}${seq}@example.com`,
      amount,
      campaignCode: campaign.code,
      note: `${notes[idx % notes.length]} ${seq}`,
      status: statuses[idx % statuses.length],
      createdAt,
      updatedAt: createdAt
    };
  });
}

const initialCampaigns: Campaign[] = [...baseCampaigns, ...generateCampaigns(baseCampaigns.length, 18)];
const initialDonations: Donation[] = [...baseDonations, ...generateDonations(initialCampaigns, baseDonations.length, 96)];

let campaignsStore: Campaign[] = [...initialCampaigns];
let donationsStore: Donation[] = [...initialDonations];

function donationStatusRows(donations: Donation[]): Array<{ status: DonationStatus; count: number; totalAmount: number }> {
  const statuses: DonationStatus[] = ["pending", "verified", "rejected"];
  return statuses.map((status) => {
    const rows = donations.filter((item) => item.status === status);
    const totalAmount = rows.reduce((sum, item) => sum + item.amount, 0);
    return {
      status,
      count: rows.length,
      totalAmount
    };
  });
}

function toOverview(campaigns: Campaign[], donations: Donation[]): OverviewStats {
  const active = campaigns.filter((item) => item.isActive).length;
  return {
    donations: {
      totalDonations: donations.length,
      totalAmount: donations.reduce((sum, item) => sum + item.amount, 0),
      byStatus: donationStatusRows(donations)
    },
    campaigns: {
      total: campaigns.length,
      active,
      inactive: campaigns.length - active
    },
    generatedAt: nowIso()
  };
}

function matchSearch(value: string | undefined, keyword: string): boolean {
  return (value ?? "").toLowerCase().includes(keyword.toLowerCase());
}

export async function mockGetOverview(): Promise<OverviewStats> {
  return toOverview(campaignsStore, donationsStore);
}

export async function mockListCampaigns(search = ""): Promise<PaginatedResult<Campaign>> {
  const keyword = search.trim();
  let filtered = campaignsStore;

  if (keyword) {
    filtered = filtered.filter((item) => matchSearch(item.code, keyword) || matchSearch(item.name, keyword));
  }

  const rows = [...filtered].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return {
    data: rows,
    pagination: {
      page: 1,
      limit: rows.length,
      total: rows.length,
      totalPages: rows.length === 0 ? 0 : 1
    }
  };
}

export async function mockCreateCampaign(payload: {
  code: string;
  name: string;
  description?: string;
  targetAmount: number;
  isActive?: boolean;
}): Promise<Campaign> {
  const code = payload.code.trim();
  if (!code) {
    throw new Error("Ma chien dich khong hop le");
  }

  const existed = campaignsStore.find((item) => item.code.toLowerCase() === code.toLowerCase());
  if (existed) {
    throw new Error("Campaign code da ton tai");
  }

  const now = nowIso();
  const created: Campaign = {
    _id: makeId("camp"),
    code,
    name: payload.name.trim(),
    description: payload.description?.trim() || undefined,
    targetAmount: payload.targetAmount,
    isActive: payload.isActive ?? true,
    createdAt: now,
    updatedAt: now
  };

  campaignsStore = [created, ...campaignsStore];
  return created;
}

export async function mockListDonations(filters?: {
  campaignCode?: string;
  status?: DonationStatus | "";
  search?: string;
}): Promise<PaginatedResult<Donation>> {
  let rows = [...donationsStore];

  const campaignCode = filters?.campaignCode?.trim();
  if (campaignCode) {
    rows = rows.filter((item) => item.campaignCode === campaignCode);
  }

  if (filters?.status) {
    rows = rows.filter((item) => item.status === filters.status);
  }

  const search = filters?.search?.trim();
  if (search) {
    rows = rows.filter((item) => matchSearch(item.donorName, search) || matchSearch(item.note, search));
  }

  rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    data: rows,
    pagination: {
      page: 1,
      limit: rows.length,
      total: rows.length,
      totalPages: rows.length === 0 ? 0 : 1
    }
  };
}

export async function mockCreateDonation(payload: {
  donorName: string;
  donorEmail: string;
  amount: number;
  campaignCode: string;
  note?: string;
}): Promise<Donation> {
  const campaign = campaignsStore.find((item) => item.code === payload.campaignCode);
  if (!campaign) {
    throw new Error("Campaign khong ton tai");
  }

  const now = nowIso();
  const created: Donation = {
    _id: makeId("don"),
    donorName: payload.donorName.trim(),
    donorEmail: payload.donorEmail.trim().toLowerCase(),
    amount: payload.amount,
    campaignCode: payload.campaignCode.trim(),
    note: payload.note?.trim() || undefined,
    status: "pending",
    createdAt: now,
    updatedAt: now
  };

  donationsStore = [created, ...donationsStore];
  return created;
}

export async function mockUpdateDonationStatus(id: string, status: DonationStatus): Promise<Donation> {
  const index = donationsStore.findIndex((item) => item._id === id);
  if (index < 0) {
    throw new Error("Donation not found");
  }

  const updated: Donation = {
    ...donationsStore[index],
    status,
    updatedAt: nowIso()
  };

  donationsStore[index] = updated;
  return updated;
}
