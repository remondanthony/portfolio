import { redirect } from 'next/navigation';
import LoginForm from '@/components/admin/LoginForm';
import { adminConfigured, getSession } from '@/lib/admin/session';

export default async function Login() {
  if (await getSession()) redirect('/admin/dashboard');
  return (
    <main className="ad-login">
      <div className="ad-login-card">
        <div className="ad-brand">
          <img src="/logo.png" alt="" width={28} height={28} />
          <span>VIONICHE <b>CMS</b></span>
        </div>
        <h1>Sign in</h1>
        {adminConfigured() ? (
          <LoginForm />
        ) : (
          <p className="ad-note ad-note--warn">
            The admin is not configured on this deployment. Set <code>ADMIN_USER_ID</code>,{' '}
            <code>ADMIN_PASSWORD_HASH</code> and <code>SESSION_SECRET</code> — see docs/cms-setup.md.
          </p>
        )}
      </div>
    </main>
  );
}
