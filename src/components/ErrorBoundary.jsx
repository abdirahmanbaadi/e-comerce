import { Component } from 'react';

function isBenignDomError(error) {
  const message = String(error?.message || error || '');
  return /removeChild|insertBefore|NotFoundError/i.test(message);
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    // Browser extensions / page translate often cause removeChild during React updates.
    // Auto-recover instead of trapping the user on a dead error screen.
    if (isBenignDomError(error)) {
      return { error: null };
    }
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);

    if (isBenignDomError(error)) {
      const key = 'mmf_dom_recover';
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        window.setTimeout(() => window.location.reload(), 50);
      } else {
        sessionStorage.removeItem(key);
      }
    }
  }

  handleRetry = () => {
    this.setState({ error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-softBg p-6 font-sans">
          <div className="max-w-lg rounded-2xl border border-gold/25 bg-base p-6 shadow-lg">
            <h1 className="mb-2 font-display text-xl font-bold text-deepGreen">Page error</h1>
            <p className="mb-3 text-[0.9rem] text-[#666666]">
              This page failed to load. You can retry or go back to the home page.
            </p>
            <pre className="mb-4 max-h-40 overflow-auto rounded-lg bg-nav p-3 text-[0.8rem] text-deepGreen">
              {this.state.error.message}
            </pre>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-xl bg-deepGreen px-4 py-2 text-[0.88rem] font-bold text-white"
                onClick={this.handleRetry}
              >
                Retry
              </button>
              <a
                href="/"
                className="inline-flex items-center rounded-xl border border-deepGreen/20 px-4 py-2 text-[0.88rem] font-bold text-deepGreen no-underline"
              >
                Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
