import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectMongo } from "./infrastructure/database/mongo";
import { BranchModel } from "./modules/branches/branch.model";
import { CampaignModel } from "./modules/campaigns/campaign.model";
import { DonorModel } from "./modules/donors/donor.model";
import { DonationModel } from "./modules/donations/donation.model";
import { BeneficiaryModel } from "./modules/beneficiaries/beneficiary.model";
import { DisbursementModel } from "./modules/disbursements/disbursement.model";
import { VolunteerModel } from "./modules/volunteers/volunteer.model";
import { User, UserRole } from "./modules/auth/auth.model";
import { ActivityLogModel } from "./modules/activity-logs/activity-log.model";

const shouldReset = process.argv.includes("--reset") || process.env.SEED_RESET === "true";

async function main(): Promise<void> {
  await connectMongo();

  try {
    if (shouldReset) {
      await Promise.all([
        BranchModel.deleteMany({}),
        CampaignModel.deleteMany({}),
        DonorModel.deleteMany({}),
        DonationModel.deleteMany({}),
        BeneficiaryModel.deleteMany({}),
        DisbursementModel.deleteMany({}),
        VolunteerModel.deleteMany({}),
        ActivityLogModel.deleteMany({}),
        User.deleteMany({})
      ]);
    }

    const [hq, hcmBranch, dnBranch] = await BranchModel.create([
      { name: "Trung tam trung uong", code: "HQ", type: "HEADQUARTER", province: "Ha Noi", status: "ACTIVE" },
      { name: "Chi nhanh TP.HCM", code: "HCM", type: "BRANCH", province: "TP.HCM", status: "ACTIVE" },
      { name: "Chi nhanh Da Nang", code: "DNG", type: "BRANCH", province: "Da Nang", status: "ACTIVE" }
    ]);

    const passwordHash = await bcrypt.hash("Demo@123", 12);
    const [superAdmin, hcmAdmin, dnAdmin, hcmStaff, donorUser] = await User.create([
      {
        email: "superadmin@charity.local",
        password: passwordHash,
        fullName: "Super Admin",
        role: UserRole.SUPER_ADMIN,
        isActive: true,
        branchId: hq._id
      },
      {
        email: "hcm.admin@charity.local",
        password: passwordHash,
        fullName: "HCM Branch Admin",
        role: UserRole.BRANCH_ADMIN,
        isActive: true,
        branchId: hcmBranch._id
      },
      {
        email: "dn.admin@charity.local",
        password: passwordHash,
        fullName: "Da Nang Branch Admin",
        role: UserRole.BRANCH_ADMIN,
        isActive: true,
        branchId: dnBranch._id
      },
      {
        email: "hcm.staff@charity.local",
        password: passwordHash,
        fullName: "HCM Staff",
        role: UserRole.STAFF,
        isActive: true,
        branchId: hcmBranch._id
      },
      {
        email: "donor@charity.local",
        password: passwordHash,
        fullName: "Main Donor",
        role: UserRole.DONOR,
        isActive: true
      }
    ]);

    const [hcmCampaign, dnCampaign] = await CampaignModel.create([
      {
        branchId: hcmBranch._id,
        code: "HCM-FLOOD-2026",
        title: "Cuu tro lu lut HCM",
        type: "FLOOD_RELIEF",
        status: "ACTIVE",
        targetAmount: 100000000,
        currentAmount: 0,
        disbursedAmount: 0,
        location: { province: "TP.HCM", district: "Thu Duc" },
        createdBy: hcmAdmin._id
      },
      {
        branchId: dnBranch._id,
        code: "DN-SCHOLAR-2026",
        title: "Hoc bong Da Nang",
        type: "SCHOLARSHIP",
        status: "ACTIVE",
        targetAmount: 80000000,
        currentAmount: 0,
        disbursedAmount: 0,
        location: { province: "Da Nang", district: "Hai Chau" },
        createdBy: dnAdmin._id
      }
    ]);

    const [mainDonor, companyDonor] = await DonorModel.create([
      {
        userId: donorUser._id,
        fullName: "Nguyen Van Hao",
        phone: "0900000001",
        email: "donor1@example.com",
        donorType: "INDIVIDUAL",
        totalDonated: 0
      },
      {
        fullName: "Cong ty ABC",
        phone: "0900000002",
        email: "abc@example.com",
        donorType: "ORGANIZATION",
        totalDonated: 0
      }
    ]);

    const [d1, d2] = await DonationModel.create([
      {
        branchId: hcmBranch._id,
        campaignId: hcmCampaign._id,
        donorId: mainDonor._id,
        donorSnapshot: { fullName: mainDonor.fullName, phone: mainDonor.phone, email: mainDonor.email },
        campaignSnapshot: { code: hcmCampaign.code, title: hcmCampaign.title },
        amount: 2500000,
        paymentMethod: "BANK_TRANSFER",
        paymentStatus: "SUCCESS",
        donatedAt: new Date(),
        transactionCode: "TXN-HCM-001"
      },
      {
        branchId: dnBranch._id,
        campaignId: dnCampaign._id,
        donorId: companyDonor._id,
        donorSnapshot: { fullName: companyDonor.fullName, phone: companyDonor.phone, email: companyDonor.email },
        campaignSnapshot: { code: dnCampaign.code, title: dnCampaign.title },
        amount: 5000000,
        paymentMethod: "CARD",
        paymentStatus: "PENDING",
        donatedAt: new Date(),
        transactionCode: "TXN-DN-001"
      }
    ]);

    await CampaignModel.findByIdAndUpdate(hcmCampaign._id, { $inc: { currentAmount: d1.amount } });
    await DonorModel.findByIdAndUpdate(mainDonor._id, { $inc: { totalDonated: d1.amount } });

    const beneficiary = await BeneficiaryModel.create({
      branchId: hcmBranch._id,
      campaignId: hcmCampaign._id,
      name: "Ho gia dinh Tran",
      type: "FAMILY",
      phone: "0901231234",
      location: { province: "TP.HCM", district: "Thu Duc", address: "P. Linh Trung" },
      situationDescription: "Bi anh huong boi ngap lut",
      verificationStatus: "VERIFIED",
      verifiedBy: hcmStaff._id,
      verifiedAt: new Date()
    });

    await DisbursementModel.create({
      branchId: hcmBranch._id,
      campaignId: hcmCampaign._id,
      beneficiaryId: beneficiary._id,
      amount: 1000000,
      purpose: "Ho tro khan cap",
      method: "CASH",
      status: "PENDING"
    });

    await VolunteerModel.create({
      branchId: hcmBranch._id,
      fullName: "Le Thi Minh",
      phone: "0903123123",
      email: "volunteer@example.com",
      skills: ["logistics", "medical-support"],
      joinedCampaignIds: [hcmCampaign._id],
      status: "ACTIVE"
    });

    await ActivityLogModel.create({
      branchId: hcmBranch._id,
      actorId: hcmAdmin._id,
      actorRole: UserRole.BRANCH_ADMIN,
      actorBranchId: hcmBranch._id,
      action: "SEED_BOOTSTRAP",
      entityType: "system",
      entityId: "seed",
      description: "Initial seed data created"
    });

    console.log("Seed completed successfully");
    console.log("Demo password for seeded users: Demo@123 (dev only)");
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error("Seed failed", error);
  process.exitCode = 1;
});
