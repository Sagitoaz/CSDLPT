import { FormEvent, useEffect, useMemo, useState } from "react";

type DonationStatus = "pending" | "verified" | "rejected";

type Donation = {
  _id: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  campaignCode: string;
  note?: string;
  status: DonationStatus;
  createdAt: string;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://100.105.34.84:8080/api";

export function App() {
  const [rows, setRows] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    donorName: "",
    donorEmail: "",
    amount: 10000,
    campaignCode: "hoc-bong-2026",
    note: ""
  });

  const totalAmount = useMemo(() => rows.reduce((sum, r) => sum + r.amount, 0), [rows]);

  async function loadDonations() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/donations`);
      if (!res.ok) throw new Error("Cannot fetch donations");
      const data = (await res.json()) as Donation[];
      setRows(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDonations();
  }, []);

  async function createDonation(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const payload = {
      ...form,
      amount: Number(form.amount)
    };

    const res = await fetch(`${API_BASE}/donations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      setError("Tao donation that bai");
      return;
    }

    setForm((prev) => ({ ...prev, donorName: "", donorEmail: "", note: "" }));
    await loadDonations();
  }

  async function updateStatus(id: string, status: DonationStatus) {
    const res = await fetch(`${API_BASE}/donations/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });

    if (!res.ok) {
      setError("Cap nhat trang thai that bai");
      return;
    }

    await loadDonations();
  }

  return (
    <div className="page">
      <header className="hero">
        <h1>He thong quyen gop tu thien phan tan</h1>
        <p>Web dung chung cho nhom 6 nguoi - CSDLPT voi MongoDB Replica Set</p>
        <div className="metrics">
          <div>
            <span>Tong giao dich</span>
            <strong>{rows.length}</strong>
          </div>
          <div>
            <span>Tong so tien</span>
            <strong>{totalAmount.toLocaleString("vi-VN")} VND</strong>
          </div>
        </div>
      </header>

      <main className="grid">
        <section className="card">
          <h2>Tao luot quyen gop</h2>
          <form onSubmit={createDonation} className="form" data-testid="donation-form">
            <input
              data-testid="donation-form-name-input"
              placeholder="Ho ten nguoi quyen gop"
              value={form.donorName}
              onChange={(e) => setForm((f) => ({ ...f, donorName: e.target.value }))}
              required
            />
            <input
              data-testid="donation-form-email-input"
              type="email"
              placeholder="Email"
              value={form.donorEmail}
              onChange={(e) => setForm((f) => ({ ...f, donorEmail: e.target.value }))}
              required
            />
            <input
              data-testid="donation-form-amount-input"
              type="number"
              min={1000}
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
              required
            />
            <input
              data-testid="donation-form-campaign-input"
              placeholder="Ma chien dich"
              value={form.campaignCode}
              onChange={(e) => setForm((f) => ({ ...f, campaignCode: e.target.value }))}
              required
            />
            <textarea
              data-testid="donation-form-note-input"
              placeholder="Ghi chu"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
            <button data-testid="donation-form-submit-button" type="submit">
              Gui quyen gop
            </button>
          </form>
          {error ? <p className="error">{error}</p> : null}
        </section>

        <section className="card">
          <div className="list-header">
            <h2>Danh sach quyên gop</h2>
            <button data-testid="donation-refresh-button" onClick={() => void loadDonations()} disabled={loading}>
              {loading ? "Dang tai..." : "Lam moi"}
            </button>
          </div>

          <ul className="donation-list" data-testid="donation-list">
            {rows.map((row) => (
              <li key={row._id} className="item" data-testid={`donation-item-${row._id}`}>
                <div>
                  <strong>{row.donorName}</strong>
                  <p>{row.amount.toLocaleString("vi-VN")} VND - {row.campaignCode}</p>
                  <small>{new Date(row.createdAt).toLocaleString("vi-VN")}</small>
                </div>
                <div className="actions">
                  <span className={`status ${row.status}`}>{row.status}</span>
                  <button onClick={() => void updateStatus(row._id, "verified")}>Duyet</button>
                  <button onClick={() => void updateStatus(row._id, "rejected")}>Tu choi</button>
                </div>
              </li>
            ))}
            {rows.length === 0 ? <li>Chua co du lieu</li> : null}
          </ul>
        </section>
      </main>
    </div>
  );
}
