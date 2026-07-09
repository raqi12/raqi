import { FormEvent, useState } from 'react';

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
    <div className="login-page">
      <div className="login-page__glow login-page__glow--one" />
      <div className="login-page__glow login-page__glow--two" />

      <main className="login-shell">
        <section className="login-brand">
          <div className="login-brand__badge">رقي</div>
          <h1>لوحة تحكم الإدارة</h1>
          <p>
            منصة متكاملة لإدارة العمليات، الاشتراكات، الصناديق، والمدفوعات
            بكفاءة وأمان.
          </p>
          <ul className="login-brand__features">
            <li>متابعة مباشرة للمؤشرات والعمليات</li>
            <li>إدارة العملاء والاشتراكات والمحافظ</li>
            <li>تحكم كامل في الصناديق والمهام</li>
          </ul>
        </section>

        <section className="login-card panel">
          <header className="login-card__header">
            <h2>تسجيل الدخول</h2>
            <p>أدخل بيانات حساب المدير للمتابعة</p>
          </header>

          <form className="login-form" onSubmit={onSubmit}>
            <label className="field">
              <span className="field__label">البريد الإلكتروني</span>
              <input
                type="email"
                dir="ltr"
                autoComplete="email"
                placeholder="admin@raqi.local"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                required
              />
            </label>

            <label className="field">
              <span className="field__label">كلمة المرور</span>
              <div className="field__password">
                <input
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="field__toggle ghost"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? 'إخفاء' : 'إظهار'}
                </button>
              </div>
            </label>

            {error ? (
              <div className="login-alert" role="alert">
                <strong>تعذر تسجيل الدخول</strong>
                <p>{error}</p>
              </div>
            ) : null}

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? 'جاري تسجيل الدخول...' : 'دخول إلى اللوحة'}
            </button>
          </form>

          <footer className="login-card__footer">
            <p className="muted">
              للوصول تحتاج صلاحية <strong>مدير</strong>. إذا ظهر خطأ اتصال، شغّل
              الخادم ثم أعد المحاولة.
            </p>
          </footer>
        </section>
      </main>
    </div>
  );
}
