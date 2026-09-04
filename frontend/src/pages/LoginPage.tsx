import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser } from '../api/mockApi'
import { useToast } from '../context/ToastContext'
import type { User } from '../types'

export function LoginPage({ user, setUser }: { user: User | null; setUser: (user: User | null) => void }) {
  const navigate = useNavigate()
  const { success, error: toastError } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loginAttempts, setLoginAttempts] = useState(() => parseInt(sessionStorage.getItem('loginAttempts') || '0', 10))
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  const maxAttempts = 5

  const performLogin = async (loginEmail: string, loginPass: string) => {
    setIsLoading(true)
    setError('')

    try {
      const result = await loginUser(loginEmail.trim(), loginPass)
      if (!result) {
        const nextAttempts = loginAttempts + 1
        setLoginAttempts(nextAttempts)
        sessionStorage.setItem('loginAttempts', String(nextAttempts))
        const msg = nextAttempts >= maxAttempts
          ? 'Cuenta bloqueada por múltiples intentos fallidos.'
          : 'Credenciales inválidas. Verifica tu usuario o contraseña.'
        setError(msg)
        toastError(msg, 'Error de inicio de sesión')
        setIsLoading(false)
        return
      }

      sessionStorage.setItem('velas_user', JSON.stringify(result))
      sessionStorage.setItem('loginAttempts', '0')
      setUser(result)
      success(`¡Bienvenido de nuevo, ${result.name}!`, 'Acceso correcto')
      navigate('/dashboard', { replace: true })
    } catch {
      setError('Error al comunicar con el servidor o autenticación.')
      toastError('No se pudo completar el inicio de sesión', 'Error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (loginAttempts >= maxAttempts) {
      setError('Cuenta temporalmente bloqueada por seguridad.')
      return
    }
    if (!email.trim() || !password) {
      setError('Por favor ingresa tu usuario y contraseña.')
      return
    }

    await performLogin(email, password)
  }

  const handleQuickDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail)
    setPassword(demoPass)
    setError('')
    setLoginAttempts(0)
    sessionStorage.setItem('loginAttempts', '0')
    performLogin(demoEmail, demoPass)
  }

  const handleResetAttempts = () => {
    setLoginAttempts(0)
    sessionStorage.setItem('loginAttempts', '0')
    setError('')
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <img src="/logo.jpeg" alt="Velas Estrella de David" className="login-logo-img" />
        </div>

        <h1 className="login-title">Velas Estrella de David</h1>
        <p className="login-sub">Sistema Integral de Inventario, Ventas y Gestión</p>

        {/* Quick Demo Access Bar */}
        <div className="login-quick-demo">
          <div className="quick-demo-title">
            <i className="ti ti-bolt" /> Acceso Rápido (Modo Demo):
          </div>
          <div className="quick-demo-btns">
            <button
              type="button"
              className="btn-demo-pill"
              onClick={() => handleQuickDemo('ana@velas.test', 'admin123')}
              title="Entrar como Super Administrador"
            >
              <i className="ti ti-crown" style={{ color: 'var(--gold)' }} /> Super Admin
            </button>
            <button
              type="button"
              className="btn-demo-pill"
              onClick={() => handleQuickDemo('carlos@velas.test', 'carlos123')}
              title="Entrar como Administrador regular"
            >
              <i className="ti ti-shield-check" style={{ color: 'var(--primary-light)' }} /> Admin
            </button>
          </div>
        </div>

        {error && (
          <div className="login-error">
            <i className="ti ti-alert-circle" />
            <div style={{ flex: 1 }}>{error}</div>
            {loginAttempts >= maxAttempts && (
              <button
                type="button"
                onClick={handleResetAttempts}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--gold)',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                }}
              >
                Desbloquear
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label">Usuario, Correo o DNI</label>
            <input
              type="text"
              className="form-input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ej. ana@velas.test o 1234567890"
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label">Contraseña</label>
            <div className="password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                minLength={4}
                required
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                <i className={`ti ${showPassword ? 'ti-eye-off' : 'ti-eye'}`} />
              </button>
            </div>
            {loginAttempts > 0 && loginAttempts < maxAttempts && (
              <span style={{ fontSize: '0.72rem', color: 'var(--warning)', marginTop: '4px', display: 'block' }}>
                Intentos restantes antes de bloqueo: {maxAttempts - loginAttempts}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '8px' }}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <i className="ti ti-loader ti-spin" /> Verificando...
              </>
            ) : (
              <>
                <i className="ti ti-login" /> Iniciar sesión
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
