const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const oktaController = require('./controllers/oktaController');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

// Server-side rendered settings page (before static files)
app.get('/settings.html', async (req, res) => {
  try {
    const settingsPath = path.join(__dirname, '..', 'public', 'settings.html');
    let html = await fs.readFile(settingsPath, 'utf8');
    
    // Get current configuration
    const oktaDomain = process.env.OKTA_DOMAIN || '';
    const oktaToken = process.env.OKTA_API_TOKEN || '';
    
    // Create the config display HTML
    const configDisplay = `<div class="config-item">
                        <span class="config-label">Okta Domain:</span>
                        <span class="config-value">${oktaDomain || 'Not set'}</span>
                    </div>
                    <div class="config-item">
                        <span class="config-label">API Token:</span>
                        <span class="config-value">${oktaToken ? '••••••••••••••••' : 'Not set'}</span>
                    </div>
                    <div class="config-item">
                        <span class="config-label">Status:</span>
                        <span class="config-value" style="color: ${oktaDomain && oktaToken ? '#198754' : '#dc3545'}">
                            ${oktaDomain && oktaToken ? '✓ Configured' : '⚠ Incomplete'}
                        </span>
                    </div>`;
    
    console.log('🔧 Serving settings page with server-side rendering');
    console.log('Domain:', oktaDomain || 'Not set');
    console.log('Token:', oktaToken ? 'Configured' : 'Not set');
    
    // Replace the placeholder content
    html = html.replace(
      '<span class="config-value">Click "🔄 Reload" to load current settings</span>',
      configDisplay
    );
    
    // Inject current values into JavaScript for form pre-filling
    html = html.replace(
      '// Load current settings when page loads',
      `// Load current settings when page loads
        const CURRENT_DOMAIN = '${oktaDomain}';
        const CURRENT_TOKEN_SET = ${oktaToken ? 'true' : 'false'};`
    );
    
    res.send(html);
  } catch (error) {
    console.error('Error serving settings page:', error);
    res.status(500).send('Error loading settings page');
  }
});

// Static files middleware
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Okta Export API',
    version: '1.0.0',
    endpoints: {
      '/api/export/users': 'Export all users',
      '/api/export/groups': 'Export all groups',
      '/api/export/applications': 'Export all applications',
      '/api/export/all': 'Export complete Okta data',
      '/api/health': 'Health check'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Okta export routes
app.get('/api/export/users', oktaController.exportUsers);
app.get('/api/export/groups', oktaController.exportGroups);
app.get('/api/export/applications', oktaController.exportApplications);
app.get('/api/export/all', oktaController.exportAll);

// Configuration routes
app.get('/api/config', async (req, res) => {
  try {
    console.log('🔧 Configuration request received');
    console.log('OKTA_DOMAIN:', process.env.OKTA_DOMAIN);
    console.log('OKTA_API_TOKEN:', process.env.OKTA_API_TOKEN ? '***configured***' : 'NOT SET');
    
    const config = {
      oktaDomain: process.env.OKTA_DOMAIN || '',
      oktaToken: process.env.OKTA_API_TOKEN || ''
    };
    
    console.log('Sending config:', { ...config, oktaToken: config.oktaToken ? '***masked***' : 'empty' });
    res.json(config);
  } catch (error) {
    console.error('❌ Error in /api/config:', error);
    res.status(500).json({ error: 'Failed to load configuration' });
  }
});

app.post('/api/config', async (req, res) => {
  try {
    const { oktaDomain, oktaToken } = req.body;
    
    if (!oktaDomain || !oktaToken) {
      return res.status(400).json({ error: 'Both oktaDomain and oktaToken are required' });
    }
    
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = '';
    
    try {
      envContent = await fs.readFile(envPath, 'utf8');
    } catch (error) {
      // File doesn't exist, create new content
      envContent = '';
    }
    
    // Update or add OKTA_DOMAIN
    if (envContent.includes('OKTA_DOMAIN=')) {
      envContent = envContent.replace(/OKTA_DOMAIN=.*$/m, `OKTA_DOMAIN=${oktaDomain}`);
    } else {
      envContent += `OKTA_DOMAIN=${oktaDomain}\n`;
    }
    
    // Update or add OKTA_API_TOKEN
    if (envContent.includes('OKTA_API_TOKEN=')) {
      envContent = envContent.replace(/OKTA_API_TOKEN=.*$/m, `OKTA_API_TOKEN=${oktaToken}`);
    } else {
      envContent += `OKTA_API_TOKEN=${oktaToken}\n`;
    }
    
    await fs.writeFile(envPath, envContent.trim() + '\n');
    
    // Update process.env immediately
    process.env.OKTA_DOMAIN = oktaDomain;
    process.env.OKTA_API_TOKEN = oktaToken;
    
    res.json({ success: true, message: 'Configuration saved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save configuration: ' + error.message });
  }
});

app.post('/api/test-config', async (req, res) => {
  try {
    const { oktaDomain, oktaToken } = req.body;
    
    if (!oktaDomain || !oktaToken) {
      return res.status(400).json({ error: 'Both oktaDomain and oktaToken are required' });
    }
    
    // Test the connection by making a simple API call
    const testUrl = `https://${oktaDomain}/api/v1/users?limit=1`;
    const response = await fetch(testUrl, {
      headers: {
        'Authorization': `SSWS ${oktaToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      return res.status(400).json({ 
        error: `Okta API returned ${response.status}: ${response.statusText}`,
        details: errorData
      });
    }
    
    // Get user count for confirmation
    const userData = await response.json();
    const userCountResponse = await fetch(`https://${oktaDomain}/api/v1/users?limit=1`, {
      method: 'HEAD',
      headers: {
        'Authorization': `SSWS ${oktaToken}`,
        'Accept': 'application/json'
      }
    });
    
    let userCount = 'unknown';
    if (userCountResponse.ok) {
      const linkHeader = userCountResponse.headers.get('link');
      if (linkHeader) {
        const match = linkHeader.match(/&after=([^&>]+)/);
        if (match) {
          userCount = 'multiple';
        } else {
          userCount = userData.length;
        }
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Connection successful',
      userCount: userCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Connection test failed: ' + error.message });
  }
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Okta Export server running on port ${PORT}`);
  console.log(`📊 Access the API at http://localhost:${PORT}`);
  
  if (!process.env.OKTA_DOMAIN || !process.env.OKTA_API_TOKEN) {
    console.warn('⚠️  Warning: OKTA_DOMAIN and OKTA_API_TOKEN environment variables are required');
    console.warn('📝 Copy .env.example to .env and configure your Okta credentials');
  }
});

module.exports = app;
