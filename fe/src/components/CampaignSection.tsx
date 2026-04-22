import { FormEvent, useState } from "react";
import { Campaign } from "../types";

const initialCampaignForm = {
  code: "",
  name: "",
  description: "",
  targetAmount: 10000000,
  isActive: true
};

interface CampaignSectionProps {
  campaigns: Campaign[];
  campaignSearch: string;
  setCampaignSearch: (value: string) => void;
  onCreateCampaign: (payload: {
    code: string;
    name: string;
    description?: string;
    targetAmount: number;
    isActive?: boolean;
  }) => Promise<boolean>;
  onRefresh: () => Promise<void>;
}

export function CampaignSection({
  campaigns,
  campaignSearch,
  setCampaignSearch,
  onCreateCampaign,
  onRefresh
}: CampaignSectionProps) {
  const [form, setForm] = useState(initialCampaignForm);

  async function submitCampaign(event: FormEvent) {
    event.preventDefault();
    const ok = await onCreateCampaign({
      code: form.code,
      name: form.name,
      description: form.description || undefined,
      targetAmount: Number(form.targetAmount),
      isActive: form.isActive
    });

    if (ok) {
      setForm(initialCampaignForm);
    }
  }

  return (
    <section className="panel-grid campaigns-layout">
      <article className="panel">
        <h2>Tạo chiến dịch mới</h2>
        <form className="form-grid" onSubmit={(event) => void submitCampaign(event)}>
          <label>
            Mã chiến dịch
            <input
              value={form.code}
              onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
              required
              minLength={2}
            />
          </label>

          <label>
            Tên chiến dịch
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
              minLength={2}
            />
          </label>

          <label>
            Mục tiêu (VND)
            <input
              type="number"
              min={0}
              value={form.targetAmount}
              onChange={(event) => setForm((prev) => ({ ...prev, targetAmount: Number(event.target.value) }))}
              required
            />
          </label>

          <label>
            Mô tả
            <textarea
              rows={4}
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
            />
            Chiến dịch đang hoạt động
          </label>

          <button type="submit">Tạo chiến dịch</button>
        </form>
      </article>

      <article className="panel">
        <div className="panel-headline">
          <h2>Danh sách chiến dịch</h2>
          <form
            className="inline-search"
            onSubmit={(event) => {
              event.preventDefault();
              void onRefresh();
            }}
          >
            <input
              placeholder="Tìm theo mã hoặc tên..."
              value={campaignSearch}
              onChange={(event) => setCampaignSearch(event.target.value)}
            />
            <button type="submit">Tìm</button>
          </form>
        </div>

        <ul className="data-list">
          {campaigns.map((campaign) => (
            <li key={campaign._id} className="data-item">
              <div>
                <p className="item-title">{campaign.name}</p>
                <p className="item-subtitle">
                  {campaign.code} · Mục tiêu {campaign.targetAmount.toLocaleString("vi-VN")} VND
                </p>
              </div>
              <span className={campaign.isActive ? "pill ok" : "pill off"}>
                {campaign.isActive ? "đang mở" : "tạm dừng"}
              </span>
            </li>
          ))}
          {campaigns.length === 0 ? <li>Chưa tìm thấy chiến dịch.</li> : null}
        </ul>
      </article>
    </section>
  );
}
