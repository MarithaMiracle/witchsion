/**
 * Atmospheric drifting orbs - pure CSS, no JS animation loop.
 * Sits behind hero sections.
 */
export function MysticBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div
        className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-ember/10 blur-[120px] animate-drift"
        style={{ animationDelay: "0s" }}
      />
      <div
        className="absolute -right-32 top-2/3 h-[28rem] w-[28rem] rounded-full bg-moss/8 blur-[140px] animate-drift"
        style={{ animationDelay: "-6s" }}
      />
      <div
        className="absolute left-1/3 top-10 h-64 w-64 rounded-full bg-primary/5 blur-[100px] animate-drift"
        style={{ animationDelay: "-12s" }}
      />
    </div>
  );
}
