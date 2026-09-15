import { z } from 'zod';

export const themeManifestSchema = z.object({
  id: z.string().regex(/^theme-\d{2}$/),
  name: z.string().min(1),
  version: z.string().default('1.0.0'),
  description: z.string().optional(),
  supports: z.object({
    rtl: z.boolean().default(false),
    darkMode: z.boolean().default(false),
  }),
  tokens: z.object({
    bg: z.string(),
    ink: z.string(),
    accent: z.string(),
    muted: z.string(),
    card: z.string(),
    border: z.string(),
    fontSerif: z.string().optional(),
    fontSans: z.string().optional(),
  }),
  templates: z.array(
    z.enum(['home', 'post', 'page', 'category', 'tag', 'author', 'search', '404']),
  ),
});

export type ThemeManifest = z.infer<typeof themeManifestSchema>;

export type ThemeModule = {
  manifest: ThemeManifest;
  /** CSS variables / stylesheet body for public site */
  css: string;
};
