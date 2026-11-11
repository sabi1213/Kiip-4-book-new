const MAX_WORD_LENGTH = 300;
const MODEL_FALLBACK = 'gemini-2.5-flash';

function corsHeaders(origin, allowedOrigin) {
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
  if (origin && origin === allowedOrigin) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}
function json(data, status, cors) {
  return new Response(JSON.stringify(data), {status, headers: {...cors, 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store'}});
}

export default {
  async fetch(request, env) {
    const allowedOrigin = env.ALLOWED_ORIGIN || 'https://sabi1213.github.io';
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin, allowedOrigin);
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      if (origin && origin !== allowedOrigin) return new Response(null, {status:403});
      return new Response(null, {status:204, headers:cors});
    }
    if (url.pathname !== '/api/gemini') return json({error:'Not found'},404,cors);
    if (origin !== allowedOrigin) return json({error:'Origin not allowed'},403,cors);
    if (request.method !== 'POST') return json({error:'Method not allowed'},405,cors);
    if (!env.GEMINI_API_KEY) return json({error:'Gemini API is not configured'},503,cors);

    let body;
    try { body = await request.json(); } catch (_) { return json({error:'Invalid JSON'},400,cors); }
    const word = typeof body.word === 'string' ? body.word.trim() : '';
    if (!word || word.length > MAX_WORD_LENGTH) return json({error:`word must be 1-${MAX_WORD_LENGTH} characters`},400,cors);

    const prompt = `You are a careful Korean-language tutor for a Bangladeshi learner. Analyze the Korean word or phrase below in simple Bangla. Include: natural meaning and context; word type; Hanja/etymology only when reliable (say uncertain rather than guessing); roots and related words; nuanced synonyms and antonyms; natural everyday vs textbook usage; one natural Korean example with Bangla translation; particle and grammar breakdown. If the input is awkward or grammatically incorrect, politely correct it and explain. Do not invent etymology or claim a phrase is idiomatic without evidence.\n\nKorean input: ${word}`;
    const model = env.GEMINI_MODEL || MODEL_FALLBACK;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    try {
      const upstream = await fetch(endpoint, {
        method:'POST',
        headers:{'Content-Type':'application/json', 'x-goog-api-key':env.GEMINI_API_KEY},
        body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.3,maxOutputTokens:1200}})
      });
      const result = await upstream.json().catch(()=>({}));
      if (!upstream.ok) {
        // Do not return upstream payloads, which may contain diagnostics or sensitive details.
        return json({error: upstream.status === 429 ? 'AI request limit reached; try later.' : 'Gemini request failed.'}, upstream.status === 429 ? 429 : 502, cors);
      }
      const text = result?.candidates?.[0]?.content?.parts?.map(part=>part.text||'').join('\n').trim();
      if (!text) return json({error:'Gemini returned no text.'},502,cors);
      return json({text},200,cors);
    } catch (_) {
      return json({error:'Could not reach Gemini.'},502,cors);
    }
  }
};
