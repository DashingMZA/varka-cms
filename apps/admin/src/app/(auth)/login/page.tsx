import { LoginForm } from '@/components/login-form';

export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: '#f0f0f1',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 360,
          background: '#fff',
          border: '1px solid #c3c4c7',
          borderRadius: 4,
          padding: '28px 24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            marginBottom: 20,
            fontWeight: 600,
            fontSize: 20,
            letterSpacing: '0.06em',
            color: '#1d2327',
          }}
        >
          VARKA
        </div>
        <p
          style={{
            margin: '0 0 16px',
            textAlign: 'center',
            color: '#646970',
            fontSize: 13,
          }}
        >
          Log in to the admin dashboard
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
