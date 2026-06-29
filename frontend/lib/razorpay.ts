export interface RazorpayPaymentResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

export interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  order_id: string
  name: string
  description: string
  handler: (response: RazorpayPaymentResponse) => void
  prefill?: { name?: string; email?: string; contact?: string }
  theme?: { color?: string }
  modal?: { ondismiss?: () => void }
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void }
  }
}

function loadScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') { resolve(false); return }
    if (window.Razorpay) { resolve(true); return }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload  = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export async function openRazorpayCheckout(options: RazorpayOptions): Promise<void> {
  const loaded = await loadScript()
  if (!loaded) throw new Error('Could not load Razorpay SDK. Check your internet connection.')
  const rzp = new window.Razorpay(options)
  rzp.open()
}
