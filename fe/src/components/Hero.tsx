import { OverviewStats, DonationStatus } from "../types";

interface HeroProps {
  overview: OverviewStats;
  statusTotals: Record<DonationStatus, number>;
  mode: "public" | "admin";
}

export function Hero({ overview, statusTotals, mode }: HeroProps) {
  return (
    <header className="hero">
      <div className="hero-main">
        <div>
          <p className="hero-kicker">NEN TANG THIEN NGUYEN SO</p>
          <h1>
            {mode === "public"
              ? "Cung nhau lan toa dieu tot dep, tao tac dong ben vung"
              : "Bang dieu khien van hanh quyen gop"}
          </h1>
          <p className="hero-subtitle">
            {mode === "public"
              ? "Ung ho chien dich ban quan tam trong vai giay. Moi giao dich duoc cap nhat ro rang de cong dong cung theo doi."
              : "Che do quan tri cho phep theo doi tong quan, quan ly campaign va xu ly donation theo tung trang thai cu the."}
          </p>

          {mode === "public" ? (
            <div className="hero-actions">
              <button type="button">Kham pha chien dich</button>
              <button type="button" className="ghost-button">Bat dau gay quy</button>
            </div>
          ) : null}
        </div>

        {mode === "public" ? (
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-phone">
              <div className="hero-phone-head" />
              <div className="hero-phone-line" />
              <div className="hero-phone-line short" />
              <div className="hero-phone-progress">
                <span />
              </div>
              <div className="hero-phone-chip" />
            </div>
            <div className="hero-bubble bubble-a" />
            <div className="hero-bubble bubble-b" />
          </div>
        ) : null}
      </div>

      <div className="hero-grid">
        <article className="metric-card reveal-item">
          <span>LUOT UNG HO</span>
          <strong>{overview.donations.totalDonations}</strong>
        </article>
        <article className="metric-card reveal-item">
          <span>TONG SO TIEN</span>
          <strong>{overview.donations.totalAmount.toLocaleString("vi-VN")} VND</strong>
        </article>
        <article className="metric-card reveal-item">
          <span>CHIEN DICH HOAT DONG</span>
          <strong>
            {overview.campaigns.active}/{overview.campaigns.total}
          </strong>
        </article>
        <article className="metric-card reveal-item">
          <span>VERIFIED / PENDING</span>
          <strong>
            {statusTotals.verified} / {statusTotals.pending}
          </strong>
        </article>
      </div>
    </header>
  );
}
