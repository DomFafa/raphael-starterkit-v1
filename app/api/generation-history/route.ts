import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { UserDataCache, CACHE_TTL } from '@/utils/cache';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to get from cache first
    const cacheKey = `generation_history:${user.id}`;
    const cached = UserDataCache.get(user.id, 'generation_history');

    if (cached) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Cache hit for generation history: ${user.id}`);
      }
      return NextResponse.json(cached);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`Cache miss for generation history: ${user.id}`);
    }

    // Fetch generation logs for the user
    const { data: logs, error: logsError } = await supabase
      .from('name_generation_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (logsError) {
      console.error('Database error:', logsError);
      return NextResponse.json({ error: 'Failed to fetch generation history' }, { status: 500 });
    }

    // Calculate statistics
    const stats = {
      total_generations: logs?.length || 0,
      total_credits_used: logs?.reduce((sum, log) => sum + (log.credits_used || 0), 0) || 0,
      total_names_generated: logs?.reduce((sum, log) => sum + (log.names_generated || 0), 0) || 0,
      avg_per_session: logs?.length > 0
        ? (logs.reduce((sum, log) => sum + (log.names_generated || 0), 0) / logs.length)
        : 0
    };

    // Process logs to include computed fields
    const processedLogs = logs?.map(log => ({
      ...log,
      has_personality_traits: Boolean(log.metadata?.personalityTraits),
      has_name_preferences: Boolean(log.metadata?.namePreferences)
    })) || [];

    const responseData = {
      logs: processedLogs,
      stats
    };

    // Cache the response (short TTL since this data changes frequently)
    UserDataCache.set(user.id, 'generation_history', responseData);

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}