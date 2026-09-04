'use client';

import React, { Component } from 'react';
import styles from './ErrorBoundary.module.css';

const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback({
            error: this.state.error,
            reset: this.handleReset,
          });
        }
        return this.props.fallback;
      }

      return (
        <div className={styles.errorContainer}>
          <div className={styles.iconWrap}>
            <AlertIcon />
          </div>
          <h2 className={styles.title}>
            {this.props.title || 'Something went wrong'}
          </h2>
          <p className={styles.message}>
            {this.props.message || 'An error occurred in this section. You can try refreshing or resetting the component.'}
          </p>
          {this.state.error?.message && (
            <div className={styles.details}>
              {this.state.error.message}
            </div>
          )}
          <button
            type="button"
            className={styles.retryBtn}
            onClick={this.handleReset}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
