/**
 * Seed script to create dummy user with sample data for UI/UX testing
 *
 * Usage: npx tsx scripts/seed-dummy-user.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error(
    'Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seedDummyUser() {
  console.log('🌱 Starting seed process...\n');

  // 1. Create dummy user
  const email = 'demo@orbit.test';
  const password = 'demo1234';

  console.log('👤 Creating dummy user:', email);

  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: 'Demo User',
      },
    });

  if (authError) {
    if (authError.message.includes('already exists')) {
      console.log('✅ User already exists, getting user ID...');
      const { data: existingUser } = await supabase.auth.admin.listUsers();
      const user = existingUser?.users.find((u: any) => u.email === email);
      if (!user) {
        console.error('❌ Could not find existing user');
        return;
      }
      return seedUserData(user.id);
    }
    console.error('❌ Error creating user:', authError);
    return;
  }

  const userId = authData.user!.id;
  console.log('✅ User created:', userId);

  await seedUserData(userId);
}

async function seedUserData(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // 2. Create profile
  console.log('\n📋 Creating profile...');
  const { error: profileError } = await supabase.from('profiles').upsert({
    user_id: userId,
    display_name: 'Demo User',
    timezone: 'America/New_York',
    public_profile_enabled: true,
    username: 'demouser',
  });

  if (profileError) console.error('Profile error:', profileError);
  else console.log('✅ Profile created');

  // 3. Create money accounts
  console.log('\n💰 Creating accounts...');
  const { data: accounts } = await supabase
    .from('money_accounts')
    .insert([
      {
        user_id: userId,
        name: 'Checking',
        account_type: 'bank',
        balance: 2500,
        balance_limit_mode: 'soft',
        minimum_balance: 500,
      },
      {
        user_id: userId,
        name: 'Savings',
        account_type: 'savings',
        balance: 15000,
        balance_limit_mode: 'strict',
        minimum_balance: 10000,
      },
      {
        user_id: userId,
        name: 'Cash',
        account_type: 'cash',
        balance: 150,
        balance_limit_mode: 'none',
      },
    ])
    .select();

  console.log('✅ Created 3 accounts');

  // 4. Create transactions
  if (accounts && accounts.length > 0) {
    console.log('\n💸 Creating transactions...');
    await supabase.from('transactions').insert([
      {
        user_id: userId,
        amount: 50,
        type: 'expense',
        category: 'Food',
        description: 'Groceries',
        from_account_id: accounts[0].id,
        transaction_date: today,
      },
      {
        user_id: userId,
        amount: 12.5,
        type: 'expense',
        category: 'Transport',
        description: 'Uber',
        from_account_id: accounts[0].id,
        transaction_date: today,
      },
      {
        user_id: userId,
        amount: 3.5,
        type: 'expense',
        category: 'Food',
        description: 'Coffee',
        from_account_id: accounts[2].id,
        transaction_date: yesterday,
      },
      {
        user_id: userId,
        amount: 2500,
        type: 'income',
        category: 'Salary',
        description: 'Monthly salary',
        to_account_id: accounts[0].id,
        transaction_date: yesterday,
      },
    ]);
    console.log('✅ Created 4 transactions');
  }

  // 5. Create tasks
  console.log('\n✅ Creating tasks...');
  await supabase.from('tasks').insert([
    {
      user_id: userId,
      title: 'Review Q1 Report',
      priority: 'high',
      status: 'pending',
      scheduled_at: `${today}T14:00:00Z`,
    },
    {
      user_id: userId,
      title: 'Call dentist for appointment',
      priority: 'medium',
      status: 'pending',
      scheduled_at: `${today}T10:00:00Z`,
    },
    {
      user_id: userId,
      title: 'Fix leaky faucet',
      priority: 'low',
      status: 'pending',
      scheduled_at: `${tomorrow}T09:00:00Z`,
    },
    {
      user_id: userId,
      title: 'Completed task example',
      priority: 'medium',
      status: 'completed',
      scheduled_at: `${yesterday}T11:00:00Z`,
    },
  ]);
  console.log('✅ Created 4 tasks');

  // 6. Create habits
  console.log('\n🔁 Creating habits...');
  const { data: habitTasks } = await supabase
    .from('tasks')
    .insert([
      { user_id: userId, title: 'Morning Meditation', is_template: true },
      { user_id: userId, title: 'Drink 8 glasses of water', is_template: true },
    ])
    .select();

  if (habitTasks) {
    await supabase.from('repeat_rules').insert([
      {
        user_id: userId,
        task_id: habitTasks[0].id,
        rule_type: 'daily',
        rule_config: {},
      },
      {
        user_id: userId,
        task_id: habitTasks[1].id,
        rule_type: 'daily',
        rule_config: {},
      },
    ]);
    console.log('✅ Created 2 daily habits');
  }

  // 7. Create notes
  console.log('\n📝 Creating notes...');
  await supabase.from('notes').insert([
    {
      user_id: userId,
      title: 'Project Ideas',
      content:
        'Brainstorming new features for Orbit:\n- Dark mode toggle\n- Export data feature\n- Mobile app',
    },
    {
      user_id: userId,
      title: 'Meeting Notes',
      content:
        'Weekly team sync:\n- Discussed Q1 goals\n- Reviewed roadmap\n- Action items assigned',
    },
    {
      user_id: userId,
      title: 'Shopping List',
      content: '- Milk\n- Bread\n- Eggs\n- Coffee beans',
    },
  ]);
  console.log('✅ Created 3 notes');

  console.log('\n✨ Seed complete!\n');
  console.log('📧 Email:', 'demo@orbit.test');
  console.log('🔑 Password:', 'demo1234');
  console.log('\n🔗 Login at: http://localhost:3000/login');
}

seedDummyUser()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
