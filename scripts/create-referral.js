#!/usr/bin/env node

/**
 * Create Referral Code Script
 * Run: node scripts/create-referral.js NAFIJ26
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseServiceKey) console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nAdd these to fauntend/.env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createReferralCode(code, role = 'user', maxUses = 0) {
  try {
    console.log(`\n🔑 Creating referral code: ${code}\n`);

    // Check if exists
    const { data: existing, error: checkError } = await supabase
      .from('special_referrals')
      .select('id')
      .eq('code', code.toUpperCase())
      .single();

    if (existing) {
      console.error('❌ Referral code already exists!');
      return false;
    }

    if (checkError?.code !== 'PGRST116') {
      // PGRST116 = no rows returned (expected)
      console.error('❌ Database error:', checkError?.message);
      return false;
    }

    // Create the referral
    const { data, error } = await supabase
      .from('special_referrals')
      .insert({
        code: code.toUpperCase(),
        role,
        max_uses: maxUses,
        current_uses: 0,
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to create referral:', error.message);
      return false;
    }

    console.log('✅ Referral code created successfully!\n');
    console.log('📋 Details:');
    console.log(`   Code: ${data.code}`);
    console.log(`   Role: ${data.role}`);
    console.log(`   Max Uses: ${data.max_uses === 0 ? 'Unlimited' : data.max_uses}`);
    console.log(`   Status: Active`);
    console.log(`   Created: ${new Date(data.created_at).toLocaleString()}\n`);

    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// Get code from command line
const code = process.argv[2];
if (!code) {
  console.error('❌ Usage: node scripts/create-referral.js NAFIJ26 [role] [max-uses]');
  console.error('   Example: node scripts/create-referral.js NAFIJ26 user 0');
  process.exit(1);
}

const role = process.argv[3] || 'user';
const maxUses = parseInt(process.argv[4] || '0');

createReferralCode(code, role, maxUses).then(success => {
  process.exit(success ? 0 : 1);
});
