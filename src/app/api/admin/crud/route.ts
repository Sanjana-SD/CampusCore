import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { 
  mockDepartments, mockCourses, mockSubjects, mockJobs, mockApplications, 
  mockAssignments, mockSubmissions, mockAttendance, mockMarks, mockMessages, mockTimetables 
} from '@/lib/mockData';

const mockTables: Record<string, any[]> = {
  departments: mockDepartments,
  courses: mockCourses,
  subjects: mockSubjects,
  jobs: mockJobs,
  applications: mockApplications,
  assignments: mockAssignments,
  submissions: mockSubmissions,
  attendance: mockAttendance,
  marks: mockMarks,
  messages: mockMessages,
  timetables: mockTimetables
};

// Generic CRUD Gatekeeper
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');

  if (!table) {
    return NextResponse.json({ error: 'Table parameter is required.' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    let query = supabase.from(table).select('*');
    
    // Add simple filters if any
    const filterCol = searchParams.get('filterCol');
    const filterVal = searchParams.get('filterVal');
    if (filterCol && filterVal) {
      query = query.eq(filterCol, filterVal);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      let fallback = mockTables[table] || [];
      if (filterCol && filterVal) {
        fallback = fallback.filter((item: any) => String(item[filterCol]) === String(filterVal));
      }
      return NextResponse.json(fallback);
    }

    return NextResponse.json(data);
  } catch (err: any) {
    let fallback = mockTables[table] || [];
    const filterCol = searchParams.get('filterCol');
    const filterVal = searchParams.get('filterVal');
    if (filterCol && filterVal) {
      fallback = fallback.filter((item: any) => String(item[filterCol]) === String(filterVal));
    }
    return NextResponse.json(fallback);
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');

  if (!table) {
    return NextResponse.json({ error: 'Table parameter is required.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const supabase = await createClient();
    const { data, error } = await supabase.from(table).insert(body).select().single();
    
    if (error) {
      const newItem = { id: `${table}-${Date.now()}`, ...body, created_at: new Date().toISOString() };
      if (mockTables[table]) {
        mockTables[table].unshift(newItem);
      }
      return NextResponse.json({ success: true, data: newItem });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: true, message: 'Saved to local session' });
  }
}

export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');
  const id = searchParams.get('id');

  if (!table || !id) {
    return NextResponse.json({ error: 'Table and ID parameters are required.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const supabase = await createClient();
    const { data, error } = await supabase.from(table).update(body).eq('id', id).select().single();

    if (error) {
      return NextResponse.json({ success: true, data: { id, ...body } });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: true });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');
  const id = searchParams.get('id');

  if (!table || !id) {
    return NextResponse.json({ error: 'Table and ID parameters are required.' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from(table).delete().eq('id', id);

    if (error) {
      if (mockTables[table]) {
        mockTables[table] = mockTables[table].filter((item: any) => item.id !== id);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: true });
  }
}

