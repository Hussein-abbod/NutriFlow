import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button, GlassCard, Icon, PasswordField, StaggeredEntrance, TextField } from '@/components';
import {
  OnboardingStepIndicator,
  ONBOARDING_STEP_COUNT,
  startAfterSignUp,
} from '@/features/onboarding';
import { reportFormError } from '@/lib/forms/reportFormError';
import { useRegister } from '../api/useAuthMutations';
import { AuthHeader } from '../components/AuthHeader';
import { AuthSwitchLink } from '../components/AuthSwitchLink';
import { paths } from '../routing';
import {
  registerSchema,
  type RegisterFormOutput,
  type RegisterFormValues,
} from '../schemas/registerSchema';
import { PASSWORD_RULES_HINT } from '../schemas/fieldRules';
import styles from './AuthScreen.module.css';

const ENTRANCE = { total: 3, controllerMs: 900 } as const;

/** onboarding/step_welcome.dart — "Create Account", step 1 of the onboarding flow. */
export function RegisterPage() {
  // Like Flutter, a successful sign-up moves straight on to "Basic Information".
  const signUp = useRegister({ onRegistered: startAfterSignUp });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues, unknown, RegisterFormOutput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(({ fullName, email, password }) => {
    signUp.mutate(
      { full_name: fullName, email, password },
      {
        onError: (error) =>
          reportFormError(error, setError, {
            full_name: 'fullName',
            email: 'email',
            password: 'password',
          }),
      },
    );
  });

  return (
    <main className={styles.registerScreen}>
      <OnboardingStepIndicator current={0} total={ONBOARDING_STEP_COUNT} />
      <div className={styles.registerBody}>
        <div className={styles.content}>
          <StaggeredEntrance index={0} {...ENTRANCE}>
            <AuthHeader
              badge={
                <div className={styles.ecoBadge}>
                  <Icon name="eco" size={48} />
                </div>
              }
              title="Create Account"
              subtitle="Start your nutrition journey today"
            />
          </StaggeredEntrance>

          <StaggeredEntrance index={1} {...ENTRANCE}>
            <GlassCard
              className={styles.registerCard}
              padding={24}
              blurAmount={16}
              opacity={0.1}
              tone="onGradient"
            >
              <form
                className={styles.registerForm}
                onSubmit={onSubmit}
                noValidate
                aria-label="Create account"
              >
                <TextField
                  variant="glass"
                  label="Full Name"
                  icon="personOutline"
                  autoComplete="name"
                  error={errors.fullName?.message}
                  {...register('fullName')}
                />
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
                  autoComplete="new-password"
                  helperText={PASSWORD_RULES_HINT}
                  error={errors.password?.message}
                  {...register('password')}
                />
                <PasswordField
                  variant="glass"
                  label="Confirm Password"
                  autoComplete="new-password"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
                <Button
                  type="submit"
                  variant="light"
                  fullWidth
                  className={styles.registerSubmit}
                  loading={signUp.isPending}
                  loadingLabel="Creating account"
                >
                  Sign Up
                </Button>
              </form>
            </GlassCard>
          </StaggeredEntrance>

          <StaggeredEntrance index={2} {...ENTRANCE}>
            <div className={`${styles.switchRow} ${styles.registerSwitch}`}>
              <AuthSwitchLink
                prompt="Already have an account?"
                action="Login"
                to={paths.login}
                tone="white"
              />
            </div>
          </StaggeredEntrance>
        </div>
      </div>
    </main>
  );
}
