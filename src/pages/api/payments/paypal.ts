import type { APIRoute } from 'astro';
import { PayPalApi, Environment } from '@paypal/paypal-server-sdk';

const paypalClient = new PayPalApi({
  clientId: import.meta.env.PAYPAL_CLIENT_ID,
  clientSecret: import.meta.env.PAYPAL_CLIENT_SECRET,
  environment: import.meta.env.PAYPAL_SANDBOX === 'true' ? Environment.Sandbox : Environment.Production,
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const { amount, title, description, currency = 'EUR' } = await request.json();

const commissionRate = 0.10;
    const commission = amount * commissionRate;
    const adjustedAmount = amount - commission;

    const orderRequest = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: adjustedAmount.toFixed(2),
          },
          description: `${title} - ${description}`,
        },
      ],
      application_context: {
        return_url: `${import.meta.env.APP_URL}/payment-success`,
        cancel_url: `${import.meta.env.APP_URL}/add-service`,
        brand_name: 'TeCambio',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
      },
    };

    const response = await paypalClient.orders.ordersCreate({
      body: orderRequest,
    });

    return new Response(JSON.stringify({ 
      orderId: response.body.id,
      approvalUrl: response.body.links?.find(link => link.rel === 'approve')?.href 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    return new Response(JSON.stringify({ error: 'Error creating PayPal order' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

export const GET: APIRoute = async ({ url }) => {
  const orderId = url.searchParams.get('orderId');
  
  if (!orderId) {
    return new Response(JSON.stringify({ error: 'Order ID is required' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  try {
    const response = await paypalClient.orders.ordersCapture({
      id: orderId,
    });

    return new Response(JSON.stringify({ 
      status: 'success',
      orderId: response.body.id,
      captureId: response.body.purchase_units?.[0]?.payments?.captures?.[0]?.id 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    return new Response(JSON.stringify({ error: 'Error capturing PayPal order' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
