import type { APIRoute } from 'astro';
import { serviceOperations, storageOperations } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const formData = await request.formData();
    
    const title = formData.get('title') as string;
    const imageFile = formData.get('image') as File | null;
    const description = formData.get('description') as string;
    const price = parseFloat(formData.get('price') as string) || 0;
    const currency = formData.get('currency') as string || 'EUR';
    const isPhysical = formData.get('is_physical') === 'true';
    const isOnline = formData.get('is_online') === 'true';
    const paymentType = formData.get('payment_type') as 'paid' | 'barter';
    const preferredPaymentMethod = formData.get('preferred_payment_method') as 'stripe' | 'paypal' | undefined;
    
    // Obtener el user_id del sistema de autenticación de Clerk
    const { userId, getToken } = locals.auth();
    
    // Verificar si el usuario está autenticado
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: 'User not authenticated' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener el token de Supabase desde Clerk. Asume que una plantilla JWT "supabase" existe en Clerk.
    const supabaseToken = await getToken({ template: 'supabase' });
    if (!supabaseToken) {
      return new Response(JSON.stringify({
        error: 'Authentication token is missing. Please ensure you have a Supabase JWT template in Clerk.'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let imageUrl: string | undefined = undefined;

    // Si hay una imagen, subirla a Supabase Storage
    if (imageFile && imageFile.size > 0) {
      const { data: uploadData, error: uploadError } = await storageOperations.uploadServiceImage(
        imageFile,
        userId,
        supabaseToken
      );

      if (uploadError) {
        return new Response(JSON.stringify({ 
          error: 'Failed to upload image',
          details: uploadError.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      imageUrl = uploadData?.publicUrl;
    }
    // Validaciones
    if (!title || !description) {
      return new Response(JSON.stringify({ 
        error: 'Title and description are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (paymentType === 'paid' && (!price || price <= 0)) {
      return new Response(JSON.stringify({ 
        error: 'Price is required for paid services' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Crear el servicio
    const { data, error } = await serviceOperations.createService({
      title,
      description,
      price,
      image_url: imageUrl,
      currency,
      is_physical: isPhysical,
      is_online: isOnline,
      payment_type: paymentType,
      preferred_payment_method: preferredPaymentMethod,
      user_id: userId,
    }, supabaseToken);

    if (error) {
      console.error('Error creating service:', error);
      console.error('Supabase error details:', error); // Log the full error object
      return new Response(JSON.stringify({ 
        error: 'Failed to create service' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      data 
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('CRITICAL ERROR in create service endpoint:', error);
    
    // Proporcionar un mensaje de error más detallado para la depuración.
    // La causa más común es que la plantilla JWT de Supabase no está configurada en Clerk.
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    const errorDetails = `This is likely due to a missing or misconfigured JWT template in Clerk. Please ensure you have a 'supabase' JWT template created in your Clerk dashboard. Original error: ${errorMessage}`;

    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: errorDetails
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
