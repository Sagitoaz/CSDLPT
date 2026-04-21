import { FormEvent, useMemo, useState } from "react";
import { Campaign, Donation } from "../types";

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

  const activeCampaigns = useMemo(() => campaigns.filter((campaign) => campaign.isActive), [campaigns]);
  const recentVerified = useMemo(
    () => donations.filter((item) => item.status === "verified").slice(0, 6),
    [donations]
  );

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
    <section className="panel-grid public-layout">
      <article className="panel">
        <h2>Ung ho trong 1 phut</h2>
        <p className="public-note">Dien thong tin co ban, chon chien dich dang mo va xac nhan dong gop ngay.</p>
        <form className="form-grid" onSubmit={(event) => void submit(event)}>
          <label>
            Ho va ten
            <input
              value={form.donorName}
              onChange={(event) => setForm((prev) => ({ ...prev, donorName: event.target.value }))}
              required
              minLength={2}
            />
          </label>

          <label>
            Email nhan thong bao
            <input
              type="email"
              value={form.donorEmail}
              onChange={(event) => setForm((prev) => ({ ...prev, donorEmail: event.target.value }))}
              required
            />
          </label>

          <label>
            Muc ung ho (VND)
            <input
              type="number"
              min={1000}
              value={form.amount}
              onChange={(event) => setForm((prev) => ({ ...prev, amount: Number(event.target.value) }))}
              required
            />
          </label>

          <label>
            Campaign dang mo
            <select
              value={form.campaignCode}
              onChange={(event) => setForm((prev) => ({ ...prev, campaignCode: event.target.value }))}
              required
            >
              <option value="" disabled>
                Chon campaign
              </option>
              {activeCampaigns.map((campaign) => (
                <option key={campaign._id} value={campaign.code}>
                  {campaign.name} ({campaign.code})
                </option>
              ))}
            </select>
          </label>

          <label>
            Loi nhan dong hanh (tuy chon)
            <textarea
              rows={4}
              value={form.note}
              onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
            />
          </label>

          <button type="submit">Hoan tat ung ho</button>
        </form>
      </article>

      <article className="panel">
        <h2>Chien dich dang tiep nhan ung ho</h2>
        <ul className="data-list">
          {activeCampaigns.map((campaign) => (
            <li key={campaign._id} className="data-item">
              <div>
                <p className="item-title">{campaign.name}</p>
                <p className="item-subtitle">{campaign.code}</p>
                <p className="item-subtitle">
                  Muc tieu: {campaign.targetAmount.toLocaleString("vi-VN")} VND
                </p>
              </div>
              <span className="pill ok">active</span>
            </li>
          ))}
          {activeCampaigns.length === 0 ? <li>Hien tai chua co campaign dang mo.</li> : null}
        </ul>

        <h2 className="public-subsection-title">Dong gop da xac minh gan day</h2>
        <ul className="data-list">
          {recentVerified.map((donation) => (
            <li key={donation._id} className="data-item">
              <div>
                <p className="item-title">{donation.donorName}</p>
                <p className="item-subtitle">
                  {donation.amount.toLocaleString("vi-VN")} VND · {donation.campaignCode}
                </p>
              </div>
              <span className="pill verified">verified</span>
            </li>
          ))}
          {recentVerified.length === 0 ? <li>Chua co donation verified de hien thi.</li> : null}
        </ul>
      </article>
    </section>
  );
}
