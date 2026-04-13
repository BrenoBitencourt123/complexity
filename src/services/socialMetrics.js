// ═══════════════════════════════════════════════════
// socialMetrics — Integração com APIs de redes sociais
// OAuth via Supabase Edge Functions (tokens nunca no frontend)
// ═══════════════════════════════════════════════════

import { supabase } from '../lib/supabase.js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`

// Escopos necessários para YouTube Data API + Analytics API
const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
].join(' ')

/**
 * Redireciona o usuário para a tela de consentimento do Google.
 * Após aprovação, o Google redireciona para a Edge Function de callback
 * que salva os tokens e redireciona de volta para o app.
 */
export function iniciarOAuthYouTube() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId) {
    throw new Error('VITE_GOOGLE_CLIENT_ID não configurado no .env.local')
  }

  const redirectUri = `${SUPABASE_URL}/functions/v1/social-oauth-callback`

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: YOUTUBE_SCOPES,
    access_type: 'offline',   // garante receber refresh_token
    prompt: 'consent',        // força exibir tela de consentimento (necessário para refresh_token)
    state: 'youtube',         // identifica a plataforma no callback
  })

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

/**
 * Chama a Edge Function para buscar métricas de uma plataforma conectada.
 * A Edge Function usa os tokens armazenados e renova automaticamente se expirados.
 */
export async function buscarMetricas(platform) {
  const res = await fetch(`${FUNCTIONS_URL}/social-metrics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform }),
  })

  const data = await res.json()

  if (data.error === 'not_connected') return { conectado: false }
  if (data.error === 'token_expired') return { conectado: false, expirado: true }
  if (data.error) throw new Error(data.error)

  return { conectado: true, ...data }
}

/**
 * Verifica quais plataformas já estão conectadas consultando a tabela social_tokens.
 * Retorna array com { platform, channel_name, updated_at } das plataformas conectadas.
 */
export async function getPlataformasConectadas() {
  const { data, error } = await supabase
    .from('social_tokens')
    .select('platform, channel_name, updated_at')

  if (error) {
    console.error('Erro ao verificar conexões:', error)
    return []
  }

  return data || []
}

/**
 * Remove tokens de uma plataforma (desconecta).
 */
export async function desconectarPlataforma(platform) {
  const { error } = await supabase
    .from('social_tokens')
    .delete()
    .eq('platform', platform)

  if (error) throw new Error(`Erro ao desconectar: ${error.message}`)
}
