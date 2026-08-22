// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'
import crypto from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      userId,
      cartItems,
      totalAmount,
      shippingAddress
    } = await req.json()

    const key_secret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!key_secret) {
      throw new Error('Razorpay secret is missing from environment variables');
    }

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generated_signature = crypto
      .createHmac('sha256', key_secret)
      .update(text)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Initialize Supabase Admin Client to bypass RLS for processing the order
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Create Order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        total_amount: totalAmount,
        payment_status: 'paid',
        payment_method: 'Razorpay',
        razorpay_order_id,
        razorpay_payment_id,
        shipping_address: shippingAddress
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Create Order Items & Decrement Stock
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

    // 3. Clear Cart
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    return new Response(
      JSON.stringify({ success: true, orderId: orderData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
