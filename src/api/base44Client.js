/**
 * CATCHLY - Base44 → Supabase Kompatibilitäts-Schicht
 */
import { supabase } from '@/lib/supabase';

// ─────────────────────────────────────────────
// SHARED USER CACHE - verhindert Lock-Konflikte
// ─────────────────────────────────────────────
let _cachedUser = null;
let _cacheTime = 0;
let _pendingGetUser = null;
const CACHE_TTL = 30000; // 30 Sekunden Cache

async function getCachedUser() {
  const now = Date.now();
  if (_cachedUser && (now - _cacheTime) < CACHE_TTL) {
    return _cachedUser;
  }
  // Verhindert gleichzeitige parallele Aufrufe (Lock-Konflikt)
  if (_pendingGetUser) return _pendingGetUser;
  _pendingGetUser = supabase.auth.getSession().then(({ data: { session } }) => {
    _cachedUser = session?.user ?? null;
    _cacheTime = Date.now();
    _pendingGetUser = null;
    return _cachedUser;
  }).catch(() => {
    _pendingGetUser = null;
    return null;
  });
  return _pendingGetUser;
}

// Cache invalidieren bei Auth-Änderungen
supabase.auth.onAuthStateChange((_event, session) => {
  _cachedUser = session?.user ?? null;
  _cacheTime = Date.now();
  _pendingGetUser = null;
});

// ─────────────────────────────────────────────
// ENTITY FACTORY
// ─────────────────────────────────────────────
function createEntity(tableName) {
  return {
    async list(orderBy = '-created_at', limit = 500) {
      let query = supabase.from(tableName).select('*').limit(limit);
      if (orderBy) {
        const desc = orderBy.startsWith('-');
        const col = desc ? orderBy.slice(1) : orderBy;
        query = query.order(col, { ascending: !desc });
      }
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    async filter(filters = {}, orderBy = '-created_at', limit = 500) {
      let query = supabase.from(tableName).select('*').limit(limit);
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) query = query.eq(key, value);
      });
      if (orderBy) {
        const desc = orderBy.startsWith('-');
        const col = desc ? orderBy.slice(1) : orderBy;
        query = query.order(col, { ascending: !desc });
      }
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    async get(id) {
      const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    async create(payload) {
      const user = await getCachedUser();
      const row = {
        ...payload,
        created_by: user?.email ?? null,
        user_id: user?.id ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase.from(tableName).insert(row).select().single();
      if (error) throw error;
      return data;
    },
    async update(id, payload) {
      const { data, error } = await supabase
        .from(tableName)
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    async delete(id) {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
    },
    async bulkCreate(rows) {
      const user = await getCachedUser();
      const ts = new Date().toISOString();
      const enriched = rows.map(r => ({
        ...r,
        created_by: user?.email ?? null,
        user_id: user?.id ?? null,
        created_at: ts,
        updated_at: ts,
      }));
      const { data, error } = await supabase.from(tableName).insert(enriched).select();
      if (error) throw error;
      return data ?? [];
    },
  };
}

// ─────────────────────────────────────────────
// AUTH  (ersetzt base44.auth)
// ─────────────────────────────────────────────
const auth = {
  // Prüft ob User eingeloggt ist
  async isAuthenticated() {
    const user = await getCachedUser();
    return !!user;
  },

  // Leitet zur Login-Seite weiter
  redirectToLogin(redirectUrl) {
    const url = redirectUrl ? `/Login?redirect=${encodeURIComponent(redirectUrl)}` : '/Login';
    window.location.href = url;
  },

  // Aktuellen User abrufen
  async me() {
    const user = await getCachedUser(); const error = null;
    if (error || !user) return null;
    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', user.id).single();
    return {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name ?? user.user_metadata?.full_name ?? '',
      nickname: profile?.nickname ?? '',
      profile_picture_url: profile?.profile_picture_url ?? '',
      is_demo_user: profile?.is_demo_user ?? false,
      premium_plan_id: profile?.premium_plan_id ?? 'free',
      settings: profile?.settings ?? {},
      credits: profile?.credits ?? 0,
      total_points: profile?.total_points ?? 0,
      feature_ratings: profile?.feature_ratings ?? {},
      feature_usage: profile?.feature_usage ?? {},
      ...profile,
    };
  },

  async updateMe(payload) {
    const user = await getCachedUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...payload, updated_at: new Date().toISOString() })
      .select().single();
    if (error) throw error;
    return data;
  },

  async updateMyUserData(payload) {
    return auth.updateMe(payload);
  },

  async logout(redirectTo = '/') {
    await supabase.auth.signOut();
    window.location.href = redirectTo;
  },

  async getUser() {
    const user = await getCachedUser();
    return user;
  },

  async list() {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    return data ?? [];
  },
};

// ─────────────────────────────────────────────
// FUNCTIONS
// ─────────────────────────────────────────────
const functions = {
  async invoke(functionName, payload = {}) {
    const { data, error } = await supabase.functions.invoke(functionName, { body: payload });
    if (error) throw error;
    return { data };
  },
};

// ─────────────────────────────────────────────
// INTEGRATIONS
// ─────────────────────────────────────────────
const integrations = {
  Core: {
    async InvokeLLM({ prompt, response_json_schema }) {
      const { data } = await functions.invoke('invoke-llm', { prompt, response_json_schema });
      return data;
    },
    async UploadFile({ file, bucket = 'uploads' }) {
      const ext = file.name?.split('.').pop() ?? 'bin';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
      return { file_url: publicUrl };
    },
    async CreateFileSignedUrl({ file_url, expires_in = 3600 }) {
      const path = file_url.split('/storage/v1/object/public/uploads/')[1];
      const { data, error } = await supabase.storage.from('uploads').createSignedUrl(path, expires_in);
      if (error) throw error;
      return { signed_url: data.signedUrl };
    },
    async ExtractDataFromUploadedFile({ file_url, json_schema }) {
      const { data } = await functions.invoke('extract-data', { file_url, json_schema });
      return data;
    },
    async GenerateImage({ prompt }) {
      const { data } = await functions.invoke('generate-image', { prompt });
      return data;
    },
    async SendEmail({ to, subject, body }) {
      const { data } = await functions.invoke('send-email', { to, subject, body });
      return data;
    },
    async SendSMS({ to, message }) {
      const { data } = await functions.invoke('send-sms', { to, message });
      return data;
    },
  },
};

// ─────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────
const analytics = {
  track(event) { console.debug('[analytics]', event); },
};

// ─────────────────────────────────────────────
// APP LOGS (Base44 Kompatibilität)
// ─────────────────────────────────────────────
const appLogs = {
  async logUserInApp(path) {
    console.debug('[appLogs] navigation:', path);
  },
};

// ─────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────
export const base44 = {
  auth,
  functions,
  integrations,
  analytics,
  appLogs,
  entities: {
    Catch: createEntity('catches'),
    Spot: createEntity('spots'),
    SpotGroup: createEntity('spot_groups'),
    Post: createEntity('posts'),
    Comment: createEntity('comments'),
    FishingClub: createEntity('fishing_clubs'),
    FishingPlan: createEntity('fishing_plans'),
    RuleEntry: createEntity('rule_entries'),
    Species: createEntity('species'),
    License: createEntity('licenses'),
    BaitIngredient: createEntity('bait_ingredients'),
    BaitRecipe: createEntity('bait_recipes'),
    LeaderboardEntry: createEntity('leaderboard_entries'),
    PremiumWallet: createEntity('premium_wallets'),
    ChatMessage: createEntity('chat_messages'),
    WaterAnalysisHistory: createEntity('water_analysis_history'),
    FishingEvent: createEntity('fishing_events'),
    ExamQuestion: createEntity('exam_questions'),
    // Fehlende Entities hinzugefügt
    UsageSession: createEntity('usage_sessions'),
    ChatSession: createEntity('chat_sessions'),
    Clan: createEntity('clans'),
    Competition: createEntity('competitions'),
    FunctionRating: createEntity('function_ratings'),
    GearListing: createEntity('gear_listings'),
    AppEvent: createEntity('app_events'),
    BathymetricMap: createEntity('bathymetric_maps'),
    DepthDataPoint: createEntity('depth_data_points'),
    VotingLike: createEntity('voting_likes'),
    WaterReview: createEntity('water_reviews'),
    User: {
      ...createEntity('profiles'),
      me: auth.me.bind(auth),
      filter: async (filters = {}) => {
        let query = supabase.from('profiles').select('*');
        Object.entries(filters).forEach(([k, v]) => { if (v !== undefined) query = query.eq(k, v); });
        const { data, error } = await query;
        if (error) throw error;
        return data ?? [];
      },
    },
    _supabase: supabase,
  },
};

export default base44;
