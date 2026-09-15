import { MediaLibrary } from '@/components/media-library';

export default function MediaPage() {
  return (
    <main>
      <h1 style={{ marginTop: 0 }}>Media</h1>
      <p style={{ color: 'var(--muted)' }}>
        Library with local disk adapter (default). Set STORAGE_DRIVER=s3|r2 when AWS client is
        wired.
      </p>
      <MediaLibrary />
    </main>
  );
}
