'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRequireRole } from '@/hooks/useRequireRole'
import { useAuthStore } from '@/lib/authStore'
import { getBuyerProfile, updateBuyerProfile } from '@/lib/api'
import { User, Phone, Mail, Lock, Check } from 'lucide-react'

export default function AccountPage() {
  const { authorized, hydrated } = useRequireRole('BUYER')
  const { user } = useAuthStore()

  const [phone, setPhone] = useState('')
  const [saved, setSaved] = useState(false)

  const { data: profile } = useQuery({
    queryKey: ['buyer-profile'],
    queryFn: getBuyerProfile,
    enabled: authorized,
  })

  useEffect(() => {
    if (profile) {
      setPhone(profile.phone ?? '')
    }
  }, [profile])

  const updateMutation = useMutation({
    mutationFn: () => updateBuyerProfile({ phone }),
    onSuccess: () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  if (!hydrated) return null
  if (!authorized) return <div className="min-h-screen flex items-center justify-center text-gray-400">Redirecting...</div>

  return (
    <div className="min-h-screen bg-brand-cream py-10 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-brand-purple uppercase tracking-wide flex items-center gap-2">
            <User size={28} /> MY ACCOUNT
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage your profile and preferences.</p>
        </div>

        {/* Profile card */}
        <div className="pixel-card overflow-hidden">
          <div className="pixel-section-header px-5 py-2 flex items-center gap-2">
            <User size={14} /> PROFILE DETAILS
          </div>
          <div className="p-5 space-y-4">
            {/* Email (read-only) */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Mail size={12} /> Email Address
              </label>
              <div className="pixel-input px-4 py-2.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed">
                {profile?.email ?? user?.email ?? '—'}
              </div>
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Phone size={12} /> Phone Number
              </label>
              <div className="flex">
                <span className="pixel-border-sm inline-flex items-center px-3 bg-gray-100 text-sm text-gray-600 font-medium">+91</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  maxLength={10}
                  className="pixel-input flex-1 px-4 py-2.5 text-sm"
                  style={{ borderLeft: 'none' }}
                />
              </div>
            </div>

            {updateMutation.isError && (
              <p className="text-red-600 text-sm">{(updateMutation.error as Error)?.message ?? 'Update failed'}</p>
            )}

            <button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
              className="pixel-btn bg-brand-purple text-white font-bold px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-60"
            >
              {saved ? <><Check size={16} /> Saved!</> : updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Password card */}
        <div className="pixel-card overflow-hidden">
          <div className="pixel-section-header px-5 py-2 flex items-center gap-2">
            <Lock size={14} /> CHANGE PASSWORD
          </div>
          <div className="p-5">
            <p className="text-sm text-gray-500">Password change is not yet supported. Contact support if you need to reset your password.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
