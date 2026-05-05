import { useEffect, useMemo, useState } from "react";
import { Campaign, DonationStatus, OverviewStats } from "../types";

const DASHBOARD_CAMPAIGNS_PER_PAGE = 6;

interface DashboardSectionProps {
  campaigns: Campaign[];
  campaignRaised: Record<string, number>;
  statusTotals: Record<DonationStatus, number>;
  overview: OverviewStats;
}

export function DashboardSection({ campaigns, campaignRaised, statusTotals, overview }: DashboardSectionProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(campaigns.length / DASHBOARD_CAMPAIGNS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pagedCampaigns = useMemo(() => {
    const start = (currentPage - 1) * DASHBOARD_CAMPAIGNS_PER_PAGE;
    return campaigns.slice(start, start + DASHBOARD_CAMPAIGNS_PER_PAGE);
  }, [campaigns, currentPage]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <section className="panel-grid">
      <article className="panel">
        <h2>Tiến độ chiến dịch</h2>
        <ul className="campaign-progress-list">
          {pagedCampaigns.map((campaign) => {
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
          {campaigns.length === 0 ? <li>Chưa có chiến dịch nào.</li> : null}
        </ul>

        {campaigns.length > DASHBOARD_CAMPAIGNS_PER_PAGE ? (
          <div className="pagination" role="navigation" aria-label="Phân trang tiến độ chiến dịch">
            <button type="button" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1}>
              Trang trước
            </button>
            <span>
              Trang {currentPage}/{totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Trang sau
            </button>
          </div>
        ) : null}
      </article>

      <article className="panel">
        <h2>Trạng thái quyên góp</h2>
        <div className="status-cards">
          <div className="status-card pending">
            <span>Đang chờ</span>
            <strong>{statusTotals.pending}</strong>
          </div>
          <div className="status-card verified">
            <span>Đã xác minh</span>
            <strong>{statusTotals.verified}</strong>
          </div>
          <div className="status-card rejected">
            <span>Từ chối</span>
            <strong>{statusTotals.rejected}</strong>
          </div>
        </div>
        <p className="generated-at">
          Số liệu cập nhật lúc {new Date(overview.generatedAt).toLocaleString("vi-VN")}
        </p>
      </article>
    </section>
  );
}
