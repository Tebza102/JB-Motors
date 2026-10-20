// Minimal declaration for the unused Cloudflare D1 starter scaffolding.
// The real module is provided by the Workers runtime; no D1 binding is
// configured for the JB Motors prototype, so only the shape used here is declared.
declare module "cloudflare:workers" {
  export const env: { DB?: unknown };
}
