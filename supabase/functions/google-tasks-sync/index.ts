import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // Verify user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('User verification failed:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get Google tokens for user
    const { data: googleToken, error: tokenError } = await supabase
      .from('google_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !googleToken) {
      console.error('No Google tokens found for user:', user.id);
      return new Response(JSON.stringify({ error: 'Google account not connected' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if token is expired and refresh if needed
    let accessToken = googleToken.access_token;
    const now = new Date();
    const expiresAt = new Date(googleToken.expires_at);
    
    if (now >= expiresAt) {
      console.log('Access token expired, refreshing...');
      const refreshed = await refreshAccessToken(googleToken.refresh_token);
      if (!refreshed) {
        return new Response(JSON.stringify({ error: 'Failed to refresh access token' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      accessToken = refreshed.access_token;
      
      // Update tokens in database
      await supabase
        .from('google_tokens')
        .update({
          access_token: refreshed.access_token,
          expires_at: refreshed.expires_at,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    }

    // Get current mission and tasks
    const { data: mission } = await supabase
      .from('missions')
      .select('*, mission_tasks(*)')
      .eq('user_id', user.id)
      .eq('is_locked', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!mission || !mission.mission_tasks?.length) {
      return new Response(JSON.stringify({ error: 'No active mission found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get or create "Winter Arc Missions" task list
    const taskListId = await getOrCreateTaskList(accessToken);
    if (!taskListId) {
      return new Response(JSON.stringify({ error: 'Failed to create task list' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sync each task
    let synced = 0;
    let errors = 0;
    
    for (const task of mission.mission_tasks) {
      try {
        await syncTaskToGoogle(
          accessToken,
          taskListId,
          task,
          mission.end_date,
          supabase
        );
        synced++;
      } catch (error) {
        console.error('Failed to sync task:', task.id, error);
        errors++;
      }
    }

    console.log(`Sync complete: ${synced} tasks synced, ${errors} errors`);

    return new Response(JSON.stringify({ 
      success: true, 
      synced,
      errors,
      message: `Successfully synced ${synced} tasks to Google Tasks` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in google-tasks-sync:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function refreshAccessToken(refreshToken: string) {
  const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
  const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Token refresh failed:', errorText);
    return null;
  }

  const data = await response.json();
  const expiresAt = new Date(Date.now() + data.expires_in * 1000);
  
  return {
    access_token: data.access_token,
    expires_at: expiresAt.toISOString(),
  };
}

async function getOrCreateTaskList(accessToken: string): Promise<string | null> {
  const LIST_NAME = 'Winter Arc Missions';
  
  // Check if list already exists
  const listResponse = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!listResponse.ok) {
    console.error('Failed to fetch task lists');
    return null;
  }

  const lists = await listResponse.json();
  const existingList = lists.items?.find((list: any) => list.title === LIST_NAME);
  
  if (existingList) {
    return existingList.id;
  }

  // Create new list
  const createResponse = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: LIST_NAME,
    }),
  });

  if (!createResponse.ok) {
    console.error('Failed to create task list');
    return null;
  }

  const newList = await createResponse.json();
  return newList.id;
}

async function syncTaskToGoogle(
  accessToken: string,
  taskListId: string,
  task: any,
  missionEndDate: string,
  supabase: any
) {
  // Check if task already exists in Google Tasks
  if (task.google_task_id) {
    // Update existing task
    const updateResponse = await fetch(
      `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${task.google_task_id}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: task.description,
          status: task.is_completed ? 'completed' : 'needsAction',
          due: missionEndDate,
        }),
      }
    );

    if (!updateResponse.ok) {
      console.error('Failed to update Google task:', task.google_task_id);
      throw new Error('Failed to update task');
    }
  } else {
    // Create new task
    const createResponse = await fetch(
      `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: task.description,
          status: task.is_completed ? 'completed' : 'needsAction',
          due: missionEndDate,
        }),
      }
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Failed to create Google task:', errorText);
      throw new Error('Failed to create task');
    }

    const newTask = await createResponse.json();
    
    // Store Google task ID in database
    await supabase
      .from('mission_tasks')
      .update({ google_task_id: newTask.id })
      .eq('id', task.id);
  }
}
