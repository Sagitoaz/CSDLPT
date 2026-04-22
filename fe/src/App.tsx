import { useMemo, useState } from "react";
import { CampaignSection } from "./components/CampaignSection";
import { DashboardSection } from "./components/DashboardSection";
import { DonationSection } from "./components/DonationSection";
import { Hero } from "./components/Hero";
import { PublicHeader } from "./components/PublicHeader";
import { PublicLandingSections } from "./components/PublicLandingSections";
import { PublicDonateSection } from "./components/PublicDonateSection";
import { DonationFilters, useCharityData } from "./hooks/useCharityData";
import { getCampaignRaised, getStatusTotals } from "./utils/metrics";

type Mode = "public" | "admin";
type AdminTab = "dashboard" | "campaigns" | "donations";

export function App() {
  const [mode, setMode] = useState<Mode>("public");
  const [adminTab, setAdminTab] = useState<AdminTab>("dashboard");

  const {
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
  } = useCharityData();

  const statusTotals = useMemo(() => getStatusTotals(overview), [overview]);
  const campaignRaised = useMemo(() => getCampaignRaised(donations), [donations]);

  async function refreshWithFilters(filters: DonationFilters) {
    await refreshAll({ donationFilters: filters });
  }

  return (
    <div className={mode === "public" ? "shell public-shell" : "shell"}>
      <div className="ambient ambient-left" aria-hidden="true" />
      <div className="ambient ambient-right" aria-hidden="true" />

      <div className="topbar">
        <div className="mode-switch" role="group" aria-label="Chuyển chế độ">
          <button
            className={mode === "public" ? "tab is-active" : "tab"}
            onClick={() => setMode("public")}
          >
            Giao diện công khai
          </button>
          <button
            className={mode === "admin" ? "tab is-active" : "tab"}
            onClick={() => setMode("admin")}
          >
            Giao diện quản trị
          </button>
        </div>
      </div>

      {mode === "public" ? <PublicHeader /> : null}

      <Hero overview={overview} statusTotals={statusTotals} mode={mode} />

      <nav className="tabs" aria-label="Nhóm chức năng chính">
        {mode === "admin" ? (
          <>
            <button
              className={adminTab === "dashboard" ? "tab is-active" : "tab"}
              onClick={() => setAdminTab("dashboard")}
            >
              Tổng quan
            </button>
            <button
              className={adminTab === "campaigns" ? "tab is-active" : "tab"}
              onClick={() => setAdminTab("campaigns")}
            >
              Chiến dịch
            </button>
            <button
              className={adminTab === "donations" ? "tab is-active" : "tab"}
              onClick={() => setAdminTab("donations")}
            >
              Quyên góp
            </button>
          </>
        ) : (
          <span className="public-mode-caption">Chế độ công khai: chỉ hiển thị luồng ủng hộ, ẩn thao tác quản trị.</span>
        )}

        <button className="tab refresh" onClick={() => void refreshAll()} disabled={loading}>
          {loading ? "Đang tải..." : "Làm mới"}
        </button>
      </nav>

      {message ? <p className="notice success">{message}</p> : null}
      {error ? <p className="notice error">{error}</p> : null}

      {mode === "public" ? (
        <>
          <PublicLandingSections overview={overview} campaigns={campaigns} donations={donations} />
          <PublicDonateSection
            campaigns={campaigns}
            donations={donations}
            onCreateDonation={createDonationAction}
          />
        </>
      ) : null}

      {mode === "admin" && adminTab === "dashboard" ? (
        <DashboardSection
          campaigns={campaigns}
          campaignRaised={campaignRaised}
          statusTotals={statusTotals}
          overview={overview}
        />
      ) : null}

      {mode === "admin" && adminTab === "campaigns" ? (
        <CampaignSection
          campaigns={campaigns}
          campaignSearch={campaignSearch}
          setCampaignSearch={setCampaignSearch}
          onCreateCampaign={createCampaignAction}
          onRefresh={refreshAll}
        />
      ) : null}

      {mode === "admin" && adminTab === "donations" ? (
        <DonationSection
          campaigns={campaigns}
          donations={donations}
          donationFilters={donationFilters}
          setDonationFilters={setDonationFilters}
          onCreateDonation={createDonationAction}
          onUpdateStatus={updateDonationStatusAction}
          onRefresh={refreshWithFilters}
        />
      ) : null}
    </div>
  );
}
