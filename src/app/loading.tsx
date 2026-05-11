export default function Loading() {
  return (
    <div className="site-loader">
      <div className="site-loader-card">
        <div className="site-loader-stars">✧ ✦ ✧</div>

        <img className="site-loader-logo" src="/logo-pic.png" alt="LUNÉ" />
        <img className="site-loader-name" src="/name.png" alt="LUNÉ Piercing Boutique" />

        <p>Завантаження</p>

        <div className="site-loader-dots">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}