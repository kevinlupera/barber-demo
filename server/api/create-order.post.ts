/**
 * POST /api/create-order
 * Crea una orden de PayPal para el servicio "Corte Clásico" ($25.00 USD)
 */
export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const accessToken = await getPayPalAccessToken()

  const order = await $fetch(`${config.paypalBaseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': crypto.randomUUID()
    },
    body: {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: '25.00'
          },
          description: 'Corte Clásico — The Barber'
        }
      ]
    }
  })

  return order
})
