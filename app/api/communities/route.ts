import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')

  let query = supabase
    .from('communities')
    .select('*')

  // Add search filter if provided
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,tags.ilike.%${search}%`)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { name, description, tags } = await request.json()

  // Get current user for creator_id
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Create Community
  const { data, error } = await supabase
    .from('communities')
    .insert([{
      name,
      description,
      tags,
      creator_id: user.id
    }])
    .select()
    .single()

  if (error) {
    console.error('Community creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Automatically join the creator to the community
  await supabase
    .from('community_members')
    .insert([{
      community_id: data.id,
      user_id: user.id
    }])

  return NextResponse.json(data)
}
