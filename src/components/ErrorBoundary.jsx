import React from 'react';
import Button from './ui/Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-6">
                        <AlertTriangle size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Ops! Algo deu errado.</h1>
                    <p className="text-slate-600 mb-6 max-w-md">
                        Ocorreu um erro inesperado na aplicação. Tente recarregar a página.
                    </p>

                    {/* DEBUG MODE ENABLED */}
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <div className="bg-slate-900 text-slate-200 p-4 rounded-lg text-left text-xs font-mono mb-6 w-full max-w-lg overflow-auto max-h-48">
                            <p className="text-red-400 font-bold mb-2">{this.state.error.toString()}</p>
                            <pre>{this.state.errorInfo?.componentStack}</pre>
                        </div>
                    )}

                    <Button onClick={this.handleReset}>
                        <RefreshCw size={18} className="mr-2" />
                        Recarregar Página
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
