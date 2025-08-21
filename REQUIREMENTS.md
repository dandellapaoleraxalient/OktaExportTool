# System Requirements

## Minimum Requirements

### Operating System
- **Windows**: Windows 10 or later
- **macOS**: macOS 10.15 (Catalina) or later  
- **Linux**: Ubuntu 18.04 LTS or equivalent (CentOS 7+, RHEL 7+, Debian 9+)

### Runtime Environment
- **Node.js**: Version 18.0.0 or higher (LTS recommended)
- **npm**: Version 8.0.0 or higher (comes with Node.js)

### Hardware Requirements
- **RAM**: Minimum 512 MB, Recommended 2 GB or more
- **Storage**: Minimum 100 MB free space for application + additional space for export files
- **CPU**: Any modern processor (x64 architecture)

### Network Requirements
- **Internet Connection**: Required for Okta API access
- **Firewall**: Allow outbound HTTPS (port 443) to your Okta domain
- **Port**: Application runs on port 4000 by default (configurable)

---

## Software Dependencies

### Required Node.js Packages
```json
{
  "express": "^4.18.2",           // Web framework
  "cors": "^2.8.5",              // Cross-origin resource sharing
  "dotenv": "^16.3.1",           // Environment variable management
  "json2csv": "^5.0.7",          // CSV export functionality
  "exceljs": "^4.4.0",           // Excel export functionality
  "helmet": "^7.1.0",            // Security middleware
  "compression": "^1.7.4"        // Response compression
}
```

### Development Dependencies (Optional)
```json
{
  "nodemon": "^3.0.1",           // Development server with auto-restart
  "jest": "^29.7.0"              // Testing framework
}
```

---

## Okta Requirements

### Okta Organization Access
- **Admin Access**: Required to generate API tokens
- **Okta Edition**: Works with all Okta editions (Developer, Workforce Identity, etc.)
- **API Token**: SSWS token with appropriate read permissions

### Required Okta Permissions
The API token must have permission to read:
- ✅ **Users** (`okta.users.read`)
- ✅ **Groups** (`okta.groups.read`) 
- ✅ **Applications** (`okta.apps.read`)

### Okta API Rate Limits
- **Standard**: 10,000 requests per minute
- **Developer**: 1,000 requests per minute
- Application includes built-in rate limiting and retry logic

---

## Browser Requirements (for Web Interface)

### Supported Browsers
- **Chrome**: Version 90+
- **Firefox**: Version 88+
- **Safari**: Version 14+
- **Edge**: Version 90+

### Browser Features Required
- ✅ JavaScript enabled
- ✅ Fetch API support
- ✅ ES6+ support
- ✅ File download capability

---

## Installation Prerequisites

### 1. Install Node.js
**Windows/macOS:**
- Download from [nodejs.org](https://nodejs.org/)
- Choose LTS version (18.x or higher)

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Linux (CentOS/RHEL):**
```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs npm
```

### 2. Verify Installation
```bash
node --version    # Should show v18.0.0 or higher
npm --version     # Should show 8.0.0 or higher
```

### 3. Install Application Dependencies
```bash
cd /path/to/okta-export
npm install
```

---

## Configuration Requirements

### Environment Variables
Create a `.env` file with:
```env
OKTA_DOMAIN=your-org.okta.com
OKTA_API_TOKEN=your_ssws_token_here
PORT=4000
NODE_ENV=production
```

### File Permissions
- **Read/Write Access**: Application directory
- **Write Access**: `reports/` directory (auto-created)
- **Read Access**: `.env` file

---

## Optional Production Requirements

### Process Manager (Recommended)
```bash
npm install -g pm2
```

### Reverse Proxy (Recommended)
- **Nginx**: For SSL termination and load balancing
- **Apache**: Alternative web server option

### SSL Certificate (Recommended)
- **Let's Encrypt**: Free SSL certificates
- **Commercial SSL**: For enterprise environments

### Monitoring (Optional)
- **Log Management**: Winston, Morgan, or similar
- **Application Monitoring**: New Relic, DataDog, or similar
- **Health Checks**: Built-in `/api/health` endpoint

---

## Security Recommendations

### Environment Security
- 🔒 **Never commit `.env` files** to version control
- 🔒 **Use strong API tokens** with minimal required permissions
- 🔒 **Enable HTTPS** in production environments
- 🔒 **Implement IP whitelisting** if possible
- 🔒 **Regular token rotation** for enhanced security

### Network Security
- 🔒 **Firewall rules**: Restrict access to application port
- 🔒 **VPN access**: Consider VPN for sensitive environments
- 🔒 **Rate limiting**: Built-in protection against abuse

---

## Troubleshooting Requirements

### Common Issues & Requirements

#### "Module not found" errors:
- ✅ Ensure Node.js 18+ is installed
- ✅ Run `npm install` in project directory
- ✅ Check internet connection for package downloads

#### "Permission denied" errors:
- ✅ Ensure write permissions to application directory
- ✅ Check firewall settings for port access
- ✅ Verify user permissions for Node.js execution

#### Okta API connection issues:
- ✅ Verify API token is valid and not expired
- ✅ Check network connectivity to Okta domain
- ✅ Confirm API token has required permissions
- ✅ Test with settings page connection test feature

---

## Quick Start Checklist

- [ ] Node.js 18+ installed
- [ ] npm 8+ available
- [ ] Project dependencies installed (`npm install`)
- [ ] `.env` file configured with Okta credentials
- [ ] Port 4000 available (or custom port configured)
- [ ] Internet connection to Okta domain
- [ ] Valid Okta API token with read permissions
- [ ] Application started (`npm start`)
- [ ] Web interface accessible at `http://localhost:4000`

---

## Performance Considerations

### Expected Performance
- **Users Export**: 1-10 seconds per 1,000 users
- **Groups Export**: 1-5 seconds per 100 groups
- **Applications Export**: 1-3 seconds per 50 applications
- **Memory Usage**: ~50-200 MB depending on data size

### Scaling Recommendations
- **Large Organizations (10k+ users)**: Consider increasing memory allocation
- **High Frequency Usage**: Implement caching strategies
- **Multiple Concurrent Users**: Use load balancer with multiple instances
