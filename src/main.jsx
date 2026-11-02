import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { HouseProvider } from './contexts/HouseContext'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 text-center">
          <div className="text-5xl mb-4">😕</div>
          <h1 className="text-lg font-semibold text-gray-800 mb-2">Algo correu mal</h1>
          <p className="text-sm text-gray-500 mb-6 max-w-xs">{this.state.error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium"
          >
            Recarregar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <AuthProvider>
      <HouseProvider>
        <App />
      </HouseProvider>
    </AuthProvider>
  </ErrorBoundary>
)
