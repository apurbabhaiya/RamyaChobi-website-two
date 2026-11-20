type VercelRequest = any;
type VercelResponse = any;

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';
const INTERNAL_SECRET = process.env.RAMYACHOBI_MEMBERSHIP_INTERNAL_SECRET || '';
const ZINIPAY_API_KEY = process.env.ZINIPAY_API_KEY || '';
const BASE_URL = 'https://api.zinipay.com';

function json(res: VercelResponse, status: number, body: unknown) {
  return res.status(status).setHeader('content-type','application/json; charset=utf-8')
    .setHeader('cache-control','no-store').end(JSON.stringify(body));
}
async function rpc(name: string, args: Record<string, unknown>) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Membership backend configuration is incomplete.');
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method:'POST',
    headers:{ apikey:SUPABASE_KEY, Authorization:`Bearer ${SUPABASE_KEY}`, 'content-type':'application/json' },
    body:JSON.stringify(args)
  });
  const raw = await response.text();
  if (!response.ok) throw new Error(raw.slice(0,400) || 'Membership database request failed.');
  return raw ? JSON.parse(raw) : null;
}
async function verifyInvoice(invoiceId: string) {
  const response = await fetch(`${BASE_URL}/v1/payment/verify`, {
    method:'POST',
    headers:{'content-type':'application/json','zini-api-key':ZINIPAY_API_KEY},
    body:JSON.stringify({invoice_id:invoiceId})
  });
  const data = await response.json().catch(()=>({}));
  if (!response.ok) throw new Error(data?.message || 'ZiniPay verification failed.');
  return data;
}
function getInvoiceId(data: any, paymentUrl: string) {
  const direct = data?.invoice_id || data?.invoiceId || data?.data?.invoice_id || data?.data?.invoiceId;
  if (direct) return String(direct);
  try {
    const url = new URL(paymentUrl);
    const parts = url.pathname.split('/').filter(Boolean);
    return parts[parts.length-1] || '';
  } catch { return ''; }
}
async function completeByReference(reference: string) {
  const order = await rpc('membership_gateway_get_invoice',{p_internal_secret:INTERNAL_SECRET,p_reference_code:reference});
  if (!order?.invoice_id) throw new Error('Payment invoice not found.');
  if (order.status === 'approved' && order.card_token) return order;
  const verified = await verifyInvoice(String(order.invoice_id));
  const status = String(verified?.status || verified?.data?.status || '').toUpperCase();
  const invoice = String(verified?.invoice_id || verified?.invoiceId || verified?.data?.invoice_id || verified?.data?.invoiceId || '');
  const amount = Number(verified?.amount ?? verified?.data?.amount);
  const txn = String(verified?.transaction_id || verified?.transactionId || verified?.data?.transaction_id || verified?.data?.transactionId || '');
  if (invoice !== String(order.invoice_id)) throw new Error('ZiniPay invoice mismatch.');
  if (status !== 'COMPLETED') {
    await rpc('membership_gateway_update_status',{p_internal_secret:INTERNAL_SECRET,p_reference_code:reference,p_gateway_status:status === 'FAILED' ? 'FAILED' : 'PENDING'});
    return {status:'pending'};
  }
  if (amount !== 99) {
    await rpc('membership_gateway_update_status',{p_internal_secret:INTERNAL_SECRET,p_reference_code:reference,p_gateway_status:'AMOUNT_MISMATCH'});
    throw new Error('The verified payment amount does not match the ৳99 membership fee.');
  }
  return await rpc('membership_gateway_complete',{
    p_internal_secret:INTERNAL_SECRET,p_reference_code:reference,p_invoice_id:invoice,
    p_transaction_id:txn || null,p_amount:amount,p_gateway_status:status
  });
}
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!SUPABASE_URL || !SUPABASE_KEY || !INTERNAL_SECRET || !ZINIPAY_API_KEY) {
    return json(res,503,{error:'ZiniPay membership is not configured yet.'});
  }
  try {
    if (req.method === 'POST' && req.query.action === 'create') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const name = String(body.name || '').trim();
      const phone = String(body.phone || '').trim();
      const selectedPackage = body.selectedPackage ? String(body.selectedPackage) : null;
      const intent = await rpc('membership_gateway_create_intent',{
        p_internal_secret:INTERNAL_SECRET,p_client_name:name,p_phone:phone,p_selected_package:selectedPackage
      });
      const site = process.env.APP_URL || 'https://ramyachobi-website-two.vercel.app';
      const base = site.replace(/\/$/,'');
      const created = await fetch(`${BASE_URL}/v1/payment/create`,{
        method:'POST',
        headers:{'content-type':'application/json','zini-api-key':ZINIPAY_API_KEY},
        body:JSON.stringify({
          cus_name:name,amount:99,
          metadata:{reference_code:intent.reference_code,product:'RamyaChobi Membership Card'},
          redirect_url:`${base}/wedding-membership?payment=return&reference=${encodeURIComponent(intent.reference_code)}`,
          cancel_url:`${base}/wedding-membership?payment=cancel&reference=${encodeURIComponent(intent.reference_code)}`
        })
      });
      const gateway = await created.json().catch(()=>({}));
      if (!created.ok || gateway?.status === false || !gateway?.payment_url) {
        await rpc('membership_gateway_update_status',{p_internal_secret:INTERNAL_SECRET,p_reference_code:intent.reference_code,p_gateway_status:'FAILED'}).catch(()=>null);
        return json(res,502,{error:gateway?.message || 'ZiniPay could not create a payment link.'});
      }
      const invoiceId = getInvoiceId(gateway,gateway.payment_url);
      if (!invoiceId) return json(res,502,{error:'ZiniPay did not return a usable invoice ID.'});
      await rpc('membership_gateway_attach_invoice',{
        p_internal_secret:INTERNAL_SECRET,p_reference_code:intent.reference_code,
        p_invoice_id:invoiceId,p_payment_url:gateway.payment_url
      });
      return json(res,200,{paymentUrl:gateway.payment_url,referenceCode:intent.reference_code});
    }
    if (req.method === 'GET' && req.query.action === 'verify') {
      const reference = String(req.query.reference || '').trim();
      if (!/^RMP-[A-Z0-9]{20}$/.test(reference)) return json(res,400,{error:'Invalid membership reference.'});
      const result = await completeByReference(reference);
      return json(res,200,result?.card_token ? {status:'approved',cardToken:result.card_token} : {status:'pending'});
    }
    if (req.method === 'POST' && req.query.action === 'webhook') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const invoiceId = String(body.invoice_id || body.invoiceId || '').trim();
      if (!invoiceId) return json(res,400,{error:'Missing invoice ID.'});
      const reference = await rpc('membership_gateway_find_by_invoice',{p_internal_secret:INTERNAL_SECRET,p_invoice_id:invoiceId});
      if (!reference) return json(res,404,{error:'Invoice not found.'});
      const result = await completeByReference(reference);
      return json(res,200,{ok:true,status:result?.card_token?'approved':'pending'});
    }
    return json(res,405,{error:'Method not allowed.'});
  } catch (error:any) {
    const message = String(error?.message || 'Membership payment failed.');
    return json(res,/Unauthorized|Admin session/i.test(message)?401:400,{error:message});
  }
}
