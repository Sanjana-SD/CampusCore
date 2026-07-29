import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

// Create Student / Faculty User (Admin Only)
export async function POST(request: NextRequest) {
  const supabaseAdmin = getAdminClient();

  try {
    const body = await request.json();
    const { 
      email, 
      password, 
      role, 
      full_name, 
      usn_emp_id, 
      department_id, 
      semester, 
      section, 
      phone_number, 
      profile_photo_url 
    } = body;

    if (!email || !password || !role || !full_name) {
      return NextResponse.json({ error: 'Email, password, role, and full name are required.' }, { status: 400 });
    }

    // 1. Create Auth User via admin API
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { 
        role, 
        full_name, 
        usn_emp_id, 
        department_id, 
        semester: semester ? parseInt(semester) : null, 
        section, 
        phone_number, 
        profile_photo_url 
      }
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    const newUser = authData.user;
    if (!newUser) {
      return NextResponse.json({ error: 'Failed to construct new user profile.' }, { status: 500 });
    }

    // 2. The PostgreSQL trigger automatically inserts into profiles.
    // Let's force an update to make sure all metadata elements are saved perfectly.
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        usn_emp_id,
        department_id: department_id || null,
        semester: semester ? parseInt(semester) : null,
        section: section || null,
        phone_number: phone_number || null,
        profile_photo_url: profile_photo_url || null
      })
      .eq('id', newUser.id);

    if (profileError) {
      console.warn('Profile sync warn:', profileError.message);
    }

    // 3. Log admin action
    await supabaseAdmin.from('admin_logs').insert({
      action_type: 'user_created',
      message: `Created ${role} account: ${email} (${full_name})`
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: 500 });
  }
}

// Fetch all profiles (Admin or Faculty checks)
export async function GET(request: NextRequest) {
  const supabaseAdmin = getAdminClient();
  const { searchParams } = new URL(request.url);
  const roleFilter = searchParams.get('role');
  const searchFilter = searchParams.get('search');

  try {
    let query = supabaseAdmin
      .from('profiles')
      .select('*, departments(name, code)');

    if (roleFilter) {
      query = query.eq('role', roleFilter);
    }
    
    const { data: profiles, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let filtered = profiles || [];
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      filtered = filtered.filter(p => 
        (p.full_name || '').toLowerCase().includes(q) ||
        (p.email || '').toLowerCase().includes(q) ||
        (p.usn_emp_id || '').toLowerCase().includes(q)
      );
    }

    return NextResponse.json(filtered);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Delete Profile & Auth Account (Admin Only)
export async function DELETE(request: NextRequest) {
  const supabaseAdmin = getAdminClient();
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID parameter is required.' }, { status: 400 });
  }

  try {
    // 1. Delete user from auth (this cascades to profiles in the db due to foreign key constraint)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    // 2. Log admin action
    await supabaseAdmin.from('admin_logs').insert({
      action_type: 'user_deleted',
      message: `Deleted account: ${userId}`
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
