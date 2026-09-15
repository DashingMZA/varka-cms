/** Known job names — workers register handlers for these */
export const JobNames = {
  sendEmail: 'email.send',
  revalidatePath: 'cache.revalidate',
  generateSitemap: 'seo.sitemap',
  processUpload: 'media.process',
} as const;

export type EmailJobPayload = {
  to: string;
  subject: string;
  text: string;
};
