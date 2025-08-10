import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    console.log('=== DEBUG: Starting service creation ===');
    
    const formData = await request.formData();
    console.log('Form data received:', Object.fromEntries(formData));
    
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const price = parseFloat(formData.get('price') as string) || 0;
    const currency = formData.get('currency') as string || 'EUR';
    const isPhysical = formData.get('is_physical') === 'true';
    const isOnline = formData.get('is_online') === 'true';
    const paymentType = formData.get('payment_type') as 'paid' | 'barter';
    const preferredPaymentMethod = formData.get('preferred_payment_method') as 'stripe' | 'paypal' | undefined;
    
    console.log('Parsed data:', {
      title,
      description,
      price,
      currency,
      isPhysical,
      isOnline,
      paymentType,
      preferredPaymentMethod
    });
    
    // Obtener el user_id del sistema de autenticación de Clerk
    let userId;
    try {
      const auth = locals.auth();
      userId = auth.userId;
      console.log('User ID from auth:', userId);
    } catch (authError) {
      console.error('Auth error:', authError);
      userId = 'debug-user-' + Date.now(); // Fallback para debug
    }
    
    // Validaciones básicas
    if (!title || !description) {
      console.log('Validation failed: missing title or description');
      return new Response(JSON.stringify({ 
        error: 'Title and description are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (paymentType === 'paid' && (!price || price <= 0)) {
      console.log('Validation failed: invalid price for paid service');
      return new Response(JSON.stringify({ 
        error: 'Price is required for paid services' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const serviceData = {
      title,
      description,
      price,
      currency,
      is_physical: isPhysical,
      is_online: isOnline,
      payment_type: paymentType,
      preferred_payment_method: preferredPaymentMethod,
      user_id: userId
    };
    
    console.log('Service data to insert:', serviceData);

    // Intentar crear el servicio directamente con supabase
    const { data, error } = await supabase
      .from('services')
      .insert([serviceData])
      .select()
      .single();

    console.log('Supabase response:', { data, error });

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      return new Response(JSON.stringify({ 
        error: 'Failed to create service',
        details: error.message,
        hint: error.hint
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Service created successfully:', data);
    
    return new Response(JSON.stringify({ 
      success: true, 
      data,
      debug: {
        userId,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Unexpected error in create service endpoint:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
