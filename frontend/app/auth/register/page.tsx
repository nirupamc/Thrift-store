'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { registerUser } from '@/lib/api'
import { useAuthStore } from '@/lib/authStore'
import { Diamond, Sparkles, ShoppingBag, Store, ChevronLeft } from 'lucide-react'

type Role = 'BUYER' | 'VENDOR'

interface FormState {
  email: string
  phone: string
  password: string
  confirmPassword: string
  displayName: string
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-red-500 text-xs mt-1">{msg}</p>
}

export default function RegisterPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [step, setStep] = useState<'role' | 'form'>('role')
  const [role, setRole] = useState<Role>('BUYER')
  const [form, setForm] = useState<FormState>({
    email: '', phone: '', password: '', confirmPassword: '', displayName: '',
  })
  const [errors, setErrors] = useState<Partial<FormState>>({})
  const [apiError, setApiError] = useState('')

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      setAuth(data.user, data.tokens)
      if (data.user.role === 'VENDOR') {
        router.push('/vendor/dashboard')
      } else {
        router.push('/products')
      }
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Registration failed. Please try again.'
      setApiError(msg)
    },
  })

  function validate(): boolean {
    const e: Partial<FormState> = {}
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required'
    if (!form.phone || !/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter valid 10-digit Indian mobile number'
    if (!form.password || form.password.length < 8) e.password = 'Minimum 8 characters'
    else if (!/[A-Z]/.test(form.password)) e.password = 'Must contain at least one uppercase letter'
    else if (!/[0-9]/.test(form.password)) e.password = 'Must contain at least one number'
    if (form.confirmPassword !== form.password) e.confirmPassword = 'Passwords do not match'
    if (role === 'VENDOR' && (!form.displayName || form.displayName.trim().length < 2)) {
      e.displayName = 'Store display name required (min 2 chars)'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError('')
    if (!validate()) return
    mutation.mutate({
      email: form.email,
      phone: form.phone,
      password: form.password,
      role,
      ...(role === 'VENDOR' ? { displayName: form.displayName } : {}),
    })
  }

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }))
      setErrors((err) => ({ ...err, [field]: undefined }))
    }
  }

  if (step === 'role') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-brand-cream relative overflow-hidden">
        <span className="absolute top-16 right-12 select-none pointer-events-none"><Diamond size={16} className="text-brand-saffron" /></span>
        <span className="absolute bottom-20 left-16 select-none pointer-events-none"><Sparkles size={20} className="text-brand-purple" /></span>

        <div className="w-full max-w-lg relative z-10">
          <div className="text-center mb-10">
            <Link href="/" className="font-heading text-3xl font-bold text-brand-purple">ThriftBazaar</Link>
            <h1 className="font-heading text-2xl font-bold text-gray-900 mt-6 mb-2 uppercase tracking-wide">Join ThriftBazaar</h1>
            <p className="text-gray-500 text-sm">How would you like to use ThriftBazaar?</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => { setRole('BUYER'); setStep('form') }}
              className="pixel-card hover:pixel-border-saffron flex flex-col items-center gap-3 p-8 text-center transition-all group"
            >
              <ShoppingBag size={56} className="text-brand-purple" />
              <div>
                <div className="font-bold text-gray-900 text-lg group-hover:text-brand-saffron uppercase">I want to Shop</div>
                <div className="text-sm text-gray-500 mt-1">Browse &amp; buy pre-loved fashion</div>
              </div>
            </button>

            <button
              onClick={() => { setRole('VENDOR'); setStep('form') }}
              className="pixel-card hover:pixel-border-saffron flex flex-col items-center gap-3 p-8 text-center transition-all group"
            >
              <Store size={56} className="text-brand-purple" />
              <div>
                <div className="font-bold text-gray-900 text-lg group-hover:text-brand-saffron uppercase">I want to Sell</div>
                <div className="text-sm text-gray-500 mt-1">Open your thrift store</div>
              </div>
            </button>
          </div>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-brand-purple font-medium hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-brand-cream relative overflow-hidden">
      <span className="absolute top-16 left-12 select-none pointer-events-none"><Diamond size={16} className="text-brand-saffron" /></span>
      <span className="absolute bottom-20 right-16 select-none pointer-events-none"><Sparkles size={20} className="text-brand-purple" /></span>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="font-heading text-3xl font-bold text-brand-purple">ThriftBazaar</Link>
          <div className="mt-4 flex items-center gap-2 justify-center">
            {role === 'BUYER' ? <ShoppingBag size={28} /> : <Store size={28} />}
            <h1 className="font-heading text-xl font-bold text-gray-900 uppercase">
              {role === 'BUYER' ? 'Create Buyer Account' : 'Open Your Store'}
            </h1>
          </div>
          <button
            onClick={() => setStep('role')}
            className="mt-2 text-xs text-gray-400 hover:text-brand-purple underline"
          >
            <span className="flex items-center gap-1"><ChevronLeft size={14} /> Change role</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="pixel-card p-8 space-y-4">
          {apiError && (
            <div className="pixel-border-saffron bg-red-50 text-red-700 text-sm px-4 py-3">
              {apiError}
            </div>
          )}

          {role === 'VENDOR' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store Display Name</label>
              <input
                type="text"
                placeholder="e.g. Vintage Closet by Priya"
                value={form.displayName}
                onChange={set('displayName')}
                className="pixel-input w-full px-4 py-2.5 text-sm"
              />
              <FieldError msg={errors.displayName} />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              className="pixel-input w-full px-4 py-2.5 text-sm"
            />
            <FieldError msg={errors.email} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <div className="flex">
              <span className="pixel-border-sm inline-flex items-center px-3 bg-gray-100 text-sm text-gray-600 font-medium">
                +91
              </span>
              <input
                type="tel"
                placeholder="9876543210"
                value={form.phone}
                onChange={set('phone')}
                maxLength={10}
                className="pixel-input flex-1 px-4 py-2.5 text-sm"
                style={{ borderLeft: 'none' }}
              />
            </div>
            <FieldError msg={errors.phone} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              value={form.password}
              onChange={set('password')}
              className="pixel-input w-full px-4 py-2.5 text-sm"
            />
            <FieldError msg={errors.password} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              className="pixel-input w-full px-4 py-2.5 text-sm"
            />
            <FieldError msg={errors.confirmPassword} />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className={`pixel-btn w-full font-bold py-3 text-white mt-2 disabled:opacity-60 disabled:cursor-not-allowed ${
              role === 'VENDOR' ? 'bg-brand-saffron' : 'bg-brand-purple'
            }`}
          >
            {mutation.isPending ? 'Creating account...' : role === 'BUYER' ? 'Create Account' : 'Open My Store'}
          </button>

          <p className="text-center text-sm text-gray-500 pt-2">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-brand-purple font-medium hover:underline">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
