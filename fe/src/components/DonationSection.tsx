import { FormEvent, useMemo, useState } from "react";
import { Campaign, Donation, DonationStatus } from "../types";
import { DonationFilters } from "../hooks/useCharityData";

const initialDonationForm = {
  donorName: "",
  donorEmail: "",
  amount: 500000,
  campaignCode: "",
  note: ""
};

const statusLabelMap: Record<DonationStatus, string> = {
  pending: "Đang chờ",
  verified: "Đã xác minh",
  rejected: "Từ chối"
};

interface DonationSectionProps {
  campaigns: Campaign[];
  donations: Donation[];
  donationFilters: DonationFilters;
  setDonationFilters: (filters: DonationFilters) => void;
  onCreateDonation: (payload: {
    donorName: string;
    donorEmail: string;
    amount: number;
    campaignCode: string;
    note?: string;
  }) => Promise<boolean>;
  onUpdateStatus: (id: string, status: DonationStatus) => Promise<boolean>;
  onRefresh: (filters: DonationFilters) => Promise<void>;
}

export function DonationSection({
  campaigns,
  donations,
  donationFilters,
  setDonationFilters,
  onCreateDonation,
  onUpdateStatus,
  onRefresh
}: DonationSectionProps) {
  const [form, setForm] = useState(initialDonationForm);

  const campaignOptions = useMemo(() => campaigns.map((campaign) => campaign.code), [campaigns]);

  async function submitDonation(event: FormEvent) {
    event.preventDefault();
    const payload = {
      donorName: form.donorName,
      donorEmail: form.donorEmail,
      amount: Number(form.amount),
      campaignCode: form.campaignCode,
      note: form.note || undefined
    };

    const ok = await onCreateDonation(payload);
    if (ok) {
      setForm((prev) => ({
        ...prev,
        donorName: "",
        donorEmail: "",
        note: ""
      }));
    }
  }

  async function applyFilters(event: FormEvent) {
    event.preventDefault();
    await onRefresh(donationFilters);
  }

  return (
    <section className="panel-grid donations-layout">
      <article className="panel">
        <h2>Ghi nhận quyên góp</h2>
        <form className="form-grid" onSubmit={(event) => void submitDonation(event)}>
          <label>
            Người quyên góp
            <input
              value={form.donorName}
              onChange={(event) => setForm((prev) => ({ ...prev, donorName: event.target.value }))}
              required
              minLength={2}
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={form.donorEmail}
              onChange={(event) => setForm((prev) => ({ ...prev, donorEmail: event.target.value }))}
              required
            />
          </label>

          <label>
            Số tiền (VND)
            <input
              type="number"
              min={1000}
              value={form.amount}
              onChange={(event) => setForm((prev) => ({ ...prev, amount: Number(event.target.value) }))}
              required
            />
          </label>

          <label>
            Chiến dịch
            <select
              value={form.campaignCode}
              onChange={(event) => setForm((prev) => ({ ...prev, campaignCode: event.target.value }))}
              required
            >
              <option value="" disabled>
                -- Chọn chiến dịch --
              </option>
              {campaignOptions.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>

          <label>
            Ghi chú
            <textarea
              rows={4}
              value={form.note}
              onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
            />
          </label>

          <button type="submit">Gửi quyên góp</button>
        </form>
      </article>

      <article className="panel">
        <div className="panel-headline">
          <h2>Danh sách quyên góp</h2>
          <form className="filters" onSubmit={(event) => void applyFilters(event)}>
            <input
              placeholder="Tìm tên hoặc ghi chú"
              value={donationFilters.search}
              onChange={(event) =>
                setDonationFilters({
                  ...donationFilters,
                  search: event.target.value
                })
              }
            />
            <input
              placeholder="Mã chiến dịch"
              value={donationFilters.campaignCode}
              onChange={(event) =>
                setDonationFilters({
                  ...donationFilters,
                  campaignCode: event.target.value
                })
              }
            />
            <select
              value={donationFilters.status}
              onChange={(event) =>
                setDonationFilters({
                  ...donationFilters,
                  status: event.target.value as DonationStatus | ""
                })
              }
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Đang chờ</option>
              <option value="verified">Đã xác minh</option>
              <option value="rejected">Từ chối</option>
            </select>
            <button type="submit">Lọc</button>
          </form>
        </div>

        <ul className="data-list donation-list">
          {donations.map((donation) => (
            <li key={donation._id} className="data-item donation-item">
              <div>
                <p className="item-title">{donation.donorName}</p>
                <p className="item-subtitle">{donation.donorEmail}</p>
                <p className="item-subtitle">
                  {donation.amount.toLocaleString("vi-VN")} VND · {donation.campaignCode}
                </p>
                <p className="item-subtitle">{new Date(donation.createdAt).toLocaleString("vi-VN")}</p>
              </div>

              <div className="row-actions">
                <span className={`pill ${donation.status}`}>{statusLabelMap[donation.status]}</span>
                <button type="button" onClick={() => void onUpdateStatus(donation._id, "verified")}>
                  Duyệt
                </button>
                <button type="button" onClick={() => void onUpdateStatus(donation._id, "rejected")}>
                  Từ chối
                </button>
              </div>
            </li>
          ))}
          {donations.length === 0 ? <li>Chưa có quyên góp nào.</li> : null}
        </ul>
      </article>
    </section>
  );
}
