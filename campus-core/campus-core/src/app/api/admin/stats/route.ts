import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  try {
    // 1. Get counts from profiles
    const { data: profiles, error: profError } = await supabase
      .from('profiles')
      .select('role');

    if (profError) throw profError;

    const studentCount = profiles.filter(p => p.role === 'student').length;
    const facultyCount = profiles.filter(p => p.role === 'faculty').length;

    // 2. Get departments
    const { count: deptCount } = await supabase
      .from('departments')
      .select('*', { count: 'exact', head: true });

    // 3. Get courses
    const { count: courseCount } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true });

    // 4. Get active job postings
    const { count: jobCount } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true });

    // 5. Get recent logs
    const { data: logs } = await supabase
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(6);

    // 6. Get mock performance track counts for chart
    const trackData = [
      { name: 'Advanced', count: Math.ceil(studentCount * 0.35) },
      { name: 'Intermediate', count: Math.ceil(studentCount * 0.45) },
      { name: 'Beginner', count: Math.max(0, studentCount - Math.ceil(studentCount * 0.35) - Math.ceil(studentCount * 0.45)) }
    ];

    return NextResponse.json({
      students: studentCount,
      faculty: facultyCount,
      departments: deptCount || 0,
      courses: courseCount || 0,
      jobs: jobCount || 0,
      recentLogs: logs || [],
      trackData
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
