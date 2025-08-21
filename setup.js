#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Okta Export Tool Setup');
console.log('==========================\n');

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function setup() {
  try {
    console.log('Let\'s configure your Okta connection...\n');
    
    const oktaDomain = await question('Enter your Okta domain (e.g., company.okta.com): ');
    const apiToken = await question('Enter your Okta API token: ');
    const port = await question('Enter the port to run on (default: 3000): ') || '3000';
    const format = await question('Default export format [excel/csv/json] (default: excel): ') || 'excel';
    const includeDeactivated = await question('Include deactivated users? [y/N]: ');
    
    const envContent = `# Okta Export Configuration
OKTA_DOMAIN=${oktaDomain}
OKTA_API_TOKEN=${apiToken}
PORT=${port}

# Report Configuration  
EXPORT_FORMAT=${format}
INCLUDE_DEACTIVATED_USERS=${includeDeactivated.toLowerCase().startsWith('y') ? 'true' : 'false'}
MAX_RESULTS_PER_REQUEST=200
`;

    fs.writeFileSync('.env', envContent);
    
    console.log('\n✅ Configuration saved to .env file');
    console.log('\n🎯 Next steps:');
    console.log('   1. npm start                     # Start the server');
    console.log('   2. Open http://localhost:' + port + '     # Access the web interface');
    console.log('   3. Start exporting your Okta data! 🎉');
    console.log('\n📚 For more information, see README.md');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

// Check if .env already exists
if (fs.existsSync('.env')) {
  console.log('⚠️  .env file already exists.');
  question('Do you want to overwrite it? [y/N]: ').then((answer) => {
    if (answer.toLowerCase().startsWith('y')) {
      setup();
    } else {
      console.log('Setup cancelled. You can manually edit .env or run this setup again.');
      rl.close();
    }
  });
} else {
  setup();
}
