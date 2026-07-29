import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const { marksList, subject_id, exam_type, graded_by } = await request.json();

    if (!marksList || !subject_id || !exam_type) {
      return NextResponse.json({ error: 'Missing marks list, subject, or exam type.' }, { status: 400 });
    }

    // Map rows for upsert
    const rows = marksList.map((item: any) => ({
      student_id: item.student_id,
      subject_id,
      exam_type,
      marks_obtained: parseFloat(item.marks_obtained),
      max_marks: parseFloat(item.max_marks || 50),
      graded_by: graded_by || null
    }));

    const { data, error } = await supabase
      .from('marks')
      .upsert(rows, { onConflict: 'student_id,subject_id,exam_type' })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, count: data.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
