import { OverviewStats, DonationStatus } from "../types";

interface HeroProps {
  overview: OverviewStats;
  statusTotals: Record<DonationStatus, number>;
  mode: "public" | "admin";
}

export function Hero({ overview, statusTotals, mode }: HeroProps) {
  function goToSection(sectionId: string) {
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <header className="hero">
      <div className="hero-main">
        <div>
          <p className="hero-kicker">NỀN TẢNG THIỆN NGUYỆN SỐ</p>
          <h1>
            {mode === "public"
              ? "Cùng nhau lan tỏa điều tốt đẹp, tạo tác động bền vững"
              : "Bảng điều khiển vận hành quyên góp"}
          </h1>
          <p className="hero-subtitle">
            {mode === "public"
              ? "Ủng hộ chiến dịch bạn quan tâm trong vài giây. Mọi giao dịch được cập nhật rõ ràng để cộng đồng cùng theo dõi."
              : "Chế độ quản trị cho phép theo dõi tổng quan, quản lý chiến dịch và xử lý quyên góp theo từng trạng thái cụ thể."}
          </p>

          {mode === "public" ? (
            <div className="hero-actions">
              <button type="button" onClick={() => goToSection("featured-campaigns")}>Khám phá chiến dịch</button>
              <button type="button" className="ghost-button" onClick={() => goToSection("public-donate")}>Bắt đầu gây quỹ</button>
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
          <span>LƯỢT ỦNG HỘ</span>
          <strong>{overview.donations.totalDonations}</strong>
        </article>
        <article className="metric-card reveal-item">
          <span>TỔNG SỐ TIỀN</span>
          <strong>{overview.donations.totalAmount.toLocaleString("vi-VN")} VND</strong>
        </article>
        <article className="metric-card reveal-item">
          <span>CHIẾN DỊCH HOẠT ĐỘNG</span>
          <strong>
            {overview.campaigns.active}/{overview.campaigns.total}
          </strong>
        </article>
        <article className="metric-card reveal-item">
          <span>ĐÃ XÁC MINH / ĐANG CHỜ</span>
          <strong>
            {statusTotals.verified} / {statusTotals.pending}
          </strong>
        </article>
      </div>
    </header>
  );
}
