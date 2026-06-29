'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { fetchCart, checkout, verifyPayment } from '@/lib/api'
import { openRazorpayCheckout } from '@/lib/razorpay'
import type { RazorpayPaymentResponse } from '@/lib/razorpay'
import { formatPrice } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useAuthStore } from '@/lib/authStore'
import { Zap } from 'lucide-react'

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand',
  'West Bengal','Delhi','Jammu & Kashmir','Ladakh','Puducherry',
]

interface AddressForm {
  name: string
  phone: string
  line1: string
  line2: string
  city: string
  state: string
  pincode: string
}

interface FormErrors {
  name?: string
  phone?: string
  line1?: string
  city?: string
  state?: string
  pincode?: string
  notes?: string
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-red-500 text-xs mt-1">{msg}</p>
}

export default function CheckoutPage() {
  const router = useRouter()
  const { isAuthenticated, hydrated, user } = useRequireAuth()
  const authUser = useAuthStore((s) => s.user)

  const [address, setAddress] = useState<AddressForm>({
    name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '',
  })
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [apiError, setApiError] = useState('')
  const [processing, setProcessing] = useState(false)

  const { data: cart, isLoading: cartLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
    enabled: isAuthenticated,
  })

  const verifyMutation = useMutation({
    mutationFn: verifyPayment,
    onSuccess: () => {
      router.push('/orders')
    },
    onError: () => {
      setApiError('Payment verification failed. Please contact support.')
      setProcessing(false)
    },
  })

  const checkoutMutation = useMutation({
    mutationFn: checkout,
    onSuccess: async (data) => {
      const { payment } = data
      try {
        await openRazorpayCheckout({
          key:         payment.keyId,
          amount:      payment.amount,
          currency:    payment.currency,
          order_id:    payment.razorpayOrderId,
          name:        'ThriftBazaar',
          description: 'Pre-loved fashion order',
          prefill: {
            email:   authUser?.email,
            contact: address.phone,
            name:    address.name,
          },
          theme: { color: '#5B21B6' },
          handler: (response: RazorpayPaymentResponse) => {
            verifyMutation.mutate({
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })
          },
          modal: {
            ondismiss: () => {
              setProcessing(false)
              setApiError('Payment was cancelled. You can try again.')
            },
          },
        })
      } catch (err) {
        setApiError(
          err instanceof Error
            ? err.message
            : 'Could not open payment window. Ensure Razorpay is configured.',
        )
        setProcessing(false)
      }
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Checkout failed. Please try again.'
      setApiError(msg)
      setProcessing(false)
    },
  })

  function validate(): boolean {
    const e: FormErrors = {}
    if (!address.name.trim()) e.name = 'Full name required'
    if (!address.phone || !/^[6-9]\d{9}$/.test(address.phone)) e.phone = 'Valid 10-digit Indian mobile required'
    if (!address.line1.trim() || address.line1.trim().length < 5) e.line1 = 'Address line 1 required (min 5 chars)'
    if (!address.city.trim()) e.city = 'City required'
    if (!address.state) e.state = 'State required'
    if (!address.pincode || !/^\d{6}$/.test(address.pincode)) e.pincode = '6-digit PIN code required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handlePay(e: React.FormEvent) {
    e.preventDefault()
    setApiError('')
    if (!validate()) return
    setProcessing(true)
    checkoutMutation.mutate({
      shippingAddress: {
        name:    address.name,
        phone:   address.phone,
        line1:   address.line1,
        line2:   address.line2 || undefined,
        city:    address.city,
        state:   address.state,
        pincode: address.pincode,
      },
      notes: notes || undefined,
    })
  }

  function setField(field: keyof AddressForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setAddress((a) => ({ ...a, [field]: e.target.value }))
      setErrors((err) => ({ ...err, [field]: undefined }))
    }
  }

  if (!hydrated) return null
  if (!isAuthenticated) return <div className="min-h-screen flex items-center justify-center text-gray-400">Redirecting...</div>

  return (
    <div className="bg-brand-cream min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-heading text-3xl font-bold text-brand-purple mb-8 uppercase tracking-wide">Checkout</h1>

        {apiError && (
          <div className="mb-6 pixel-border-saffron bg-red-50 text-red-700 text-sm px-4 py-3">
            {apiError}
          </div>
        )}

        <form onSubmit={handlePay}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Shipping address */}
            <div className="lg:col-span-2 space-y-5">
              <div className="pixel-card overflow-hidden">
                <div className="pixel-section-header px-5 py-3">
                  <span className="uppercase tracking-widest text-xs font-bold">Delivery Address</span>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input type="text" placeholder="Name on delivery" value={address.name} onChange={setField('name')} className="pixel-input w-full px-4 py-2.5 text-sm" />
                    <FieldError msg={errors.name} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <div className="flex">
                      <span className="pixel-border-sm inline-flex items-center px-3 bg-gray-100 text-sm text-gray-600 font-medium">+91</span>
                      <input
                        type="tel"
                        placeholder="9876543210"
                        value={address.phone}
                        onChange={setField('phone')}
                        maxLength={10}
                        className="pixel-input flex-1 px-4 py-2.5 text-sm"
                        style={{ borderLeft: 'none' }}
                      />
                    </div>
                    <FieldError msg={errors.phone} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                    <input type="text" placeholder="House/Flat no., Building name, Street" value={address.line1} onChange={setField('line1')} className="pixel-input w-full px-4 py-2.5 text-sm" />
                    <FieldError msg={errors.line1} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2 <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input type="text" placeholder="Area, Landmark" value={address.line2} onChange={setField('line2')} className="pixel-input w-full px-4 py-2.5 text-sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input type="text" placeholder="Mumbai" value={address.city} onChange={setField('city')} className="pixel-input w-full px-4 py-2.5 text-sm" />
                      <FieldError msg={errors.city} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
                      <input type="text" placeholder="400001" value={address.pincode} onChange={setField('pincode')} maxLength={6} className="pixel-input w-full px-4 py-2.5 text-sm" />
                      <FieldError msg={errors.pincode} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <select value={address.state} onChange={setField('state')} className="pixel-input w-full px-4 py-2.5 text-sm">
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <FieldError msg={errors.state} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input type="text" placeholder="Any instructions for the seller..." value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} className="pixel-input w-full px-4 py-2.5 text-sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Order summary */}
            <div>
              <div className="pixel-card p-6 sticky top-24 space-y-4">
                <h2 className="font-bold text-gray-900 text-lg uppercase tracking-wide">Order Summary</h2>

                {cartLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : cart ? (
                  <>
                    <div className="space-y-3 max-h-48 overflow-y-auto scrollbar-hide">
                      {cart.groups.map((group) =>
                        group.items.map((item) => (
                          <div key={item.productId} className="flex items-center gap-2 text-sm">
                            <div className="w-10 h-10 overflow-hidden bg-gray-100 flex-shrink-0 pixel-border-sm">
                              {item.images?.[0] && (
                                <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="truncate font-medium text-gray-800 text-xs">{item.title}</p>
                              <p className="text-xs text-gray-400">{group.storeName}</p>
                            </div>
                            <span className="font-medium text-xs">{formatPrice(item.sellingPrice)}</span>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="border-t-2 border-gray-200 pt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal ({cart.itemCount} items)</span>
                        <span>{formatPrice(cart.total)}</span>
                      </div>
                      <div className="flex justify-between text-gray-400 text-xs">
                        <span>Platform fee</span>
                        <span>included</span>
                      </div>
                    </div>

                    <div className="border-t-2 border-gray-200 pt-3 flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-brand-saffron text-lg">{formatPrice(cart.total)}</span>
                    </div>
                  </>
                ) : null}

                <button
                  type="submit"
                  disabled={processing || cartLoading || !cart?.itemCount}
                  className="pixel-btn bg-brand-saffron text-white font-bold w-full py-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {processing ? 'Processing...' : <span className="flex items-center gap-2 justify-center"><Zap size={16} /> PAY NOW</span>}
                </button>

                <p className="text-xs text-gray-400 text-center">
                  Secured by Razorpay. Your payment is encrypted.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
