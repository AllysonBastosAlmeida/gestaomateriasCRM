import { Component } from 'react'

export class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      errorMessage: '',
    }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Erro inesperado na interface.',
    }
  }

  componentDidCatch(error, errorInfo) {
    console.error('AppErrorBoundary', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#050b16] px-4">
          <div className="w-full max-w-md rounded-[24px] border border-white/10 bg-slate-950/80 p-6 text-center shadow-[0_24px_90px_rgba(0,0,0,0.5)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200">
              Falha temporaria
            </p>
            <h1 className="mt-3 text-xl font-bold text-white">
              A interface precisou ser recarregada
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {this.state.errorMessage}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Se o navegador estiver traduzindo a pagina automaticamente, desative a traducao e tente novamente.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white"
            >
              Recarregar
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
