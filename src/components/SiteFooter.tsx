import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-32 border-t border-border/40 bg-background">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="text-witchy text-3xl tracking-wider">witchsion</div>
            <p className="font-serif mt-4 max-w-sm text-sm italic text-muted-foreground">
              A witch on a mission. Spiritual, cultural and entertainment offerings —
              never the washed-out version.
            </p>
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Explore
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link to="/shop" className="hover:text-foreground text-muted-foreground">Shop</Link></li>
              <li><Link to="/book" className="hover:text-foreground text-muted-foreground">Consultations</Link></li>
              <li><Link to="/about" className="hover:text-foreground text-muted-foreground">About</Link></li>
              <li><Link to="/how-to-order" className="hover:text-foreground text-muted-foreground">How To Order</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Care
            </div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>Worldwide: DHL</li>
              <li>Nigeria: GIG</li>
              <li>Hand-prepared on order</li>
            </ul>
          </div>
        </div>

        <div className="ornate-divider mt-16 text-[10px] uppercase tracking-[0.3em]">
          <span>made with intention</span>
        </div>

        <div className="mt-8 flex flex-col gap-3 text-[11px] text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Witchsion. All rights reserved.</p>
          <p className="max-w-xl text-pretty">
            Offerings are presented as spiritual, cultural and entertainment
            services. No specific supernatural outcome is guaranteed. You must be
            18+ to purchase.
          </p>
        </div>
      </div>
    </footer>
  );
}
