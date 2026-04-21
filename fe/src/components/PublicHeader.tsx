export function PublicHeader() {
  return (
    <header className="public-header reveal-item">
      <div className="brand-lockup">
        <div className="brand-mark" aria-hidden="true">TN</div>
        <div>
          <p className="brand-title">Thien Nguyen So</p>
          <p className="brand-subtitle">Cong dong nhan ai ket noi minh bach</p>
        </div>
      </div>

      <nav className="public-nav" aria-label="Public navigation">
        <a href="#">Chien dich</a>
        <a href="#">To chuc</a>
        <a href="#">Su kien</a>
        <a href="#">Dong hanh</a>
      </nav>

      <div className="public-header-cta">
        <button type="button" className="header-ghost">Tai app</button>
        <button type="button">Bat dau</button>
      </div>
    </header>
  );
}
