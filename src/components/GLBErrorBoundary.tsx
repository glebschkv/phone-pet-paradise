import { Component, ReactNode } from 'react';

interface GLBErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface GLBErrorBoundaryState {
  hasError: boolean;
}

export class GLBErrorBoundary extends Component<GLBErrorBoundaryProps, GLBErrorBoundaryState> {
  constructor(props: GLBErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): GLBErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.warn('GLB model failed to load:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}