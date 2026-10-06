'use client';

import { useState } from 'react';

/** Inline SVG eye icons (no extra dependency). */
function EyeIcon({ off }: { off?: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {off ? (
        <>
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <path d="M2 2l20 20" />
        </>
      ) : (
        <>
          <path d="M2 12s3.5-7 11-7 11 7 11 7-3.5 7-11 7-11-7-11-7z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
};

/** Password input with show/hide eye toggle. Matches .v-form input styling. */
export function PasswordInput({ id, style, ...rest }: Props) {
  const [show, setShow] = useState(false);
  return (
    <div className="v-password-wrap" style={{ position: 'relative', width: '100%', maxWidth: '25rem' }}>
      <input
        id={id}
        type={show ? 'text' : 'password'}
        {...rest}
        style={{
          width: '100%',
          minHeight: 40,
          padding: '8px 40px 8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: 8,
          fontSize: 14,
          color: '#111827',
          background: '#fff',
          outline: 'none',
          boxSizing: 'border-box',
          ...style,
        }}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? 'Hide password' : 'Show password'}
        title={show ? 'Hide password' : 'Show password'}
        tabIndex={-1}
        style={{
          position: 'absolute',
          right: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#6b7280',
          padding: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <EyeIcon off={show} />
      </button>
    </div>
  );
}
