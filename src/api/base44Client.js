/**
 * CATCHLY - Base44 → Supabase Kompatibilitäts-Schicht
 *
 * Diese Datei ersetzt das @base44/sdk vollständig.
 * Alle base44.entities.X, base44.auth, base44.functions Aufrufe
 * werden auf Supabase umgeleitet – ohne Änderungen in den Seiten.
 */

import { supabase } from '@/lib/supabase';

// ─────────────────────────────────────────────
// ENTITY FACTORY
// Erzeugt ein Objekt das base44.entities.X imitiert
// ─────────────────────────────────────────────
function createEntity(tableName) {
  return {
    // list(orderBy?, limit?) → Array
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

    // filter(filters, orderBy?, limit?) → Array
    async filter(filters = {}, orderBy = '-created_at', limit = 500) {
      let query = supabase.from(tableName).select('*').limit(limit);

      // Nur Nicht-null-Felder als Filter übergeben
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
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

    // get(id) → Object
    async get(id) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },

    // create(payload) → Object
    async create(payload) {
      const { data: { user } } = await supabase.auth.getUser();
      const row = {
        ...payload,
        created_by: user?.email ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from(tableName)
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    // update(id, payload) → Object
    async update(id, payload) {
      const { data, error } = await supabase
        .from(tableName)
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    // delete(id) → void
    async delete(id) {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
    },

    // bulkCreate(rows) → Array
    async bulkCreate(rows) {
      const { data: { user } } = await supabase.auth.getUser();
      const ts = new Date().toISOString();
      const enriched = rows.map(r => ({
        ...r,
        created_by: user?.email ?? null,
        created_at: ts,
        updated_at: ts,
      }));

      const { data, error } = await supabase
        .from(tableName)
        .insert(enriched)
        .select();
      if (error) throw error;
      return data ?? [];
    },
  };
}

// ─────────────────────────────────────────────
// AUTH  (ersetzt base44.auth)
// ─────────────────────────────────────────────
const auth = {
  async me() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error('Not authenticated');

    // Lade erweiterte Profil-Daten aus der profiles-Tabelle
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...payload, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // updateMyUserData – identisch zu updateMe, wird von vielen Komponenten genutzt
  async updateMyUserData(payload) {
    return auth.updateMe(payload);
  },

  async logout(redirectTo = '/') {
    await supabase.auth.signOut();
    window.location.href = redirectTo;
  },

  // Gibt den aktuellen Supabase-User zurück (schneller als me())
  async getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async list() {
    // Admin-only: alle User – via RLS geschützt
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    return data ?? [];
  },
};

// ─────────────────────────────────────────────
// FUNCTIONS  (ersetzt base44.functions.invoke)
// Ruft Supabase Edge Functions auf
// ─────────────────────────────────────────────
const functions = {
  async invoke(functionName, payload = {}, options = {}) {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload,
      ...options,
    });
    if (error) throw error;
    return { data };
  },
};

// ─────────────────────────────────────────────
// INTEGRATIONS  (ersetzt base44.integrations.Core)
// ─────────────────────────────────────────────
const integrations = {
  Core: {
    // LLM über Edge Function
    async InvokeLLM({ prompt, response_json_schema, add_context_from_internet }) {
      const { data } = await functions.invoke('invoke-llm', {
        prompt,
        response_json_schema,
        add_context_from_internet,
      });
      return data;
    },

    // Datei Upload zu Supabase Storage
    async UploadFile({ file, bucket = 'uploads' }) {
      const ext = file.name?.split('.').pop() ?? 'bin';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
      return { file_url: publicUrl };
    },

    // Bild-URL für privaten Zugriff
    async CreateFileSignedUrl({ file_url, expires_in = 3600 }) {
      // Extrahiere den Pfad aus der URL
      const path = file_url.split('/storage/v1/object/public/uploads/')[1];
      const { data, error } = await supabase.storage
        .from('uploads')
        .createSignedUrl(path, expires_in);
      if (error) throw error;
      return { signed_url: data.signedUrl };
    },

    // Daten aus hochgeladenem File extrahieren (via Edge Function)
    async ExtractDataFromUploadedFile({ file_url, json_schema }) {
      const { data } = await functions.invoke('extract-data', { file_url, json_schema });
      return data;
    },

    // Bild generieren (via Edge Function)
    async GenerateImage({ prompt }) {
      const { data } = await functions.invoke('generate-image', { prompt });
      return data;
    },

    // E-Mail senden (via Edge Function)
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
// ANALYTICS  (Stub – optional später erweiterbar)
// ─────────────────────────────────────────────
const analytics = {
  track(event) {
    // Kann später mit PostHog, Mixpanel etc. verbunden werden
    console.debug('[analytics]', event);
  },
};

// ─────────────────────────────────────────────
// HAUPT-EXPORT  (base44-kompatibel)
// ─────────────────────────────────────────────
export const base44 = {
  auth,
  functions,
  integrations,
  analytics,

  // Alle Entitäten – erweitere die Liste bei Bedarf
  entities: {
    // Fangbuch
    Catch: createEntity('catches'),
    Spot: createEntity('spots'),
    SpotGroup: createEntity('spot_groups'),

    // Community
    Post: createEntity('posts'),
    Comment: createEntity('comments'),
    FishingClub: createEntity('fishing_clubs'),

    // Planung
    FishingPlan: createEntity('fishing_plans'),

    // Wissen
    RuleEntry: createEntity('rule_entries'),
    Species: createEntity('species'),
    ExamQuestion: createEntity('exam_questions'),

    // Ausrüstung
    License: createEntity('licenses'),
    BaitIngredient: createEntity('bait_ingredients'),
    BaitRecipe: createEntity('bait_recipes'),

    // Premium
    LeaderboardEntry: createEntity('leaderboard_entries'),
    PremiumWallet: createEntity('premium_wallets'),

    // Chat
    ChatMessage: createEntity('chat_messages'),

    // Analyse
    WaterAnalysisHistory: createEntity('water_analysis_history'),

    // Events
    FishingEvent: createEntity('fishing_events'),

    // Direkte Supabase-Client-Referenz für komplexe Queries
    _supabase: supabase,
  },
};

export default base44;
