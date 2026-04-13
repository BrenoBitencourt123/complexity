// ═══════════════════════════════════════════════════
// Edge Function: social-metrics
// Busca métricas das plataformas conectadas usando os
// tokens armazenados. Renova o token automaticamente se expirado.
// ═══════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response('Método não permitido.', { status: 405, headers: CORS_HEADERS })
  }

  let platform: string
  try {
    const body = await req.json()
    platform = body.platform
  } catch {
    return json({ error: 'Body inválido.' }, 400)
  }

  if (!platform) return json({ error: 'platform é obrigatório.' }, 400)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Busca tokens armazenados
  const { data: tokenRow, error: fetchError } = await supabase
    .from('social_tokens')
    .select('*')
    .eq('platform', platform)
    .maybeSingle()

  if (fetchError || !tokenRow) {
    return json({ error: 'not_connected' }, 401)
  }

  // Renova o token se estiver expirado (com 5min de margem)
  let accessToken = tokenRow.access_token
  const expiresAt = new Date(tokenRow.expires_at).getTime()
  const agora = Date.now() + 5 * 60 * 1000 // 5min de margem

  if (expiresAt < agora) {
    const novoToken = await renovarTokenGoogle(tokenRow.refresh_token, supabase)
    if (!novoToken) return json({ error: 'token_expired' }, 401)
    accessToken = novoToken
  }

  try {
    if (platform === 'youtube') {
      const metricas = await buscarMetricasYouTube(accessToken, tokenRow.channel_id)
      return json(metricas)
    }

    return json({ error: 'Plataforma não suportada.' }, 400)
  } catch (err) {
    console.error(`Erro ao buscar métricas (${platform}):`, err)
    return json({ error: 'Falha ao buscar métricas.' }, 500)
  }
})

// ─── Renova access token Google com o refresh token ───
async function renovarTokenGoogle(refreshToken: string, supabase: any): Promise<string | null> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
      grant_type: 'refresh_token',
    }),
  })

  const data = await res.json()
  if (data.error) {
    console.error('Falha ao renovar token Google:', data.error)
    return null
  }

  const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString()
  await supabase.from('social_tokens').update({
    access_token: data.access_token,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  }).eq('platform', 'youtube')

  return data.access_token
}

// ─── Busca métricas do YouTube (Data API + Analytics API) ───
async function buscarMetricasYouTube(accessToken: string, channelId?: string) {
  const hoje = new Date().toISOString().slice(0, 10)
  const seteDiasAtras = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)

  // Dados do canal — usa channel_id salvo se disponível, fallback para mine=true
  const channelParam = channelId ? `id=${channelId}` : 'mine=true'
  const canalRes = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&${channelParam}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const canalData = await canalRes.json()
  console.log('Canal API response:', JSON.stringify(canalData))
  const canal = canalData.items?.[0]
  const stats = canal?.statistics || {}

  // Analytics dos últimos 7 dias — usa channel_id real se disponível
  const analyticsChannelId = channelId || canal?.id
  const analyticsUrl = new URL('https://youtubeanalytics.googleapis.com/v2/reports')
  analyticsUrl.searchParams.set('ids', `channel==${analyticsChannelId || 'MINE'}`)
  analyticsUrl.searchParams.set('startDate', seteDiasAtras)
  analyticsUrl.searchParams.set('endDate', hoje)
  analyticsUrl.searchParams.set('metrics', 'views,likes,comments,subscribersGained,subscribersLost,estimatedMinutesWatched')
  analyticsUrl.searchParams.set('dimensions', 'day')

  const analyticsRes = await fetch(analyticsUrl.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const analyticsData = await analyticsRes.json()
  console.log('Analytics API response:', JSON.stringify(analyticsData))

  // Colunas: [date, views, likes, comments, subsGained, subsLost, minutes]
  const rows: number[][] = analyticsData.rows || []
  const views7d = rows.reduce((s, r) => s + (r[1] || 0), 0)
  const likes7d = rows.reduce((s, r) => s + (r[2] || 0), 0)
  const comments7d = rows.reduce((s, r) => s + (r[3] || 0), 0)
  const subsGained7d = rows.reduce((s, r) => s + (r[4] || 0), 0)
  const subsLost7d = rows.reduce((s, r) => s + (r[5] || 0), 0)
  const minutes7d = rows.reduce((s, r) => s + (r[6] || 0), 0)

  const inscritos = parseInt(stats.subscriberCount || '0')
  const crescimento_semanal = inscritos > 0
    ? +((subsGained7d - subsLost7d) / inscritos * 100).toFixed(1)
    : 0

  const taxa_engajamento = views7d > 0
    ? +((likes7d + comments7d) / views7d * 100).toFixed(1)
    : 0

  return {
    plataforma: 'youtube',
    canal_nome: canal?.snippet?.title ?? null,
    inscritos,
    crescimento_semanal,
    taxa_engajamento,
    views_7d: views7d,
    likes_7d: likes7d,
    comments_7d: comments7d,
    subs_ganhos_7d: subsGained7d,
    subs_perdidos_7d: subsLost7d,
    minutos_assistidos_7d: minutes7d,
  }
}

// ─── Helper ───
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}
