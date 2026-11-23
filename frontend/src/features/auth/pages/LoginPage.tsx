import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button, GlassCard, PasswordField, StaggeredEntrance, TextField } from '@/components';
import { reportFormError } from '@/lib/forms/reportFormError';
import { useLogin } from '../api/useAuthMutations';
import { AuthHeader } from '../components/AuthHeader';
import { AuthSwitchLink } from '../components/AuthSwitchLink';
import { LogoBadge } from '../components/LogoBadge';
import { paths } from '../routing';
import { loginSchema, type LoginFormOutput, type LoginFormValues } from '../schemas/loginSchema';
import styles from './AuthScreen.module.css';

const ENTRANCE = { total: 3, controllerMs: 1000 } as const;

/** login_screen.dart. On success the route guard sends the user to onboarding or home. */
export function LoginPage() {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues, unknown, LoginFormOutput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit((values) =>
    login.mutate(values, {
      onError: (error) =>
        reportFormError(error, setError, { email: 'email', password: 'password' }),
    }),
  );

  return (
    <main className={styles.loginScreen}>
      <div className={styles.content}>
        <StaggeredEntrance index={0} {...ENTRANCE}>
          <AuthHeader
            badge={<LogoBadge variant="login" />}
            title="Welcome Back"
            subtitle="Sign in to continue your journey"
          />
        </StaggeredEntrance>

        <StaggeredEntrance index={1} {...ENTRANCE}>
          <GlassCard className={styles.loginCard} padding={28} blurAmount={20} tone="onGradient">
            <form className={styles.loginForm} onSubmit={onSubmit} noValidate aria-label="Login">
              <TextField
                variant="glass"
                label="Email"
                icon="emailOutlined"
                type="email"
                inputMode="email"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email')}
              />
              <PasswordField
                variant="glass"
                label="Password"
                autoComplete="current-password"
                error={errors.password?.message}
                {...register('password')}
              />
              <Button
                type="submit"
                variant="gradient"
                fullWidth
                className={styles.loginSubmit}
                loading={login.isPending}
                loadingLabel="Logging in"
              >
                Login
              </Button>
            </form>
          </GlassCard>
        </StaggeredEntrance>

        <StaggeredEntrance index={2} {...ENTRANCE}>
          <div className={`${styles.switchRow} ${styles.loginSwitch}`}>
            <AuthSwitchLink
              prompt="Don't have an account?"
              action="Sign Up"
              to={paths.register}
              tone="accent"
            />
          </div>
        </StaggeredEntrance>
      </div>
    </main>
  );
}
