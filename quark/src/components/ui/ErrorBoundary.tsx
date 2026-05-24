import { Component, type ErrorInfo, type ReactNode } from 'react'
import css from './ErrorBoundary.module.css'

interface Props {
  children: ReactNode
  /** Brief description shown in the fallback UI, e.g. "editor" */
  area?: string
}

interface State {
  error: Error | null
}

/**
 * Catches render errors in a subtree and shows a friendly fallback instead of
 * crashing the entire app shell.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.area ?? 'unknown'}]`, error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className={css.fallback}>
          <p className={css.title}>Something went wrong{this.props.area ? ` in the ${this.props.area}` : ''}.</p>
          <pre className={css.message}>{this.state.error.message}</pre>
          <button className={css.retry} onClick={() => this.setState({ error: null })}>
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
