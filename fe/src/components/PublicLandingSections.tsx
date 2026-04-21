import { Campaign, Donation, OverviewStats } from "../types";

interface PublicLandingSectionsProps {
  overview: OverviewStats;
  campaigns: Campaign[];
  donations: Donation[];
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 21s-6.7-4.3-9.3-8.1C.7 10.1 1.2 6.7 3.6 5.1a5.5 5.5 0 0 1 6.4.3l2 1.7 2-1.7a5.5 5.5 0 0 1 6.4-.3c2.4 1.6 2.9 5 1 7.8C18.7 16.7 12 21 12 21Z" fill="currentColor" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 2 4 5v6c0 5.4 3.5 9.3 8 11 4.5-1.7 8-5.6 8-11V5l-8-3Zm3.4 8.1-4 4a1 1 0 0 1-1.4 0l-2-2 1.4-1.4 1.3 1.3 3.3-3.3 1.4 1.4Z" fill="currentColor" />
    </svg>
  );
}

function LightningIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M13 2 5 13h6l-1 9 9-12h-6l1-8Z" fill="currentColor" />
    </svg>
  );
}

export function PublicLandingSections({ overview, campaigns, donations }: PublicLandingSectionsProps) {
  const activeCampaigns = campaigns.filter((campaign) => campaign.isActive);
  const featuredCampaigns = activeCampaigns.slice(0, 6);
  const verifiedDonations = donations.filter((donation) => donation.status === "verified");

  const raisedByCampaign: Record<string, number> = {};
  for (const donation of donations) {
    raisedByCampaign[donation.campaignCode] = (raisedByCampaign[donation.campaignCode] || 0) + donation.amount;
  }

  const organizations = campaigns.slice(0, 4).map((campaign, index) => ({
    name: campaign.name,
    handle: `@${campaign.code}`,
    rank: index + 1,
    total: raisedByCampaign[campaign.code] || 0
  }));

  return (
    <>
      <section className="public-categories reveal-item" aria-label="Danh muc chien dich">
        <button className="category-pill is-selected" type="button">Thien tai</button>
        <button className="category-pill" type="button">Tre em</button>
        <button className="category-pill" type="button">Xoa doi giam ngheo</button>
        <button className="category-pill" type="button">Y te</button>
        <button className="category-pill" type="button">Giao duc</button>
        <button className="category-pill" type="button">Cong dong</button>
      </section>

      <section className="landing-features">
        <article className="feature-card reveal-item">
          <span className="feature-icon" aria-hidden="true"><HeartIcon /></span>
          <h3>Ung ho de dang</h3>
          <p>Chon chien dich, nhap thong tin va hoan tat ung ho trong vai buoc ngan gon.</p>
        </article>
        <article className="feature-card reveal-item">
          <span className="feature-icon" aria-hidden="true"><ShieldIcon /></span>
          <h3>Minh bach du lieu</h3>
          <p>Trang thai donation va tong gia tri gay quy duoc cap nhat lien tuc cho cong dong.</p>
        </article>
        <article className="feature-card reveal-item">
          <span className="feature-icon" aria-hidden="true"><LightningIcon /></span>
          <h3>Toi uu mobile</h3>
          <p>Bo cuc va thao tac duoc thiet ke uu tien dien thoai, giup ung ho moi luc moi noi.</p>
        </article>
      </section>

      <section className="public-section reveal-item">
        <div className="section-head">
          <h2>Chien dich gay quy noi bat</h2>
          <button type="button" className="link-button">Xem tat ca</button>
        </div>
        <div className="campaign-cards-grid">
          {featuredCampaigns.map((campaign) => {
            const raised = raisedByCampaign[campaign.code] || 0;
            const ratio = campaign.targetAmount > 0 ? Math.min(100, (raised / campaign.targetAmount) * 100) : 0;
            return (
              <article key={campaign._id} className="campaign-card">
                <div className="campaign-media" />
                <div className="campaign-body">
                  <h3>{campaign.name}</h3>
                  <p className="campaign-meta">{campaign.code} · cap nhat theo tien do gay quy</p>
                  <p className="campaign-amount">
                    {raised.toLocaleString("vi-VN")} <span>/ {campaign.targetAmount.toLocaleString("vi-VN")} VND</span>
                  </p>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${ratio}%` }} />
                  </div>
                  <div className="campaign-footer">
                    <span>{ratio.toFixed(0)}%</span>
                    <button type="button">Ung ho</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="public-section reveal-item">
        <div className="section-head">
          <h2>To chuc, ca nhan gay quy noi bat</h2>
          <button type="button" className="link-button">Xem tat ca</button>
        </div>
        <div className="organizer-grid">
          {organizations.map((org) => (
            <article key={org.handle} className="organizer-card">
              <div className="organizer-avatar">{org.name.slice(0, 1).toUpperCase()}</div>
              <div>
                <h3>{org.name}</h3>
                <p>{org.handle}</p>
                <strong>{org.total.toLocaleString("vi-VN")} VND</strong>
              </div>
              <button type="button">Theo doi</button>
            </article>
          ))}
        </div>
      </section>

      <section className="public-section reveal-item">
        <div className="section-head">
          <h2>Su kien thien nguyen</h2>
          <button type="button" className="link-button">Xem lich</button>
        </div>
        <ul className="event-list">
          {activeCampaigns.slice(0, 5).map((campaign) => (
            <li key={campaign._id} className="event-item">
              <div>
                <h3>{campaign.name}</h3>
                <p>{campaign.code} · cap nhat lien tuc theo tien do donation</p>
              </div>
              <span className="event-tag">Dang dien ra</span>
            </li>
          ))}
          {activeCampaigns.length === 0 ? <li className="event-item">Chua co su kien dang mo.</li> : null}
        </ul>
      </section>

      <section className="trust-band reveal-item">
        <article>
          <span>CHIEN DICH HOAT DONG</span>
          <strong>{activeCampaigns.length}</strong>
        </article>
        <article>
          <span>DONATION VERIFIED</span>
          <strong>{verifiedDonations.length}</strong>
        </article>
        <article>
          <span>TONG SO TIEN GAY QUY</span>
          <strong>{overview.donations.totalAmount.toLocaleString("vi-VN")} VND</strong>
        </article>
      </section>

      <section className="impact-steps reveal-item" aria-label="Quy trinh ung ho">
        <h2>Ket noi trieu trai tim, tao tac dong den tung chien dich</h2>
        <p>
          "He thong giup moi khoan dong gop duoc cong khai, minh bach va truyen cam hung cho cong dong chung tay."
        </p>
        <div className="impact-actions">
          <button type="button">Kham pha chien dich</button>
          <button type="button" className="ghost-action">Bat dau gay quy</button>
        </div>
      </section>
    </>
  );
}
