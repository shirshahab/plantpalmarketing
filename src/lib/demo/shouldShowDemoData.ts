/** Demo/mock data only when explicitly enabled outside production. */
export function shouldShowDemoData(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_SHOW_DEMO_DATA === "true"
  );
}

export function isProductionLiveMode(): boolean {
  return !shouldShowDemoData();
}
