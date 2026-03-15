export default defineNuxtConfig({
  devtools: { enabled: true },
  compatibilityDate: '2024-11-01',

  runtimeConfig: {
    paypalClientSecret: '',
    paypalBaseUrl: 'https://api-m.sandbox.paypal.com',
    public: {
      paypalClientId: ''
    }
  }
})
