/**
 * Obtiene un access token de PayPal usando Client Credentials
 */
export async function getPayPalAccessToken(): Promise<string> {
  const config = useRuntimeConfig()

  const credentials = Buffer.from(
    `${config.public.paypalClientId}:${config.paypalClientSecret}`
  ).toString('base64')

  const response = await $fetch<{ access_token: string }>(
    `${config.paypalBaseUrl}/v1/oauth2/token`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    }
  )

  return response.access_token
}
