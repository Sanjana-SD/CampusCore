import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const { studentStatusList, subject_id, date, marked_by } = await request.json();

    if (!studentStatusList || !subject_id || !date) {
      return NextResponse.json({ error: 'Missing student status list, subject, or date.' }, { status: 400 });
    }

    // Prepare batch rows
    const rows = studentStatusList.map((item: any) => ({
      student_id: item.student_id,
      subject_id,
      date,
      status: item.status,
      marked_by: marked_by || null
    }));

    const { data, error } = await supabase
      .from('attendance')
      .insert(rows)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, count: data.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
