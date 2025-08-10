import type { APIRoute } from 'astro';
import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const { amount, title, description, currency = 'eur' } = await request.json();

    // Crear sesión de pago de Stripe
const commissionRate = 0.10;
    const commission = amount * commissionRate;
    const adjustedAmount = amount - commission;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: title,
              description: description,
            },
            unit_amount: Math.round(adjustedAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${import.meta.env.APP_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${import.meta.env.APP_URL}/add-service`,
      metadata: {
        service_title: title,
        service_description: description,
      },
    });

    return new Response(JSON.stringify({ sessionId: session.id }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error creating Stripe session:', error);
    return new Response(JSON.stringify({ error: 'Error creating payment session' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
