/**
 * Vercel API Route: /api/functions/[name]
 * Proxied alle alten Base44 Function Calls zu Supabase Edge Functions
 */
export const config = { runtime: 'edge' };

const SUPABASE_URL = 'https://vecxtgwxqzrogthqqdys.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3x3ObpWRTlVSiXo8Y0TvbA_mTeAMcYW';

// Mapping: alter Name → neuer Supabase Function Name
const FUNCTION_MAP = {
  'textToSpeech': 'tts',
  'backendTextToSpeech': 'tts',
  'geminiTextToSpeech': 'tts',
  'catchgbtChat': 'ai-chat',
  'catchgbtPing': 'ai-chat',
  'getPlanStatus': 'getPlanStatus',
  'premiumStatus': 'getPlanStatus',
  'deleteAccount': 'deleteAccount',
  'analyzeCatchPhoto': 'analyzeCatchPhoto',
  'getFishingRecommendation': 'getFishingRecommendation',
  'cleanupOldSessions': 'cleanupOldSessions',
  'getClanLeaderboard': 'getClanLeaderboard',
  'getVotingLeaderboard': 'getVotingLeaderboard',
  'addVotingLike': 'addVotingLike',
  'createClan': 'createClan',
  'joinClan': 'joinClan',
  'calculateTravelTime': 'calculateTravelTime',
  'angelspotsGeojson': 'angelspotsGeojson',
  'bathymetryProxy': 'bathymetryProxy',
  'createStripeCheckoutSession': 'createStripeCheckoutSession',
  'activatePlan': 'activatePlan',
  'recordWebVitals': 'recordWebVitals',
};

export default async function handler(req) {
  const url = new URL(req.url);
  const segments = url.pathname.split('/');
  const name = segments[segments.length - 1];

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
      },
    });
  }

  const targetFunction = FUNCTION_MAP[name] ?? name;
  const targetUrl = `${SUPABASE_URL}/functions/v1/${targetFunction}`;

  try {
    const body = req.method !== 'GET' ? await req.text() : undefined;
    
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.get('Authorization') ?? `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body,
    });

    const data = await response.text();
    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') ?? 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
