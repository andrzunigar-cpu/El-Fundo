import React from 'react'
import { Toaster } from 'react-hot-toast'
import { POSLayout } from './components/pos/POSLayout'

export default function App() {
  return (
    <>
      <POSLayout />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: '#1f2937', color: '#fff', borderRadius: '12px' },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </>
  )
}
