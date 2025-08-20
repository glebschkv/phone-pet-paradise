import { Component, ReactNode } from 'react';

interface GLBErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  modelPath?: string;
}

interface GLBErrorBoundaryState {
  hasError: boolean;
  errorMessage?: string;
}

export class GLBErrorBoundary extends Component<GLBErrorBoundaryProps, GLBErrorBoundaryState> {
  constructor(props: GLBErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): GLBErrorBoundaryState {
    console.warn(`🚨 GLBErrorBoundary: Error caught, triggering primitive fallback:`, error.message);
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error(`❌ GLBErrorBoundary: GLB model ${this.props.modelPath || 'unknown'} failed to load, falling back to primitive:`, error.message);
    console.error('🔍 Error details:', error);
    console.error('📋 Component stack:', errorInfo.componentStack);
  }

  componentDidUpdate(prevProps: GLBErrorBoundaryProps) {
    // Reset error state when modelPath changes
    if (prevProps.modelPath !== this.props.modelPath && this.state.hasError) {
      console.log(`🔄 GLBErrorBoundary: Model path changed, resetting error state`);
      this.setState({ hasError: false, errorMessage: undefined });
    }
  }

  render() {
    if (this.state.hasError) {
      console.log(`🎭 GLBErrorBoundary: Rendering primitive fallback for ${this.props.modelPath}`);
      return this.props.fallback;
    }

    return this.props.children;
  }
}