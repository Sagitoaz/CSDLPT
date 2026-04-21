import { Campaign, DonationStatus, OverviewStats } from "../types";

interface DashboardSectionProps {
  campaigns: Campaign[];
  campaignRaised: Record<string, number>;
  statusTotals: Record<DonationStatus, number>;
  overview: OverviewStats;
}

export function DashboardSection({ campaigns, campaignRaised, statusTotals, overview }: DashboardSectionProps) {
  return (
    <section className="panel-grid">
      <article className="panel">
        <h2>Campaign tien do</h2>
        <ul className="campaign-progress-list">
          {campaigns.map((campaign) => {
            const raised = campaignRaised[campaign.code] || 0;
            const ratio = campaign.targetAmount <= 0 ? 0 : Math.min(100, (raised / campaign.targetAmount) * 100);

            return (
              <li key={campaign._id} className="campaign-progress-item">
                <div className="campaign-row">
                  <strong>{campaign.name}</strong>
                  <span>{ratio.toFixed(0)}%</span>
                </div>
                <p>
                  {raised.toLocaleString("vi-VN")} / {campaign.targetAmount.toLocaleString("vi-VN")} VND
                </p>
                <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(ratio)}>
                  <div className="progress-fill" style={{ width: `${ratio}%` }} />
                </div>
              </li>
            );
          })}
          {campaigns.length === 0 ? <li>Chua co campaign nao.</li> : null}
        </ul>
      </article>

      <article className="panel">
        <h2>Trang thai donation</h2>
        <div className="status-cards">
          <div className="status-card pending">
            <span>Pending</span>
            <strong>{statusTotals.pending}</strong>
          </div>
          <div className="status-card verified">
            <span>Verified</span>
            <strong>{statusTotals.verified}</strong>
          </div>
          <div className="status-card rejected">
            <span>Rejected</span>
            <strong>{statusTotals.rejected}</strong>
          </div>
        </div>
        <p className="generated-at">
          So lieu cap nhat luc {new Date(overview.generatedAt).toLocaleString("vi-VN")}
        </p>
      </article>
    </section>
  );
}
