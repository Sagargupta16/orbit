export interface Tokens {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface User {
  id: number
  email: string
  full_name: string | null
  is_active: boolean
  is_verified: boolean
  auth_provider: string | null
  created_at: string
  last_login: string | null
}

export interface OAuthProviderConfig {
  provider: string
  client_id: string
  authorize_url: string
  scope: string
  redirect_uri: string
  state: string
}
