import mongoose from "mongoose";
import { connectMongo } from "./infrastructure/database/mongo";
import { CampaignModel, type Campaign } from "./modules/campaigns/campaign.model";
import { DonationModel, type Donation } from "./modules/donations/donation.model";

type SeedCampaign = Omit<Campaign, "createdAt" | "updatedAt">;
type SeedDonation = Omit<Donation, "createdAt" | "updatedAt">;

const shouldReset =
  process.argv.includes("--reset") || process.env.SEED_RESET === "true";

const seedCampaigns: SeedCampaign[] = [
  {
    code: "hoc-bong-2026",
    name: "Hoc bong sinh vien vuot kho",
    description: "Ho tro hoc phi va sinh hoat phi cho sinh vien co hoan canh kho khan.",
    targetAmount: 50000000,
    isActive: true,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31")
  },
  {
    code: "y-te-cong-dong",
    name: "Tu thuoc cho tram y te xa",
    description: "Bo sung vat tu va thiet bi y te co ban cho cac tram y te vung xa.",
    targetAmount: 80000000,
    isActive: true,
    startDate: new Date("2026-02-01"),
    endDate: new Date("2026-10-31")
  },
  {
    code: "cuu-tro-mien-trung",
    name: "Cuu tro mien Trung sau bao lu",
    description: "Ho tro luong thuc, nuoc sach va sua chua nha cho ho dan bi anh huong.",
    targetAmount: 200000000,
    isActive: true,
    startDate: new Date("2026-03-01"),
    endDate: new Date("2026-09-30")
  },
  {
    code: "me-va-be",
    name: "Dinh duong cho me va be",
    description: "Cung cap sua va goi dinh duong cho phu nu mang thai va tre nho.",
    targetAmount: 60000000,
    isActive: true,
    startDate: new Date("2026-01-15"),
    endDate: new Date("2026-11-30")
  },
  {
    code: "an-sinh-xa-hoi",
    name: "An sinh xa hoi khu pho",
    description: "Ho tro khan cap tien tro cap va nhu yeu pham cho ho kho khan.",
    targetAmount: 120000000,
    isActive: false,
    startDate: new Date("2025-09-01"),
    endDate: new Date("2026-02-28")
  },
  {
    code: "nuoc-sach-nong-thon",
    name: "Nuoc sach cho truong hoc nong thon",
    description: "Xay dung he thong loc nuoc va bon chua nuoc cho truong hoc vung sau.",
    targetAmount: 90000000,
    isActive: true,
    startDate: new Date("2026-04-01"),
    endDate: new Date("2026-12-15")
  }
];

const seedDonations: SeedDonation[] = [
  {
    donorName: "Nguyen Van An",
    donorEmail: "an.nguyen@example.com",
    amount: 250000,
    campaignCode: "hoc-bong-2026",
    note: "Ho tro hoc bong thang 4",
    status: "verified"
  },
  {
    donorName: "Tran Thi Bich",
    donorEmail: "bich.tran@example.com",
    amount: 150000,
    campaignCode: "y-te-cong-dong",
    note: "Ung ho mua thuoc",
    status: "pending"
  },
  {
    donorName: "Le Quang Huy",
    donorEmail: "huy.le@example.com",
    amount: 500000,
    campaignCode: "cuu-tro-mien-trung",
    note: "Dong gop khan cap",
    status: "verified"
  },
  {
    donorName: "Pham Minh Chau",
    donorEmail: "chau.pham@example.com",
    amount: 100000,
    campaignCode: "hoc-bong-2026",
    note: "Dong gop nho",
    status: "rejected"
  },
  {
    donorName: "Vo Thi Lan",
    donorEmail: "lan.vo@example.com",
    amount: 300000,
    campaignCode: "me-va-be",
    note: "Ho tro me va be",
    status: "pending"
  },
  {
    donorName: "Do Anh Kiet",
    donorEmail: "kiet.do@example.com",
    amount: 750000,
    campaignCode: "cuu-tro-mien-trung",
    note: "Dot cao diem thang 5",
    status: "verified"
  },
  {
    donorName: "Nguyen Thi Mai",
    donorEmail: "mai.nguyen@example.com",
    amount: 200000,
    campaignCode: "me-va-be",
    note: "Ung ho sua bot",
    status: "pending"
  },
  {
    donorName: "Tran Duc Long",
    donorEmail: "long.tran@example.com",
    amount: 1200000,
    campaignCode: "cuu-tro-mien-trung",
    note: "Ho tro vat tu sua nha",
    status: "verified"
  },
  {
    donorName: "Hoang Thu Ha",
    donorEmail: "ha.hoang@example.com",
    amount: 450000,
    campaignCode: "an-sinh-xa-hoi",
    note: "Tro cap cho ho ngheo",
    status: "pending"
  },
  {
    donorName: "Bui Tuan Kiet",
    donorEmail: "kiet.bui@example.com",
    amount: 900000,
    campaignCode: "an-sinh-xa-hoi",
    note: "Tang quy an sinh",
    status: "verified"
  },
  {
    donorName: "Dang Ngoc Linh",
    donorEmail: "linh.dang@example.com",
    amount: 600000,
    campaignCode: "nuoc-sach-nong-thon",
    note: "Loc nuoc cho truong hoc",
    status: "rejected"
  },
  {
    donorName: "Phan Thanh Tam",
    donorEmail: "tam.phan@example.com",
    amount: 350000,
    campaignCode: "hoc-bong-2026",
    note: "Ung ho theo nhom",
    status: "pending"
  },
  {
    donorName: "Le Thanh Nhan",
    donorEmail: "nhan.le@example.com",
    amount: 700000,
    campaignCode: "nuoc-sach-nong-thon",
    note: "Lap bon chua nuoc",
    status: "verified"
  },
  {
    donorName: "Truong Ngoc Yen",
    donorEmail: "yen.truong@example.com",
    amount: 420000,
    campaignCode: "y-te-cong-dong",
    note: "Ung ho vat tu y te",
    status: "verified"
  },
  {
    donorName: "Ngo Minh Tri",
    donorEmail: "tri.ngo@example.com",
    amount: 180000,
    campaignCode: "hoc-bong-2026",
    note: "Dong gop cho hoc sinh ngheo",
    status: "pending"
  },
  {
    donorName: "Dinh Kim Oanh",
    donorEmail: "oanh.dinh@example.com",
    amount: 260000,
    campaignCode: "me-va-be",
    note: "Sua va ta tre em",
    status: "verified"
  },
  {
    donorName: "Vu Anh Tuan",
    donorEmail: "tuan.vu@example.com",
    amount: 1100000,
    campaignCode: "cuu-tro-mien-trung",
    note: "Tai tro bao tay va ao phao",
    status: "verified"
  },
  {
    donorName: "Nguyen Phuong Linh",
    donorEmail: "linh.nguyen2@example.com",
    amount: 130000,
    campaignCode: "y-te-cong-dong",
    note: "Ung ho qua online",
    status: "rejected"
  }
];

function summarizeByStatus(donations: SeedDonation[]): Record<string, number> {
  return donations.reduce<Record<string, number>>((acc, donation) => {
    acc[donation.status] = (acc[donation.status] ?? 0) + 1;
    return acc;
  }, {});
}

async function main(): Promise<void> {
  await connectMongo();

  try {
    if (shouldReset) {
      await Promise.all([CampaignModel.deleteMany({}), DonationModel.deleteMany({})]);
    }

    const campaigns = await CampaignModel.insertMany(seedCampaigns, { ordered: true });
    const donations = await DonationModel.insertMany(seedDonations, { ordered: true });

    const statusSummary = summarizeByStatus(seedDonations);

    console.log(`Seed completed: inserted ${campaigns.length} campaigns`);
    console.log(`Seed completed: inserted ${donations.length} donations`);
    console.log(`Donations by status: ${JSON.stringify(statusSummary)}`);
    console.log(`Reset mode: ${shouldReset ? "enabled" : "disabled"}`);
    console.log("Target database: charity_distributed replica set");
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error("Seed failed", error);
  process.exitCode = 1;
});
