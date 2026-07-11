import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-softBg p-6 font-sans">
          <div className="max-w-lg rounded-2xl border border-gold/25 bg-base p-6 shadow-lg">
            <h1 className="mb-2 font-display text-xl font-bold text-deepGreen">Page error</h1>
            <p className="mb-3 text-[0.9rem] text-[#666666]">This page failed to load. Details:</p>
            <pre className="overflow-auto rounded-lg bg-nav p-3 text-[0.8rem] text-deepGreen">
              {this.state.error.message}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
