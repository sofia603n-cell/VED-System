export function ThemeToggle({ isLightMode, onToggle }: { isLightMode: boolean; onToggle: () => void }) {
  return (
    <button
      className="icon-btn theme-toggle"
      type="button"
      onClick={onToggle}
      title={isLightMode ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
      aria-label="Cambiar tema"
    >
      <i className={`ti ${isLightMode ? 'ti-moon' : 'ti-sun'}`} />
    </button>
  )
}
