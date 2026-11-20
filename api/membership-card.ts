type VercelRequest = any;
type VercelResponse = any;
function json(res: VercelResponse, status: number, body: unknown) {
  return res.status(status).setHeader('content-type','application/json; charset=utf-8')
    .setHeader('cache-control','no-store').end(JSON.stringify(body));
}
export default async function handler(req: VercelRequest,res: VercelResponse) {
  if (req.method !== 'GET') return json(res,405,{error:'Only GET is supported.'});
  const token = String(req.query.token || '').trim();
  if (!/^[0-9a-f-]{36}$/i.test(token)) return json(res,400,{error:'Invalid membership card token.'});
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';
  if (!url || !key) return json(res,503,{error:'Membership card service is unavailable.'});
  const response = await fetch(`${url}/rest/v1/rpc/get_wedding_membership_card`,{
    method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'content-type':'application/json'},
    body:JSON.stringify({p_card_token:token})
  });
  const data = await response.json().catch(()=>null);
  if (!response.ok || !data) return json(res,404,{error:'Membership card not found.'});
  return json(res,200,data);
}
