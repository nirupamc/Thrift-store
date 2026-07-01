'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { Suspense } from 'react'
import { loginUser } from '@/lib/api'
import { useAuthStore } from '@/lib/authStore'
import { Diamond, Sparkles, ChevronDown } from 'lucide-react'

const DEMO_CREDENTIALS = [
  { role: 'Vendor', email: 'retro.raj@example.com',  password: 'Vendor@123' },
  { role: 'Buyer',  email: 'demo.buyer@example.com', password: 'Buyer@123'  },
]

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? ''
  const setAuth = useAuthStore((s) => s.setAuth)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [apiError, setApiError] = useState('')
  const [showDemo, setShowDemo] = useState(false)

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      setAuth(data.user, data.tokens)
      if (redirect) {
        router.push(redirect)
      } else if (data.user.role === 'VENDOR') {
        router.push('/vendor/dashboard')
      } else if (data.user.role === 'ADMIN') {
        router.push('/admin')
      } else {
        router.push('/products')
      }
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Invalid email or password'
      setApiError(msg)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError('')
    if (!email || !password) { setApiError('Email and password are required'); return }
    mutation.mutate({ email, password })
  }

  function fillDemo(cred: typeof DEMO_CREDENTIALS[0]) {
    setEmail(cred.email)
    setPassword(cred.password)
    setApiError('')
    setShowDemo(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-brand-cream relative overflow-hidden">
      {/* Pixel star decorations */}
      <span className="absolute top-16 left-12 select-none pointer-events-none"><Diamond size={16} className="text-brand-saffron" /></span>
      <span className="absolute top-32 right-16 select-none pointer-events-none"><Sparkles size={20} className="text-brand-purple" /></span>
      <span className="absolute bottom-24 left-20 select-none pointer-events-none"><Sparkles size={20} className="text-brand-purple" /></span>
      <span className="absolute bottom-16 right-24 select-none pointer-events-none"><Diamond size={16} className="text-brand-saffron" /></span>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="font-heading text-3xl font-bold text-brand-purple">ThriftBazaar</Link>
          <h1 className="font-heading text-2xl font-bold text-gray-900 mt-6 mb-1 uppercase tracking-wide">Welcome Back</h1>
          <p className="text-gray-500 text-sm">Log in to continue shopping</p>
        </div>

        {/* Demo credentials panel */}
        <div className="mb-4 pixel-card overflow-hidden">
          <button
            type="button"
            onClick={() => setShowDemo((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-brand-purple bg-brand-purple/5 hover:bg-brand-purple/10 transition-colors"
          >
            <span>Demo credentials — try the app instantly</span>
            <ChevronDown size={16} className={`transition-transform ${showDemo ? 'rotate-180' : ''}`} />
          </button>
          {showDemo && (
            <div className="divide-y divide-gray-100">
              {DEMO_CREDENTIALS.map((cred) => (
                <button
                  key={cred.role}
                  type="button"
                  onClick={() => fillDemo(cred)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-brand-cream transition-colors group"
                >
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-purple mr-2">{cred.role}</span>
                    <span className="text-sm text-gray-700">{cred.email}</span>
                    <span className="block text-xs text-gray-400 mt-0.5">Password: {cred.password}</span>
                  </div>
                  <span className="text-xs text-brand-purple opacity-0 group-hover:opacity-100 transition-opacity font-medium">Use →</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="pixel-card p-8 space-y-4">
          {apiError && (
            <div className="pixel-border-saffron bg-red-50 text-red-700 text-sm px-4 py-3">
              {apiError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setApiError('') }}
              placeholder="you@example.com"
              className="pixel-input w-full px-4 py-2.5 text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <Link href="/auth/forgot-password" className="text-xs text-brand-purple hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setApiError('') }}
              placeholder="Enter your password"
              className="pixel-input w-full px-4 py-2.5 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="pixel-btn bg-brand-purple text-white font-bold w-full py-3 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? 'Logging in...' : 'Log In'}
          </button>

          <p className="text-center text-sm text-gray-500 pt-2">
            New to ThriftBazaar?{' '}
            <Link href="/auth/register" className="text-brand-purple font-medium hover:underline">
              Create account
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-brand-cream">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
