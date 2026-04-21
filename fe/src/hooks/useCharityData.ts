import { useCallback, useEffect, useState } from "react";
import {
  createCampaign,
  createDonation,
  getOverview,
  listCampaigns,
  listDonations,
  updateDonationStatus
} from "../api";
import { Campaign, Donation, DonationStatus, OverviewStats } from "../types";

export interface DonationFilters {
  campaignCode: string;
  status: DonationStatus | "";
  search: string;
}

const emptyOverview: OverviewStats = {
  donations: {
    totalDonations: 0,
    totalAmount: 0,
    byStatus: []
  },
  campaigns: {
    total: 0,
    active: 0,
    inactive: 0
  },
  generatedAt: new Date(0).toISOString()
};

const defaultFilters: DonationFilters = {
  campaignCode: "",
  status: "",
  search: ""
};

export function useCharityData() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [overview, setOverview] = useState<OverviewStats>(emptyOverview);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);

  const [campaignSearch, setCampaignSearch] = useState("");
  const [donationFilters, setDonationFilters] = useState<DonationFilters>(defaultFilters);

  const refreshAll = useCallback(
    async (overrides?: { campaignSearch?: string; donationFilters?: DonationFilters }) => {
      const nextCampaignSearch = overrides?.campaignSearch ?? campaignSearch;
      const nextDonationFilters = overrides?.donationFilters ?? donationFilters;

      setLoading(true);
      setError("");

      try {
        const [overviewRes, campaignRes, donationRes] = await Promise.all([
          getOverview(),
          listCampaigns(nextCampaignSearch),
          listDonations(nextDonationFilters)
        ]);
        setOverview(overviewRes);
        setCampaigns(campaignRes.data);
        setDonations(donationRes.data);
      } catch (loadError) {
        setError((loadError as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [campaignSearch, donationFilters]
  );

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  async function createCampaignAction(payload: {
    code: string;
    name: string;
    description?: string;
    targetAmount: number;
    isActive?: boolean;
  }): Promise<boolean> {
    setError("");
    setMessage("");
    try {
      await createCampaign(payload);
      setMessage("Da tao campaign moi.");
      await refreshAll();
      return true;
    } catch (submitError) {
      setError((submitError as Error).message);
      return false;
    }
  }

  async function createDonationAction(payload: {
    donorName: string;
    donorEmail: string;
    amount: number;
    campaignCode: string;
    note?: string;
  }): Promise<boolean> {
    setError("");
    setMessage("");
    try {
      await createDonation(payload);
      setMessage("Da ghi nhan giao dich quy gop.");
      await refreshAll();
      return true;
    } catch (submitError) {
      setError((submitError as Error).message);
      return false;
    }
  }

  async function updateDonationStatusAction(id: string, status: DonationStatus): Promise<boolean> {
    setError("");
    setMessage("");
    try {
      await updateDonationStatus(id, status);
      setMessage("Da cap nhat trang thai donation.");
      await refreshAll();
      return true;
    } catch (updateError) {
      setError((updateError as Error).message);
      return false;
    }
  }

  return {
    loading,
    message,
    error,
    overview,
    campaigns,
    donations,
    campaignSearch,
    donationFilters,
    setCampaignSearch,
    setDonationFilters,
    refreshAll,
    createCampaignAction,
    createDonationAction,
    updateDonationStatusAction
  };
}
