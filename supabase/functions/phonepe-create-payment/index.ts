import "jsr:@supabase/functions-js/edge-runtime.ts"
import { encodeBase64 } from "jsr:@std/encoding/base64"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { orderId, amount, userId, redirectUrl } = await req.json()

    if (!orderId || !amount || !userId || !redirectUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const merchantId = Deno.env.get('PHONEPE_MERCHANT_ID') || 'PGTESTPAYUAT';
    const saltKey = Deno.env.get('PHONEPE_SALT_KEY') || '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399';
    const saltIndex = Deno.env.get('PHONEPE_SALT_INDEX') || '1';
    const env = Deno.env.get('PHONEPE_ENV') || 'SANDBOX';

    // Unique transaction ID
    const merchantTransactionId = `T${Date.now()}`;
    
    // We should ideally verify the amount with the database here, 
    // but for simplicity and matching the Razorpay function, we proceed with the provided amount.

    const payload = {
      merchantId: merchantId,
      merchantTransactionId: merchantTransactionId,
      merchantUserId: userId,
      amount: Math.round(amount * 100), // in paise
      redirectUrl: redirectUrl,
      redirectMode: "REDIRECT", // PhonePe will GET to the redirectUrl
      // Note: In local dev, callbackUrl is hard to reach from PhonePe, we rely on the frontend redirect + status check
      // callbackUrl: `https://your-supabase-project.functions.supabase.co/phonepe-callback`,
      paymentInstrument: {
        type: "PAY_PAGE"
      }
    };

    // 1. Base64 encode the payload
    const payloadString = JSON.stringify(payload);
    const encoder = new TextEncoder();
    const base64Payload = encodeBase64(encoder.encode(payloadString));

    // 2. Generate Checksum
    const apiEndpoint = "/pg/v1/pay";
    const dataToHash = base64Payload + apiEndpoint + saltKey;
    const dataBuffer = encoder.encode(dataToHash);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    const checksum = hashHex + "###" + saltIndex;

    // 3. Make request to PhonePe
    const phonepeUrl = env === 'PROD' 
      ? 'https://api.phonepe.com/apis/hermes/pg/v1/pay'
      : 'https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay';

    const response = await fetch(phonepeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
      },
      body: JSON.stringify({
        request: base64Payload
      })
    });

    const result = await response.json();

    if (result.success) {
      return new Response(
        JSON.stringify({ 
          redirectInfo: result.data.instrumentResponse.redirectInfo,
          merchantTransactionId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    } else {
      throw new Error(result.message || 'Error initiating PhonePe payment');
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
