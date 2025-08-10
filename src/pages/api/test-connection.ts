import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const GET: APIRoute = async ({ locals }) => {
  try {
    // Probar conexión a Supabase
    const { data, error } = await supabase
      .from('services')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return new Response(JSON.stringify({ 
        error: 'Database connection failed',
        details: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Probar autenticación
    const { userId } = locals.auth();
    
    return new Response(JSON.stringify({ 
      success: true,
      userId: userId || 'No authenticated user',
      database: 'Connected',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Test connection error:', error);
    return new Response(JSON.stringify({ 
      error: 'Test failed',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
