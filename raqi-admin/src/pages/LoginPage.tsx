import { FormEvent, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

type LoginPageProps = {
  email: string;
  password: string;
  loading: boolean;
  error: string | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function LoginPage({
  email,
  password,
  loading,
  error,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="auth-layout">
      <main className="auth-shell">
        <section className="auth-intro">
          <div className="auth-intro__mark">رقي</div>
          <h1>منصة إدارة العمليات</h1>
          <p>
            لوحة تحكم عربية لإدارة العملاء والاشتراكات والمهام والمدفوعات بكفاءة
            واحترافية.
          </p>
        </section>

        <section className="auth-card">
          <header className="auth-card__header">
            <h2>تسجيل الدخول</h2>
            <p>استخدم حساب المدير للوصول إلى لوحة التحكم</p>
          </header>

          <form className="auth-form" onSubmit={onSubmit}>
            <Input
              label="البريد الإلكتروني"
              type="email"
              dir="ltr"
              autoComplete="email"
              placeholder="admin@raqi.local"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              required
            />

            <label className="field">
              <span className="field__label">كلمة المرور</span>
              <div className="field__inline">
                <input
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? 'إخفاء' : 'إظهار'}
                </Button>
              </div>
            </label>

            {error ? (
              <div className="alert alert--danger" role="alert">
                <strong>تعذر تسجيل الدخول</strong>
                <p>{error}</p>
              </div>
            ) : null}

            <Button type="submit" className="auth-form__submit" disabled={loading}>
              {loading ? 'جاري تسجيل الدخول...' : 'دخول'}
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
}
