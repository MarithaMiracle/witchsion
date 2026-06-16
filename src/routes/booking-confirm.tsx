import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useApiFn } from "@/lib/api/create-api-fn";
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { confirmBookingPayment } from '@/lib/bookings.functions'

export const Route = createFileRoute('/booking-confirm')({
  component: RouteComponent,
})

function RouteComponent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'missing'>('loading')
  const confirmFn = useApiFn(confirmBookingPayment)
  const appUrl = (import.meta as any).env?.VITE_APP_URL as string | undefined;
  const suggestedApp = appUrl || "http://localhost:5173";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const reference = params.get('reference') || params.get('trxref')
    if (!reference) {
      setStatus('missing')
      return
    }

    (async () => {
      try {
        await confirmFn({ data: { reference } })
        setStatus('success')
      } catch (err) {
        console.error('Booking confirmation failed', err)
        setStatus('error')
      }
    })()
  }, [confirmFn])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 sm:px-6 py-24 text-center">
        {status === 'loading' && <p className="text-lg">Confirming your booking…</p>}
        {status === 'missing' && (
          <div>
            <h1 className="text-witchy text-4xl">Invalid confirmation link</h1>
            <p className="mt-4 text-muted-foreground">No payment reference was provided.</p>
            <Link to="/book" className="mt-6 inline-block underline">Back to booking</Link>
          </div>
        )}
        {status === 'success' && (
          <div>
            <h1 className="text-witchy text-4xl">Booking confirmed</h1>
            <p className="mt-4 text-muted-foreground">Thank you - your booking is confirmed.</p>
            <div className="mt-6">
              <Link to="/_authenticated/account" className="inline-block underline mr-4">View your bookings</Link>
              {suggestedApp && suggestedApp !== window.location.origin && (
                <a href={`${suggestedApp}/_authenticated/account`} className="inline-block underline">Open account on app</a>
              )}
            </div>
          </div>
        )}
        {status === 'error' && (
          <div>
            <h1 className="text-witchy text-4xl">Confirmation failed</h1>
            <p className="mt-4 text-muted-foreground">We couldn't verify your payment. Please contact support.</p>
            <Link to="/book" className="mt-6 inline-block underline">Try booking again</Link>
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  )
}
