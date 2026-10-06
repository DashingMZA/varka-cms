'use client';

import { useState } from 'react';

/**
 * Shared form feedback: consistent success/error message display.
 * Use after every form submit to show what happened.
 */
export function FormFeedback({
  error,
  success,
}: {
  error?: string | null;
  success?: string | null;
}) {
  return (
    <>
      {error ? (
        <p role="alert" className="v-alert v-alert--error" style={{ margin: '0 0 12px' }}>
          {error}
        </p>
      ) : null}
      {success ? (
        <p role="status" className="v-alert v-alert--ok" style={{ margin: '0 0 12px' }}>
          {success}
        </p>
      ) : null}
    </>
  );
}

/**
 * Clear messages on new submit — call at the start of onSubmit.
 * Returns { setError, setSuccess } helpers is overkill; just useState directly.
 */
export function useFormFeedback() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const clear = () => {
    setError(null);
    setSuccess(null);
  };
  return { error, success, setError, setSuccess, clear };
}
