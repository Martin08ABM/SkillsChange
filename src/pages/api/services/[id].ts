
import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';

export const DELETE: APIRoute = async ({ params, locals }) => {
  const { userId } = locals.auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  const serviceId = params.id;
  if (!serviceId) {
    return new Response(JSON.stringify({ error: 'ID de servicio no válido' }), { status: 400 });
  }

  try {
    const db = await getDb();

    // Primero, verificar que el servicio pertenece al usuario que hace la petición
    const service = await db.get('SELECT id, user_id FROM services WHERE id = ?', serviceId);

    if (!service) {
      return new Response(JSON.stringify({ error: 'Anuncio no encontrado' }), { status: 404 });
    }

    if (service.user_id !== userId) {
      // ¡Prohibido! El usuario no es el propietario del anuncio
      return new Response(JSON.stringify({ error: 'No tienes permiso para eliminar este anuncio' }), { status: 403 });
    }

    // Si la verificación es exitosa, proceder con el borrado
    await db.run('DELETE FROM services WHERE id = ?', serviceId);

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error) {
    console.error(`Error al eliminar el servicio ${serviceId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
};
