import mongoose from "mongoose";
import { config } from "./config";
import { DonationModel, type Donation } from "./donation.model";
import { connectMongo } from "./db";

type SeedDonation = Omit<Donation, "createdAt" | "updatedAt">;

const shouldReset =
  process.argv.includes("--reset") || process.env.SEED_RESET === "true";

const seedDonations: SeedDonation[] = [
  {
    donorName: "Nguyen Van An",
    donorEmail: "an.nguyen@example.com",
    amount: 250000,
    campaignCode: "hoc-bong-2026",
    note: "Ho tro hoc bong cho sinh vien ngheo",
    status: "verified",
  },
  {
    donorName: "Tran Thi Bich",
    donorEmail: "bich.tran@example.com",
    amount: 150000,
    campaignCode: "y-te-cong-dong",
    note: "Ung ho mua thuoc y te",
    status: "pending",
  },
  {
    donorName: "Le Quang Huy",
    donorEmail: "huy.le@example.com",
    amount: 500000,
    campaignCode: "chung-tay-2026",
    note: "Dong gop cuu tro khan cap",
    status: "verified",
  },
  {
    donorName: "Pham Minh Chau",
    donorEmail: "chau.pham@example.com",
    amount: 100000,
    campaignCode: "hoc-bong-2026",
    note: "Dong gop nho cho quy hoc bong",
    status: "rejected",
  },
  {
    donorName: "Vo Thi Lan",
    donorEmail: "lan.vo@example.com",
    amount: 300000,
    campaignCode: "me-va-be",
    note: "Ho tro trach nhiem xa hoi",
    status: "pending",
  },
  {
    donorName: "Do Anh Kiet",
    donorEmail: "kiet.do@example.com",
    amount: 750000,
    campaignCode: "chung-tay-2026",
    note: "Ung ho dot cao diem",
    status: "verified",
  },
  {
    donorName: "Nguyen Thi Mai",
    donorEmail: "mai.nguyen@example.com",
    amount: 200000,
    campaignCode: "me-va-be",
    note: "Dong gop cho tre em",
    status: "pending",
  },
  {
    donorName: "Tran Duc Long",
    donorEmail: "long.tran@example.com",
    amount: 1200000,
    campaignCode: "cuu-tro-mien-trung",
    note: "Ho tro khan cap sau thien tai",
    status: "verified",
  },
  {
    donorName: "Hoang Thu Ha",
    donorEmail: "ha.hoang@example.com",
    amount: 450000,
    campaignCode: "cuu-tro-mien-trung",
    note: "Dong gop them cho quyen gop chung",
    status: "pending",
  },
  {
    donorName: "Bui Tuan Kiet",
    donorEmail: "kiet.bui@example.com",
    amount: 900000,
    campaignCode: "an-sinh-xa-hoi",
    note: "Quy an sinh xa hoi",
    status: "verified",
  },
  {
    donorName: "Dang Ngoc Linh",
    donorEmail: "linh.dang@example.com",
    amount: 600000,
    campaignCode: "an-sinh-xa-hoi",
    note: "Ho tro mua sach vo",
    status: "rejected",
  },
  {
    donorName: "Phan Thanh Tam",
    donorEmail: "tam.phan@example.com",
    amount: 350000,
    campaignCode: "hoc-bong-2026",
    note: "Dong gop theo nhom lop",
    status: "pending",
  },
];

async function main(): Promise<void> {
  await connectMongo();

  try {
    if (shouldReset) {
      await DonationModel.deleteMany({});
    }

    const result = await DonationModel.insertMany(seedDonations, {
      ordered: true,
    });

    console.log(`Seed completed: inserted ${result.length} donations`);
    console.log(`Reset mode: ${shouldReset ? "enabled" : "disabled"}`);
    console.log(`Target database: charity_distributed replica set`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error("Seed failed", error);
  process.exitCode = 1;
});
