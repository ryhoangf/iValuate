"use client"

import { Component } from "react"
import { Alert, Button } from "antd"

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", this.props.section, error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <Alert
          type="error"
          showIcon
          className="rounded-xl"
          title={this.props.title || "Something went wrong"}
          description={
            <div className="space-y-2">
              <p className="text-sm">{this.state.error.message || String(this.state.error)}</p>
              <Button size="small" onClick={() => this.setState({ error: null })}>
                Try again
              </Button>
            </div>
          }
        />
      )
    }
    return this.props.children
  }
}
