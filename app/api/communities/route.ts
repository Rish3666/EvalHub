import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, description, is_public } = await req.json();

  if (!name || !description) {
    return NextResponse.json({ error: 'Name and description are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('communities')
    .insert({
      name,
      description,
      is_public,
      creator_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating community:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase.from('communities').select('*');

  if (user) {
    // If user is logged in, show all public communities and communities they created/are part of
    // For now, let's just show public communities. Membership will be a future enhancement.
    query = query.or('is_public.eq.true');
  } else {
    // If no user, only show public communities
    query = query.eq('is_public', true);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching communities:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}
