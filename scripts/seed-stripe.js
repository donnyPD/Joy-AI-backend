const axios = require('axios');
const path = require('path');

require('dotenv').config({
  path: path.resolve(process.cwd(), '.env'),
});

const seedToken = process.env.STRIPE_SEED_TOKEN;
if (!seedToken) {
  console.error('Missing STRIPE_SEED_TOKEN in environment.');
  process.exit(1);
}

const seedUrl =
  process.env.STRIPE_SEED_URL || 'http://localhost:3000/api/billing/seed-plans';

async function seedStripePlans() {
  try {
    const response = await axios.post(seedUrl, { token: seedToken });
    console.log('Stripe seed response:', response.data);
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    const message = error.message || 'Unknown error';
    const code = error.code;
    const details = {
      status,
      code,
      message,
      data,
      seedUrl,
    };
    console.error('Stripe seed failed:', details);
    process.exit(1);
  }
}

seedStripePlans();
