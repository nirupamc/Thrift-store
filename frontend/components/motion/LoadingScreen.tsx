'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function LoadingScreen() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 800)
    return () => clearTimeout(t)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-brand-cream"
          style={{ pointerEvents: 'none' }}
        >
          <p className="font-heading text-4xl font-bold text-brand-purple uppercase mb-6 tracking-widest">
            ThriftBazaar
          </p>
          <div className="w-48 h-2 overflow-hidden" style={{ border: '2px solid #2C2A28' }}>
            <motion.div
              className="h-full bg-forest"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.7, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
