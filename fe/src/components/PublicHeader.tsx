export function PublicHeader() {
  return (
    <header className="public-header reveal-item">
      <div className="brand-lockup">
        <div className="brand-mark" aria-hidden="true">TN</div>
        <div>
          <p className="brand-title">Thiện Nguyện Số</p>
          <p className="brand-subtitle">Cộng đồng nhân ái, kết nối minh bạch</p>
        </div>
      </div>

      <nav className="public-nav" aria-label="Điều hướng công khai">
        <a href="#">Chiến dịch</a>
        <a href="#">Tổ chức</a>
        <a href="#">Sự kiện</a>
        <a href="#">Đồng hành</a>
      </nav>

      <div className="public-header-cta">
        <button type="button" className="header-ghost">Tải app</button>
        <button type="button">Bắt đầu</button>
      </div>
    </header>
  );
}
