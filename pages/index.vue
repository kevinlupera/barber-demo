<script setup lang="ts">
const config = useRuntimeConfig()

const paymentStatus = ref<'idle' | 'processing' | 'success' | 'error'>('idle')
const errorMessage = ref('')

// ─── Carga SDK solo en el cliente para evitar error SSR/hydration ──────────
// enable-funding=applepay: permite que PayPal renderice el botón de Apple Pay
function loadPayPalScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).paypal) return resolve()
    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${config.public.paypalClientId}&currency=USD&components=buttons&enable-funding=applepay`
    script.crossOrigin = 'anonymous'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('No se pudo cargar el SDK de PayPal'))
    document.head.appendChild(script)
  })
}

// ─── Helpers compartidos ───────────────────────────────────────────────────

async function createOrder(): Promise<string> {
  const order = await $fetch<{ id: string }>('/api/create-order', { method: 'POST' })
  return order.id
}

async function captureOrder(orderId: string): Promise<void> {
  paymentStatus.value = 'processing'
  errorMessage.value = ''
  try {
    const result = await $fetch<{ status: string }>('/api/capture-order', {
      method: 'POST',
      body: { orderId }
    })
    if (result.status === 'COMPLETED') {
      paymentStatus.value = 'success'
    } else {
      throw new Error('Pago no completado')
    }
  } catch {
    paymentStatus.value = 'error'
    errorMessage.value = 'Error al completar el pago. Por favor intenta de nuevo.'
  }
}

// ─── Renderizar botones via PayPal SDK ─────────────────────────────────────

function renderPaymentButtons() {
  const paypal = (window as any).paypal
  if (!paypal) return

  const sharedConfig = {
    createOrder,
    onApprove: (data: { orderID: string }) => captureOrder(data.orderID),
    onError: () => {
      paymentStatus.value = 'error'
      errorMessage.value = 'Ocurrió un error. Por favor intenta de nuevo.'
    },
    onCancel: () => {
      paymentStatus.value = 'idle'
      errorMessage.value = ''
    }
  }

  // ─── Apple Pay — PayPal lo renderiza y controla la elegibilidad ───────────
  // Solo aparece en Safari con Apple Pay configurado y dominio verificado en PayPal
  const applePayBtn = paypal.Buttons({
    ...sharedConfig,
    fundingSource: paypal.FUNDING.APPLEPAY
  })

  if (applePayBtn.isEligible()) {
    applePayBtn.render('#apple-pay-container')
  } else {
    const section = document.getElementById('apple-pay-section')
    if (section) section.style.display = 'none'
  }

  // ─── PayPal estándar ──────────────────────────────────────────────────────
  paypal.Buttons({
    ...sharedConfig,
    fundingSource: paypal.FUNDING.PAYPAL,
    style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay', tagline: false }
  }).render('#paypal-button-container')
}

onMounted(async () => {
  try {
    await loadPayPalScript()
    renderPaymentButtons()
  } catch {
    errorMessage.value = 'No se pudo cargar el módulo de pagos. Recarga la página.'
  }
})
</script>

<template>
  <div class="page">
    <!-- ─── Header ─────────────────────────────────────────── -->
    <header class="header">
      <div class="header-inner">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="icon-scissors"
        >
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <line x1="20" y1="4" x2="8.12" y2="15.88" />
          <line x1="14.47" y1="14.48" x2="20" y2="20" />
          <line x1="8.12" y1="8.12" x2="12" y2="12" />
        </svg>
        <span class="brand">THE BARBER</span>
      </div>
    </header>

    <!-- ─── Main ───────────────────────────────────────────── -->
    <main class="main">

      <!-- Estado: Pago exitoso -->
      <div v-if="paymentStatus === 'success'" class="success-card">
        <div class="success-check">✓</div>
        <h2>¡Pago completado!</h2>
        <p>Tu cita ha sido confirmada. Te esperamos pronto.</p>
        <button class="btn-reset" @click="paymentStatus = 'idle'">
          Nueva reserva
        </button>
      </div>

      <!-- Estado: Normal -->
      <template v-else>

        <!-- ─── Tarjeta de producto ──────────────────────────── -->
        <article class="product-card">
          <!-- Imagen decorativa -->
          <div class="product-image-area">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="scissors-hero">
              <!-- Aro superior -->
              <circle cx="20" cy="20" r="13" stroke="#c9a84c" stroke-width="1.5" />
              <circle cx="20" cy="20" r="5" fill="#c9a84c" opacity="0.3" />
              <!-- Aro inferior -->
              <circle cx="20" cy="80" r="13" stroke="#c9a84c" stroke-width="1.5" />
              <circle cx="20" cy="80" r="5" fill="#c9a84c" opacity="0.3" />
              <!-- Hojas de la tijera -->
              <line x1="31" y1="26" x2="88" y2="16" stroke="#c9a84c" stroke-width="1.5" stroke-linecap="round" />
              <line x1="31" y1="74" x2="88" y2="84" stroke="#c9a84c" stroke-width="1.5" stroke-linecap="round" />
              <!-- Cruce / pivote -->
              <line x1="31" y1="28" x2="50" y2="50" stroke="#c9a84c" stroke-width="1.5" stroke-linecap="round" />
              <circle cx="50" cy="50" r="3" fill="#c9a84c" />
              <!-- Extensión superior -->
              <line x1="50" y1="50" x2="88" y2="38" stroke="#c9a84c" stroke-width="1" stroke-linecap="round" opacity="0.4" />
              <!-- Extensión inferior -->
              <line x1="50" y1="50" x2="88" y2="62" stroke="#c9a84c" stroke-width="1" stroke-linecap="round" opacity="0.4" />
            </svg>
          </div>

          <!-- Detalles -->
          <div class="product-body">
            <span class="badge">Servicio premium</span>
            <h1 class="product-title">Corte Clásico</h1>
            <p class="product-desc">
              Corte de cabello profesional con técnica clásica.
              Incluye lavado, corte personalizado y styling final.
            </p>
            <div class="price-row">
              <span class="price">$25.00</span>
              <span class="currency">USD</span>
            </div>
          </div>
        </article>

        <!-- ─── Sección de pago ──────────────────────────────── -->
        <section class="payment-card">
          <p class="payment-heading">Método de pago</p>

          <!-- Apple Pay — renderizado por PayPal SDK (solo Safari + Apple Pay configurado) -->
          <div id="apple-pay-section" class="payment-block">
            <div id="apple-pay-container"></div>
          </div>

          <!-- Separador -->
          <div class="divider"><span>o continúa con</span></div>

          <!-- PayPal estándar -->
          <div class="payment-block">
            <div id="paypal-button-container"></div>
          </div>

          <!-- Mensaje de error -->
          <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>

          <!-- Overlay de procesando -->
          <div v-if="paymentStatus === 'processing'" class="processing-overlay">
            <div class="spinner" />
            <span>Procesando pago…</span>
          </div>
        </section>

        <!-- Nota de seguridad -->
        <p class="security-note">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="lock-icon">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Pagos seguros procesados por PayPal
        </p>
      </template>

    </main>
  </div>
</template>

<style>
/* ── Reset global ─────────────────────────────────────── */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --bg: #0d0d0d;
  --surface: #141414;
  --surface-2: #1c1c1c;
  --border: #252525;
  --gold: #c9a84c;
  --gold-dim: rgba(201, 168, 76, 0.12);
  --text: #efefef;
  --text-muted: #7a7a7a;
  --radius: 14px;
  --font: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
}

html, body {
  min-height: 100vh;
  background-color: var(--bg);
  color: var(--text);
  font-family: var(--font);
  -webkit-font-smoothing: antialiased;
}
</style>

<style scoped>
/* ── Layout ───────────────────────────────────────────── */
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 16px 48px;
}

/* ── Header ───────────────────────────────────────────── */
.header {
  width: 100%;
  max-width: 440px;
  padding: 28px 0 22px;
}

.header-inner {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-scissors {
  width: 20px;
  height: 20px;
  color: var(--gold);
}

.brand {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.25em;
  color: var(--text);
}

/* ── Main ─────────────────────────────────────────────── */
.main {
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── Tarjeta de producto ──────────────────────────────── */
.product-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.product-image-area {
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
  height: 164px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scissors-hero {
  width: 90px;
  height: 90px;
  opacity: 0.85;
}

.product-body {
  padding: 24px;
}

.badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--gold);
  background: var(--gold-dim);
  padding: 4px 10px;
  border-radius: 100px;
  margin-bottom: 14px;
}

.product-title {
  font-size: 28px;
  font-weight: 300;
  letter-spacing: -0.02em;
  color: var(--text);
  margin-bottom: 10px;
}

.product-desc {
  font-size: 14px;
  line-height: 1.65;
  color: var(--text-muted);
  margin-bottom: 20px;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.price {
  font-size: 34px;
  font-weight: 600;
  color: var(--gold);
  letter-spacing: -0.03em;
}

.currency {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-muted);
  letter-spacing: 0.06em;
}

/* ── Tarjeta de pago ──────────────────────────────────── */
.payment-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
  position: relative;
  overflow: hidden;
}

.payment-heading {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 20px;
}

.payment-block {
  margin-bottom: 12px;
}

.method-label {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  margin-bottom: 10px;
}

.apple-logo {
  width: 14px;
  height: 14px;
}

/* ── Separador ────────────────────────────────────────── */
.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 4px 0 20px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}

.divider span {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
}

/* ── Error ────────────────────────────────────────────── */
.error-msg {
  margin-top: 14px;
  font-size: 13px;
  color: #e05252;
  text-align: center;
  line-height: 1.5;
}

/* ── Procesando ───────────────────────────────────────── */
.processing-overlay {
  position: absolute;
  inset: 0;
  background: rgba(20, 20, 20, 0.92);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  font-size: 14px;
  color: var(--text-muted);
  border-radius: var(--radius);
}

.spinner {
  width: 26px;
  height: 26px;
  border: 2px solid var(--border);
  border-top-color: var(--gold);
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Éxito ────────────────────────────────────────────── */
.success-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 52px 24px;
  text-align: center;
}

.success-check {
  width: 56px;
  height: 56px;
  background: rgba(39, 174, 96, 0.12);
  border: 1.5px solid rgba(39, 174, 96, 0.35);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #27ae60;
  margin: 0 auto 22px;
}

.success-card h2 {
  font-size: 22px;
  font-weight: 400;
  margin-bottom: 8px;
}

.success-card p {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 28px;
}

.btn-reset {
  background: none;
  border: 1px solid var(--border);
  color: var(--text-muted);
  padding: 10px 26px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}

.btn-reset:hover {
  border-color: var(--gold);
  color: var(--gold);
}

/* ── Nota de seguridad ────────────────────────────────── */
.security-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

.lock-icon {
  width: 12px;
  height: 12px;
}
</style>
