const fs = require('fs');
const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

let hostname;

try {
  const parsed = new URL(SUPABASE_URL);
  hostname = parsed.hostname;
} catch (error) {
  console.error('Invalid SUPABASE_URL. Expected format: https://<project-ref>.supabase.co');
  process.exit(1);
}

const options = {
  hostname,
  path: '/rest/v1/',
  headers: {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  },
};

https
  .get(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      if (res.statusCode && res.statusCode >= 400) {
        console.error(`Failed to download Swagger. HTTP ${res.statusCode}`);
        console.error(data);
        process.exit(1);
      }

      fs.writeFileSync('packages/api-client/swagger.json', data);
      console.log('Swagger downloaded successfully: packages/api-client/swagger.json');
    });
  })
  .on('error', (err) => {
    console.error('Error downloading Swagger:', err.message);
    process.exit(1);
  });