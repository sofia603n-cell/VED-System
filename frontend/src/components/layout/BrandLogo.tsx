import logoImg from '/logo.jpeg'

export function BrandLogo() {
  return (
    <div className="sidebar-logo">
      <div className="logo-img-wrap">
        <img src={logoImg} alt="Estrella de David" />
      </div>
      <div className="brand-name">Velas Estrella de David</div>
      <div className="brand-sub">Fábrica de veladoras</div>
    </div>
  )
}
