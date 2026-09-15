/** Central cache key namespace for VARKA */
export const CacheKeys = {
  post: (id: string) => `varka:post:${id}`,
  postBySlug: (langId: string, slug: string) => `varka:post:slug:${langId}:${slug}`,
  siteSettings: (siteId: string) => `varka:site:${siteId}:settings`,
  themeActive: (siteId: string) => `varka:site:${siteId}:theme`,
  rateComment: (ip: string) => `varka:rl:comment:${ip}`,
  rateLogin: (ip: string) => `varka:rl:login:${ip}`,
  rateApi: (ip: string, route: string) => `varka:rl:api:${route}:${ip}`,
} as const;
