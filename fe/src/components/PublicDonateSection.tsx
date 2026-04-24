import { FormEvent, useEffect, useMemo, useState } from "react";
import { Campaign, Donation } from "../types";

const PUBLIC_CAMPAIGNS_PER_PAGE = 5;
type PublicListTab = "campaigns" | "verified";

interface PublicDonateSectionProps {
  campaigns: Campaign[];
  donations: Donation[];
  onCreateDonation: (payload: {
    donorName: string;
    donorEmail: string;
    amount: number;
    campaignCode: string;
    note?: string;
  }) => Promise<boolean>;
}

const initialForm = {
  donorName: "",
  donorEmail: "",
  amount: 200000,
  campaignCode: "",
  note: ""
};

export function PublicDonateSection({ campaigns, donations, onCreateDonation }: PublicDonateSectionProps) {
  const [form, setForm] = useState(initialForm);
  const [campaignPage, setCampaignPage] = useState(1);
  const [activeTab, setActiveTab] = useState<PublicListTab>("campaigns");

  const activeCampaigns = useMemo(() => campaigns.filter((campaign) => campaign.isActive), [campaigns]);
  const recentVerified = useMemo(
    () => donations.filter((item) => item.status === "verified").slice(0, 6),
    [donations]
  );
  const totalCampaignPages = Math.max(1, Math.ceil(activeCampaigns.length / PUBLIC_CAMPAIGNS_PER_PAGE));
  const currentCampaignPage = Math.min(campaignPage, totalCampaignPages);
  const pagedActiveCampaigns = useMemo(() => {
    const start = (currentCampaignPage - 1) * PUBLIC_CAMPAIGNS_PER_PAGE;
    return activeCampaigns.slice(start, start + PUBLIC_CAMPAIGNS_PER_PAGE);
  }, [activeCampaigns, currentCampaignPage]);

  useEffect(() => {
    if (campaignPage > totalCampaignPages) {
      setCampaignPage(totalCampaignPages);
    }
  }, [campaignPage, totalCampaignPages]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const ok = await onCreateDonation({
      donorName: form.donorName,
      donorEmail: form.donorEmail,
      amount: Number(form.amount),
      campaignCode: form.campaignCode,
      note: form.note || undefined
    });

    if (ok) {
      setForm((prev) => ({ ...prev, donorName: "", donorEmail: "", note: "" }));
    }
  }

  return (
    <section className="panel-grid public-layout" id="public-donate">
      <article className="panel">
        <h2>Ủng hộ trong 1 phút</h2>
        <p className="public-note">Điền thông tin cơ bản, chọn chiến dịch đang mở và xác nhận đóng góp ngay.</p>
        <form className="form-grid" onSubmit={(event) => void submit(event)}>
          <label>
            Họ và tên
            <input
              value={form.donorName}
              onChange={(event) => setForm((prev) => ({ ...prev, donorName: event.target.value }))}
              required
              minLength={2}
            />
          </label>

          <label>
            Email nhận thông báo
            <input
              type="email"
              value={form.donorEmail}
              onChange={(event) => setForm((prev) => ({ ...prev, donorEmail: event.target.value }))}
              required
            />
          </label>

          <label>
            Mức ủng hộ (VND)
            <input
              type="number"
              min={1000}
              value={form.amount}
              onChange={(event) => setForm((prev) => ({ ...prev, amount: Number(event.target.value) }))}
              required
            />
          </label>

          <label>
            Chiến dịch đang mở
            <select
              value={form.campaignCode}
              onChange={(event) => setForm((prev) => ({ ...prev, campaignCode: event.target.value }))}
              required
            >
              <option value="" disabled>
                Chọn chiến dịch
              </option>
              {activeCampaigns.map((campaign) => (
                <option key={campaign._id} value={campaign.code}>
                  {campaign.name} ({campaign.code})
                </option>
              ))}
            </select>
          </label>

          <label>
            Lời nhắn đồng hành (tùy chọn)
            <textarea
              rows={4}
              value={form.note}
              onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
            />
          </label>

          <button type="submit">Hoàn tất ủng hộ</button>
        </form>
      </article>

      <article className="panel">
        <div className="panel-headline public-panel-headline">
          <h2>{activeTab === "campaigns" ? "Chiến dịch đang tiếp nhận ủng hộ" : "Đóng góp đã xác minh gần đây"}</h2>
          <div className="public-panel-tabs" role="tablist" aria-label="Danh sách công khai">
            <button
              type="button"
              className={activeTab === "campaigns" ? "tab is-active" : "tab"}
              role="tab"
              aria-selected={activeTab === "campaigns"}
              onClick={() => setActiveTab("campaigns")}
            >
              Chiến dịch
            </button>
            <button
              type="button"
              className={activeTab === "verified" ? "tab is-active" : "tab"}
              role="tab"
              aria-selected={activeTab === "verified"}
              onClick={() => setActiveTab("verified")}
            >
              Đóng góp đã xác minh
            </button>
          </div>
        </div>

        {activeTab === "campaigns" ? (
          <>
            <ul className="data-list">
              {pagedActiveCampaigns.map((campaign) => (
                <li key={campaign._id} className="data-item">
                  <div>
                    <p className="item-title">{campaign.name}</p>
                    <p className="item-subtitle">{campaign.code}</p>
                    <p className="item-subtitle">
                      Mục tiêu: {campaign.targetAmount.toLocaleString("vi-VN")} VND
                    </p>
                  </div>
                  <span className="pill ok">đang mở</span>
                </li>
              ))}
              {activeCampaigns.length === 0 ? <li>Hiện tại chưa có chiến dịch đang mở.</li> : null}
            </ul>

            {activeCampaigns.length > PUBLIC_CAMPAIGNS_PER_PAGE ? (
              <div className="pagination" role="navigation" aria-label="Phân trang chiến dịch công khai">
                <button
                  type="button"
                  onClick={() => setCampaignPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentCampaignPage === 1}
                >
                  Trang trước
                </button>
                <span>
                  Trang {currentCampaignPage}/{totalCampaignPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCampaignPage((prev) => Math.min(totalCampaignPages, prev + 1))}
                  disabled={currentCampaignPage === totalCampaignPages}
                >
                  Trang sau
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <ul className="data-list">
            {recentVerified.map((donation) => (
              <li key={donation._id} className="data-item">
                <div>
                  <p className="item-title">{donation.donorName}</p>
                  <p className="item-subtitle">
                    {donation.amount.toLocaleString("vi-VN")} VND · {donation.campaignCode}
                  </p>
                </div>
                <span className="pill verified">đã xác minh</span>
              </li>
            ))}
            {recentVerified.length === 0 ? <li>Chưa có quyên góp đã xác minh để hiển thị.</li> : null}
          </ul>
        )}
      </article>
    </section>
  );
}
