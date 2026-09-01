export function ThemeToggle({ isLightMode, onToggle }: { isLightMode: boolean; onToggle: () => void }) {
  return (
    <button className="icon-btn theme-toggle" type="button" onClick={onToggle} aria-label="Cambiar tema">
      <i className={`ti ${isLightMode ? 'ti-moon' : 'ti-sun'}`} />
    </button>
  )
}
