import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

interface CommandItem {
  id: string
  title: string
  category: 'Navegación' | 'Acciones'
  icon: string
  path: string
  shortcut?: string
}

const COMMANDS: CommandItem[] = [
  { id: 'dash', title: 'Dashboard', category: 'Navegación', icon: 'ti-layout-dashboard', path: '/dashboard' },
  { id: 'prod', title: 'Catálogo de Productos', category: 'Navegación', icon: 'ti-candle', path: '/productos' },
  { id: 'stock', title: 'Control de Stock e Inventario', category: 'Navegación', icon: 'ti-package', path: '/stock' },
  { id: 'entradas', title: 'Entradas de Mercancía', category: 'Navegación', icon: 'ti-arrow-bar-to-down', path: '/entradas' },
  { id: 'ventas', title: 'Registro de Ventas', category: 'Navegación', icon: 'ti-shopping-bag', path: '/ventas' },
  { id: 'reportes', title: 'Reportes y Estadísticas', category: 'Navegación', icon: 'ti-chart-bar', path: '/reportes' },
  { id: 'usuarios', title: 'Gestión de Usuarios', category: 'Navegación', icon: 'ti-users', path: '/usuarios' },
  { id: 'auditoria', title: 'Auditoría del Sistema', category: 'Navegación', icon: 'ti-clipboard-list', path: '/auditoria' },
  { id: 'act-sale', title: 'Registrar nueva venta', category: 'Acciones', icon: 'ti-plus', path: '/ventas' },
  { id: 'act-prod', title: 'Crear nuevo producto', category: 'Acciones', icon: 'ti-candle', path: '/productos' },
  { id: 'act-entry', title: 'Registrar entrada de stock', category: 'Acciones', icon: 'ti-box', path: '/entradas' },
]

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (isOpen) {
          onClose()
        } else {
          // Open handled by caller or state
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return COMMANDS
    const q = query.toLowerCase()
    return COMMANDS.filter((cmd) => cmd.title.toLowerCase().includes(q) || cmd.category.toLowerCase().includes(q))
  }, [query])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  if (!isOpen) return null

  const handleSelect = (item: CommandItem) => {
    navigate(item.path)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length))
    } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
      e.preventDefault()
      handleSelect(filteredCommands[selectedIndex])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <div className="modal-backdrop command-backdrop" onClick={onClose}>
      <div className="command-modal" onClick={(e) => e.stopPropagation()}>
        <div className="command-header">
          <i className="ti ti-search command-search-icon" />
          <input
            autoFocus
            type="text"
            className="command-input"
            placeholder="Escribe un comando o busca una pantalla... (Ej: ventas, stock)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="command-kbd">ESC</kbd>
        </div>

        <div className="command-list">
          {filteredCommands.length === 0 ? (
            <div className="command-empty">No se encontraron resultados para "{query}"</div>
          ) : (
            filteredCommands.map((item, index) => (
              <div
                key={item.id}
                className={`command-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="command-item-left">
                  <i className={`ti ${item.icon} command-item-icon`} />
                  <span className="command-item-title">{item.title}</span>
                </div>
                <span className="command-item-cat">{item.category}</span>
              </div>
            ))
          )}
        </div>

        <div className="command-footer">
          <span>Usa las teclas <kbd>↑</kbd> <kbd>↓</kbd> para navegar</span>
          <span><kbd>Enter</kbd> para seleccionar</span>
        </div>
      </div>
    </div>
  )
}

