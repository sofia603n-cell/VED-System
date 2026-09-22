import { Suspense } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ToastContainer } from './components/common/ToastContainer'
import { AppRoutes } from './components/component/AppRoutes'
import { ToastProvider } from './context/ToastContext'

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="route-loading" role="status">Cargando...</div>}>
          <AppRoutes />
        </Suspense>
        <ToastContainer />
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
