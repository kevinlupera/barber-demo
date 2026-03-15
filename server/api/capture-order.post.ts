/**
 * POST /api/capture-order
 * Captura (finaliza) una orden de PayPal aprobada
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { orderId } = await readBody<{ orderId: string }>(event)

  if (!orderId) {
    throw createError({ statusCode: 400, message: 'orderId requerido' })
  }

  const accessToken = await getPayPalAccessToken()

  const capture = await $fetch(
    `${config.paypalBaseUrl}/v2/checkout/orders/${orderId}/capture`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': crypto.randomUUID()
      }
    }
  )

  return capture
})
