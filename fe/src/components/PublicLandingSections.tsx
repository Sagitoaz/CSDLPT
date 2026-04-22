import { useEffect, useMemo, useState } from "react";
import { Campaign, Donation, OverviewStats } from "../types";
import { campaignImages, eventImages, organizerImages, testimonialImage } from "../assets/charityImages";

interface PublicLandingSectionsProps {
  overview: OverviewStats;
  campaigns: Campaign[];
  donations: Donation[];
}

type CategoryKey = "all" | "disaster" | "children" | "poverty" | "health" | "education" | "community";

const categories: Array<{ key: CategoryKey; label: string; keywords: string[] }> = [
  { key: "all", label: "Tất cả", keywords: [] },
  { key: "disaster", label: "Thiên tai", keywords: ["thiên tai", "bão", "lũ", "cứu trợ", "flood", "relief"] },
  { key: "children", label: "Trẻ em", keywords: ["trẻ em", "em nhỏ", "nhi đồng", "children", "bé"] },
  { key: "poverty", label: "Xóa đói giảm nghèo", keywords: ["nghèo", "xóa đói", "hộ nghèo", "cơm", "gạo", "poverty"] },
  { key: "health", label: "Y tế", keywords: ["y tế", "bệnh", "viện", "thuốc", "medical", "health"] },
  { key: "education", label: "Giáo dục", keywords: ["học", "trường", "giáo dục", "học bổng", "education", "school"] },
  { key: "community", label: "Cộng đồng", keywords: ["cộng đồng", "đồng hành", "xã hội", "community", "hỗ trợ"] }
];

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
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
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("all");
  const [galleryIndex, setGalleryIndex] = useState(0);
  const activeCampaigns = campaigns.filter((campaign) => campaign.isActive);
  const filteredCampaigns = useMemo(() => {
    if (selectedCategory === "all") {
      return activeCampaigns;
    }

    const current = categories.find((item) => item.key === selectedCategory);
    if (!current) {
      return activeCampaigns;
    }

    return activeCampaigns.filter((campaign) => {
      const combined = normalizeText(`${campaign.name} ${campaign.description || ""} ${campaign.code}`);
      return current.keywords.some((keyword) => combined.includes(normalizeText(keyword)));
    });
  }, [activeCampaigns, selectedCategory]);

  const featuredCampaigns = filteredCampaigns.slice(0, 6);
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

  useEffect(() => {
    if (campaignImages.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setGalleryIndex((prev) => (prev + 1) % campaignImages.length);
    }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  function goToSection(sectionId: string) {
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function goToPreviousImage() {
    setGalleryIndex((prev) => (prev - 1 + campaignImages.length) % campaignImages.length);
  }

  function goToNextImage() {
    setGalleryIndex((prev) => (prev + 1) % campaignImages.length);
  }

  return (
    <>
      <section className="public-categories reveal-item" aria-label="Danh mục chiến dịch">
        {categories.map((category) => (
          <button
            key={category.key}
            className={selectedCategory === category.key ? "category-pill is-selected" : "category-pill"}
            type="button"
            onClick={() => setSelectedCategory(category.key)}
            aria-pressed={selectedCategory === category.key}
          >
            {category.label}
          </button>
        ))}
      </section>

      <section className="landing-features">
        <article className="feature-card reveal-item">
          <span className="feature-icon" aria-hidden="true"><HeartIcon /></span>
          <h3>Ủng hộ dễ dàng</h3>
          <p>Chọn chiến dịch, nhập thông tin và hoàn tất ủng hộ trong vài bước ngắn gọn.</p>
        </article>
        <article className="feature-card reveal-item">
          <span className="feature-icon" aria-hidden="true"><ShieldIcon /></span>
          <h3>Minh bạch dữ liệu</h3>
          <p>Trạng thái quyên góp và tổng giá trị gây quỹ được cập nhật liên tục cho cộng đồng.</p>
        </article>
        <article className="feature-card reveal-item">
          <span className="feature-icon" aria-hidden="true"><LightningIcon /></span>
          <h3>Tối ưu thiết bị di động</h3>
          <p>Bố cục và thao tác được thiết kế ưu tiên điện thoại, giúp ủng hộ mọi lúc mọi nơi.</p>
        </article>
      </section>

      <section className="public-section reveal-item" id="featured-campaigns">
        <div className="section-head">
          <h2>Chiến dịch gây quỹ nổi bật</h2>
          <button type="button" className="link-button">Xem tất cả</button>
        </div>

        <div className="campaign-gallery" aria-label="Bộ sưu tập ảnh chiến dịch thiện nguyện">
          <button
            type="button"
            className="gallery-nav"
            aria-label="Ảnh trước"
            onClick={goToPreviousImage}
          >
            ‹
          </button>
          <img
            src={campaignImages[galleryIndex]}
            alt={`Ảnh thiện nguyện ${galleryIndex + 1}`}
            loading="lazy"
          />
          <button
            type="button"
            className="gallery-nav"
            aria-label="Ảnh tiếp theo"
            onClick={goToNextImage}
          >
            ›
          </button>
        </div>

        <div className="campaign-cards-grid">
          {featuredCampaigns.map((campaign, index) => {
            const raised = raisedByCampaign[campaign.code] || 0;
            const ratio = campaign.targetAmount > 0 ? Math.min(100, (raised / campaign.targetAmount) * 100) : 0;
            return (
              <article key={campaign._id} className="campaign-card">
                <div className="campaign-media">
                  <img
                    src={campaignImages[index % campaignImages.length]}
                    alt={`Hình ảnh hoạt động của chiến dịch ${campaign.name}`}
                    loading="lazy"
                  />
                </div>
                <div className="campaign-body">
                  <h3>{campaign.name}</h3>
                  <p className="campaign-meta">{campaign.code} · cập nhật theo tiến độ gây quỹ</p>
                  <p className="campaign-amount">
                    {raised.toLocaleString("vi-VN")} <span>/ {campaign.targetAmount.toLocaleString("vi-VN")} VND</span>
                  </p>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${ratio}%` }} />
                  </div>
                  <div className="campaign-footer">
                    <span>{ratio.toFixed(0)}%</span>
                    <button type="button">Ủng hộ</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {selectedCategory !== "all" && featuredCampaigns.length === 0 ? (
          <p className="public-note">Chưa có chiến dịch phù hợp danh mục đã chọn.</p>
        ) : null}
      </section>

      <section className="public-section reveal-item">
        <div className="section-head">
          <h2>Tổ chức, cá nhân gây quỹ nổi bật</h2>
          <button type="button" className="link-button">Xem tất cả</button>
        </div>
        <div className="organizer-grid">
          {organizations.map((org, index) => (
            <article key={org.handle} className="organizer-card">
              <div className="organizer-avatar">
                <img
                  src={organizerImages[index % organizerImages.length]}
                  alt={`Ảnh đại diện của ${org.name}`}
                  loading="lazy"
                />
              </div>
              <div>
                <h3>{org.name}</h3>
                <p>{org.handle}</p>
                <strong>{org.total.toLocaleString("vi-VN")} VND</strong>
              </div>
              <button type="button">Theo dõi</button>
            </article>
          ))}
        </div>
      </section>

      <section className="public-section reveal-item">
        <div className="section-head">
          <h2>Sự kiện thiện nguyện</h2>
          <button type="button" className="link-button">Xem lịch</button>
        </div>
        <ul className="event-list">
          {activeCampaigns.slice(0, 5).map((campaign, index) => (
            <li key={campaign._id} className="event-item">
              <img
                className="event-thumb"
                src={eventImages[index % eventImages.length]}
                alt={`Hình ảnh sự kiện ${campaign.name}`}
                loading="lazy"
              />
              <div>
                <h3>{campaign.name}</h3>
                <p>{campaign.code} · cập nhật liên tục theo tiến độ quyên góp</p>
              </div>
              <span className="event-tag">Đang diễn ra</span>
            </li>
          ))}
          {activeCampaigns.length === 0 ? <li className="event-item">Chưa có sự kiện đang mở.</li> : null}
        </ul>
      </section>

      <section className="trust-band reveal-item">
        <article>
          <span>CHIẾN DỊCH HOẠT ĐỘNG</span>
          <strong>{activeCampaigns.length}</strong>
        </article>
        <article>
          <span>QUYÊN GÓP ĐÃ XÁC MINH</span>
          <strong>{verifiedDonations.length}</strong>
        </article>
        <article>
          <span>TỔNG SỐ TIỀN GÂY QUỸ</span>
          <strong>{overview.donations.totalAmount.toLocaleString("vi-VN")} VND</strong>
        </article>
      </section>

      <section className="impact-steps reveal-item" aria-label="Quy trình ủng hộ">
        <div className="impact-media">
          <img src={testimonialImage} alt="Hoạt động thiện nguyện ngoài thực địa" loading="lazy" />
        </div>
        <h2>Kết nối triệu trái tim, tạo tác động đến từng chiến dịch</h2>
        <p>
          "Hệ thống giúp mọi khoản đóng góp được công khai, minh bạch và truyền cảm hứng cho cộng đồng chung tay."
        </p>
        <div className="impact-actions">
          <button type="button" onClick={() => goToSection("featured-campaigns")}>Khám phá chiến dịch</button>
          <button type="button" className="ghost-action" onClick={() => goToSection("public-donate")}>Bắt đầu gây quỹ</button>
        </div>
      </section>
    </>
  );
}
