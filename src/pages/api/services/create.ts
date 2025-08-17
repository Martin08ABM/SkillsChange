
import type { APIRoute } from 'astro';
import { getDb, generateId } from '../../../lib/db';
import fs from 'fs/promises';
import path from 'path';

export const POST: APIRoute = async ({ request, locals }) => {
  const { userId } = locals.auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const formData = await request.formData();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const imageFile = formData.get('image') as File | null;
    const isPhysical = formData.get('is_physical') === 'true';
    const isOnline = formData.get('is_online') === 'true';
    const paymentType = formData.get('payment_type') as 'paid' | 'barter';
    const price = paymentType === 'paid' ? parseFloat(formData.get('price') as string) : 0;
    const currency = paymentType === 'paid' ? (formData.get('currency') as string) : 'EUR';

    // --- Validación de datos ---
    if (!title || !description) {
      return new Response(JSON.stringify({ error: 'El título y la descripción son obligatorios' }), { status: 400 });
    }
    if (!isPhysical && !isOnline) {
        return new Response(JSON.stringify({ error: 'Debe seleccionar al menos un tipo de servicio (físico u online)' }), { status: 400 });
    }
    if (paymentType === 'paid' && (!price || price <= 0)) {
      return new Response(JSON.stringify({ error: 'El precio debe ser mayor que 0 para servicios de pago' }), { status: 400 });
    }

    let imageUrl: string | undefined;
    if (imageFile && imageFile.size > 0) {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'images');
      await fs.mkdir(uploadsDir, { recursive: true });
      
      const fileExtension = path.extname(imageFile.name);
      const fileName = `${generateId()}${fileExtension}`;
      const filePath = path.join(uploadsDir, fileName);

      await fs.writeFile(filePath, Buffer.from(await imageFile.arrayBuffer()));
      
      imageUrl = `/uploads/images/${fileName}`;
    }

    const db = await getDb();
    const serviceId = generateId();

    const serviceData = {
      $id: serviceId,
      $title: title,
      $description: description,
      $price: price || 0,
      $currency: currency,
      $image_url: imageUrl,
      $is_physical: isPhysical ? 1 : 0,
      $is_online: isOnline ? 1 : 0,
      $payment_type: paymentType,
      $user_id: userId,
    };

    const sql = `
      INSERT INTO services (
        id, title, description, price, currency, image_url, is_physical, is_online, 
        payment_type, user_id
      ) VALUES (
        $id, $title, $description, $price, $currency, $image_url, $is_physical, $is_online, 
        $payment_type, $user_id
      )
    `;

    await db.run(sql, serviceData);

    const newService = await db.get('SELECT * FROM services WHERE id = ?', serviceId);

    return new Response(JSON.stringify({ success: true, data: newService }), { status: 201 });

  } catch (error) {
    console.error('Error en el endpoint de creación:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
};
