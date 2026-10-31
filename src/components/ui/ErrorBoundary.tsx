import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[NeuroSim ErrorBoundary Caught]:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('neurosim_current_user');
      localStorage.removeItem('neurosim_current_room_code');
    } catch {}
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#e6dfce] text-[#242a38] p-4 select-none">
          <div className="w-full max-w-md bg-[#f4ead5] border-2 border-[#355c5a] rounded-lg shadow-xl p-6 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-[#9e4736]/15 text-[#9e4736] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#242a38]">Pemulihan Antarmuka NeuroSim</h2>
              <p className="text-xs text-[#242a38]/80 mt-1 leading-relaxed">
                Terjadi kendala sementara pada peralihan antarmuka. Silakan muat ulang atau kembali ke denah kantor utama.
              </p>
              {this.state.error?.message && (
                <div className="mt-3 p-2 bg-[#e6dfce] rounded border border-[#d1c7b5] text-[11px] font-mono text-[#9e4736] text-left overflow-x-auto max-h-24">
                  {this.state.error.message}
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2 text-xs font-semibold rounded bg-[#355c5a] text-[#fbf8ee] hover:bg-[#284846] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Muat Ulang
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 text-xs font-semibold rounded bg-[#e6dfce] hover:bg-[#ded5c2] border border-[#d1c7b5] text-[#242a38] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                Reset ke Kantor 2D
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

