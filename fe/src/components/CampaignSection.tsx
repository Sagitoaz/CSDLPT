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
        <h2>Tao campaign moi</h2>
        <form className="form-grid" onSubmit={(event) => void submitCampaign(event)}>
          <label>
            Ma campaign
            <input
              value={form.code}
              onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
              required
              minLength={2}
            />
          </label>

          <label>
            Ten campaign
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
              minLength={2}
            />
          </label>

          <label>
            Muc tieu (VND)
            <input
              type="number"
              min={0}
              value={form.targetAmount}
              onChange={(event) => setForm((prev) => ({ ...prev, targetAmount: Number(event.target.value) }))}
              required
            />
          </label>

          <label>
            Mo ta
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
            Campaign dang hoat dong
          </label>

          <button type="submit">Tao campaign</button>
        </form>
      </article>

      <article className="panel">
        <div className="panel-headline">
          <h2>Danh sach campaigns</h2>
          <form
            className="inline-search"
            onSubmit={(event) => {
              event.preventDefault();
              void onRefresh();
            }}
          >
            <input
              placeholder="Tim theo ma hoac ten..."
              value={campaignSearch}
              onChange={(event) => setCampaignSearch(event.target.value)}
            />
            <button type="submit">Tim</button>
          </form>
        </div>

        <ul className="data-list">
          {campaigns.map((campaign) => (
            <li key={campaign._id} className="data-item">
              <div>
                <p className="item-title">{campaign.name}</p>
                <p className="item-subtitle">
                  {campaign.code} · Target {campaign.targetAmount.toLocaleString("vi-VN")} VND
                </p>
              </div>
              <span className={campaign.isActive ? "pill ok" : "pill off"}>
                {campaign.isActive ? "active" : "inactive"}
              </span>
            </li>
          ))}
          {campaigns.length === 0 ? <li>Chua tim thay campaign.</li> : null}
        </ul>
      </article>
    </section>
  );
}
