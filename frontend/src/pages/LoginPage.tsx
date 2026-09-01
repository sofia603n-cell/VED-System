import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser } from '../api/mockApi'
import type { User } from '../types'

export function LoginPage({ user, setUser }: { user: User | null; setUser: (user: User | null) => void }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loginAttempts, setLoginAttempts] = useState(() => parseInt(sessionStorage.getItem('loginAttempts') || '0', 10))
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  const maxAttempts = 3

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (loginAttempts >= maxAttempts) {
      setError('Cuenta bloqueada por demasiados intentos fallidos.')
      return
    }

    const result = await loginUser(email.trim(), password)
    if (!result) {
      const nextAttempts = loginAttempts + 1
      setLoginAttempts(nextAttempts)
      sessionStorage.setItem('loginAttempts', String(nextAttempts))
      setError(nextAttempts >= maxAttempts ? 'Cuenta bloqueada por 3 intentos fallidos.' : 'Usuario o contraseña incorrectos.')
      return
    }

    sessionStorage.setItem('velas_user', JSON.stringify(result))
    sessionStorage.setItem('loginAttempts', '0')
    setUser(result)
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="login-page">
      <div className="login-wrap">
        <div className="login-card">
          <div className="login-logo">
            <img src="/logo.jpeg" alt="Estrella de David" />
          </div>

          <div className="login-title">Bienvenido</div>
          <div className="login-sub">Accede al panel de administración</div>

          {error ? (
            <div className={`login-error ${loginAttempts >= maxAttempts ? 'blocked' : ''}`}>
              <i className="ti ti-alert-circle" /> {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">Usuario / DNI / correo</label>
              <input
                type="text"
                className="form-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="usuario, DNI o correo"
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <div className="password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button type="button" className="eye-btn" onClick={() => setShowPassword((value) => !value)}>
                  <i className={`ti ${showPassword ? 'ti-eye-off' : 'ti-eye'}`} />
                </button>
              </div>
              <div className="attempts-left">
                {loginAttempts > 0 ? `Intentos restantes: ${Math.max(0, maxAttempts - loginAttempts)}` : ''}
              </div>
            </div>

            <a href="#" className="login-forgot">¿Olvidaste tu contraseña?</a>

            <button type="submit" className="btn-primary full-width">
              <i className="ti ti-login" /> Iniciar sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
