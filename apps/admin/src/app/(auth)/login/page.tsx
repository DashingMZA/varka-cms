import { LoginForm } from '@/components/login-form';

export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 28,
          boxShadow: '0 8px 30px rgba(28,25,23,0.06)',
        }}
      >
        <h1 style={{ margin: '0 0 4px', fontSize: 22 }}>VARKA</h1>
        <p style={{ margin: '0 0 20px', color: 'var(--muted)', fontSize: 14 }}>
          Sign in to the admin
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
