// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      merchantTransactionId,
      userId,
      cartItems,
      totalAmount,
      shippingAddress
    } = await req.json()

    if (!merchantTransactionId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const merchantId = Deno.env.get('PHONEPE_MERCHANT_ID') || 'PGTESTPAYUAT';
    const saltKey = Deno.env.get('PHONEPE_SALT_KEY') || '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399';
    const saltIndex = Deno.env.get('PHONEPE_SALT_INDEX') || '1';
    const env = Deno.env.get('PHONEPE_ENV') || 'SANDBOX';

    // 1. Generate Checksum for Status API
    const apiEndpoint = `/pg/v1/status/${merchantId}/${merchantTransactionId}`;
    const dataToHash = apiEndpoint + saltKey;
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(dataToHash);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    const checksum = hashHex + "###" + saltIndex;

    // 2. Call PhonePe Status API
    const phonepeUrl = env === 'PROD' 
      ? `https://api.phonepe.com/apis/hermes${apiEndpoint}`
      : `https://api-preprod.phonepe.com/apis/pg-sandbox${apiEndpoint}`;

    const response = await fetch(phonepeUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': merchantId
      }
    });

    const result = await response.json();

    if (!result.success || result.code !== 'PAYMENT_SUCCESS') {
      return new Response(
        JSON.stringify({ success: false, message: result.message || 'Payment not successful' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 3. Payment is successful, create order in Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if order already exists (Idempotency)
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('phonepe_transaction_id', merchantTransactionId)
      .maybeSingle();

    if (existingOrder) {
      return new Response(
        JSON.stringify({ success: true, orderId: existingOrder.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Create Order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        total_amount: totalAmount,
        payment_status: 'paid',
        payment_method: 'PhonePe',
        phonepe_transaction_id: merchantTransactionId,
        shipping_address: shippingAddress
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create Order Items & Decrement Stock
    if (cartItems && cartItems.length > 0) {
      for (const item of cartItems) {
        await supabase
          .from('order_items')
          .insert({
            order_id: orderData.id,
            product_id: item.product.id,
            size: item.size,
            quantity: item.quantity,
            unit_price: item.product.price
          });

        // Simple decrement stock (in production use rpc for atomic updates)
        await supabase.rpc('decrement_stock', { p_id: item.product.id, p_qty: item.quantity });
      }

      // Clear Cart
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId);
    }

    return new Response(
      JSON.stringify({ success: true, orderId: orderData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
