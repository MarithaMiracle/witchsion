import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/booking-confirm')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/booking-confirm"!</div>
}
