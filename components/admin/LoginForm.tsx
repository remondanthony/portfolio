'use client';

import { useActionState } from 'react';
import { login } from '@/lib/cms/actions';

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="ad-form">
      <div className="field">
        <label htmlFor="userId">User ID</label>
        <input
          id="userId"
          name="userId"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          autoFocus
          defaultValue={state?.userId}
        />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state?.error && <p className="ad-note ad-note--error" role="alert">{state.error}</p>}
      <button type="submit" className="btn btn-dark" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'} <span className="dot">→</span>
      </button>
    </form>
  );
}
