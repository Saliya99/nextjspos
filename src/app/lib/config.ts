// Environment Configuration Checker
export const config = {
  // API Configuration
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  backEndUrl: process.env.NEXT_PUBLIC_BACKEND_URL,
  
  // App Configuration
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Feature Flags
  enableDebugLogs: process.env.NODE_ENV === 'development',
  enableErrorBoundary: true,
  
  // Validation
  isValid() {
    const issues: string[] = []
    
    if (!this.apiUrl) {
      issues.push('NEXT_PUBLIC_API_URL is not configured')
    }
    
    if (!this.siteUrl) {
      issues.push('NEXT_PUBLIC_SITE_URL is not configured')
    }
    
    return {
      valid: issues.length === 0,
      issues
    }
  },
  
  // Log configuration in development
  logConfig() {
    if (this.enableDebugLogs) {
      console.group('🔧 Application Configuration')
      console.log('API URL:', this.apiUrl)
      console.log('Site URL:', this.siteUrl)
      console.log('Environment:', this.nodeEnv)
      
      const validation = this.isValid()
      if (!validation.valid) {
        console.warn('⚠️ Configuration Issues:', validation.issues)
      } else {
        console.log('✅ Configuration is valid')
      }
      console.groupEnd()
    }
  }
}

// Auto-log configuration on import in development
if (typeof window !== 'undefined' && config.enableDebugLogs) {
  config.logConfig()
}

export default config