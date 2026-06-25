'use client'
import { Component } from 'react'
import { Button } from '@/components/ui/button'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] flex items-center justify-center px-5">
          <div className="text-center max-w-md">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="font-display text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-[#A0A0C8] text-sm mb-4">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <Button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="btn-primary border-0"
            >
              Try again
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
