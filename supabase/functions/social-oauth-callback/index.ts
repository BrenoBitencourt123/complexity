// ═══════════════════════════════════════════════════
// Edge Function: social-oauth-callback
// Recebe o código OAuth das plataformas, troca por tokens,
// salva no banco e redireciona de volta pro app.
// ═══════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const platform = url.searchParams.get('state') // passamos a plataforma no state
  const oauthError = url.searchParams.get('error')

  const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173'

  if (oauthError) {
    return Response.redirect(`${appUrl}?oauth_error=${oauthError}`)
  }

  if (!code || !platform) {
    return new Response('Parâmetros inválidos.', { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    if (platform === 'youtube') {
      return await handleYouTubeCallback(code, supabase, appUrl)
    }

    return new Response('Plataforma não suportada.', { status: 400 })
  } catch (err) {
    console.error('Erro no callback OAuth:', err)
    return Response.redirect(`${appUrl}?oauth_error=internal_error`)
  }
})

async function handleYouTubeCallback(code: string, supabase: any, appUrl: string) {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID')!
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const redirectUri = `${supabaseUrl}/functions/v1/social-oauth-callback`

  // Troca o código por tokens
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  const tokens = await tokenRes.json()

  if (tokens.error) {
    console.error('Erro ao trocar código Google:', tokens.error_description)
    return Response.redirect(`${appUrl}?oauth_error=${tokens.error}`)
  }

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

  // Busca informações do canal
  const channelRes = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
    { headers: { Authorization: `Bearer ${tokens.access_token}` } }
  )
  const channelData = await channelRes.json()
  const channel = channelData.items?.[0]

  // Salva tokens no banco (upsert por plataforma)
  const { error } = await supabase.from('social_tokens').upsert({
    platform: 'youtube',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_type: tokens.token_type || 'Bearer',
    expires_at: expiresAt,
    scope: tokens.scope,
    channel_id: channel?.id ?? null,
    channel_name: channel?.snippet?.title ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'platform' })

  if (error) {
    console.error('Erro ao salvar token no Supabase:', error)
    return Response.redirect(`${appUrl}?oauth_error=db_error`)
  }

  return Response.redirect(`${appUrl}?oauth_success=youtube`)
}
