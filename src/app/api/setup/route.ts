import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Setup Route Handler
export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  if (!supabaseServiceKey) {
    return NextResponse.json({ error: 'Supabase service key is missing on the server.' }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    // 1. Check if any admin profile already exists
    const { data: admins, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (admins && admins.length > 0) {
      return NextResponse.json({ error: 'Administrator already exists. Setup is disabled.' }, { status: 403 });
    }

    // 2. Parse form inputs
    const { email, password, full_name, phone_number } = await request.json();
    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Email, password, and full name are required.' }, { status: 400 });
    }

    // 3. Create initial Auth user using service role
    const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'admin', full_name }
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    const newUser = data.user;
    if (!newUser) {
      return NextResponse.json({ error: 'Failed to create user object.' }, { status: 500 });
    }

    // 4. Update profiles phone number (since trigger creates default profile)
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ phone_number })
      .eq('id', newUser.id);

    if (updateError) {
      console.warn('Admin phone update warn:', updateError.message);
    }

    // Log the setup event
    await supabaseAdmin.from('admin_logs').insert({
      action_type: 'system_setup',
      message: `System initialized. Administrator ${email} created.`
    });

    return NextResponse.json({ success: true, message: 'System setup completed successfully!' });
  } catch (err: any) {
    console.error('Setup endpoint exception:', err);
    return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: 500 });
  }
}

// Check admin status helper
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  if (!supabaseServiceKey) {
    return NextResponse.json({ setupRequired: true, warning: 'Service key missing' });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const { data: admins } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    const setupRequired = !admins || admins.length === 0;
    return NextResponse.json({ setupRequired });
  } catch {
    return NextResponse.json({ setupRequired: true });
  }
}
