# Environment Setup Guide

## Environment Variables Configuration

Create a `.env.local` file in the root directory with the following variables:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api

# Development Settings
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Database Configuration (if needed for backend)
# DB_HOST=localhost
# DB_PORT=3306
# DB_NAME=udara_prod
# DB_USER=root
# DB_PASSWORD=
```

## Configuration Options

### API Settings

- **NEXT_PUBLIC_API_URL**: The base URL for your backend API
  - Default: `http://127.0.0.1:8000/api`
  - For production: `https://your-domain.com/api` // Need to update

### Development vs Production

#### Development Mode
```env
NODE_ENV=development
```
- Enables debug logging
- Uses mock API by default
- Shows detailed error messages

#### Production Mode
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-production-api.com/script
```
- Disables debug logging
- Uses real API
- Optimized error handling

## Backend Server Requirements

1. **XAMPP/WAMP Server** is running
2. **MySQL Database** is configured
3. **PHP Scripts** are accessible at the configured URL
4. **CORS** is properly configured for cross-origin requests

### Testing Backend Connection

The application automatically tests the backend connection by trying to reach:
```
{NEXT_PUBLIC_API_URL}/test.php
```

If this fails, it automatically falls back to mock data.

## Troubleshooting

### Common Issues

1. **"Backend server is not available"**
   - Check if XAMPP/WAMP is running
   - Verify the API_URL path is correct
   - Ensure PHP scripts are accessible

2. **Environment variables not loading**
   - Ensure `.env.local` is in the root directory (not in src/)
   - Restart the development server after changing env vars
   - Check that variable names start with `NEXT_PUBLIC_` for client-side access

3. **CORS errors**
   - Add CORS headers to your PHP backend
   - Or use mock API during development

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

This will show:
- API configuration on startup
- Server connection test results
- Fallback to mock data notifications

## Quick Start

1. **For Development (Recommended)**:
   ```env
   ```
   
2. **For Testing with Backend**:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost/your-backend-path/script
   ```

3. **Start the application**:
   ```bash
   npm run dev
   ```

The application will automatically detect if the backend is available and fall back to mock data if needed.