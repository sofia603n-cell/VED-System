import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser } from '../api/mockApi'
import { LoginCard } from '../components/login/LoginCard'
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

  const handleResetAttempts = () => {
    setLoginAttempts(0)
    sessionStorage.setItem('loginAttempts', '0')
    setError('')
  }

  return <div className="login-page"><LoginCard email={email} password={password} error={error} loading={isLoading} attempts={loginAttempts} maxAttempts={maxAttempts} showPassword={showPassword} onEmail={setEmail} onPassword={setPassword} onTogglePassword={() => setShowPassword((value) => !value)} onResetAttempts={handleResetAttempts} onSubmit={handleSubmit} /></div>
}
