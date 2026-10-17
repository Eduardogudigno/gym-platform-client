import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import {
  ApiError,
  createMember,
  enrollNewMember,
  listPlans,
  subscribeMember,
  type DeskPayment,
  type NewMemberInput,
} from './api';
import type { Member, Plan, PlanDuration, Subscription } from './types';

type Props = {
  member: Member | null;
  onCancel: () => void;
  onDone: (notice: string, memberId: string) => void;
};

type FieldErrors = Partial<Record<'firstName' | 'lastName' | 'email' | 'password' | 'phone' | 'plan', string>>;

const durationLabel: Record<PlanDuration, string> = {
  monthly: '1 month',
  quarterly: '3 months',
  yearly: '12 months',
};

function money(plan: Plan): string {
  const amount = Number(plan.price);
  if (!Number.isFinite(amount)) return `${plan.price} ${plan.currency}`;
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency: plan.currency }).format(amount);
  } catch {
    return `${plan.price} ${plan.currency}`;
  }
}

function personName(member: Pick<Member, 'firstName' | 'lastName'>): string {
  return `${member.firstName} ${member.lastName}`;
}

function validateIdentity(input: NewMemberInput): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.firstName.trim()) errors.firstName = 'Enter a first name.';
  if (!input.lastName.trim()) errors.lastName = 'Enter a last name.';
  if (!input.email.trim() || !input.email.includes('@')) errors.email = 'Enter a valid email.';
  if (input.password.length < 8 || !/[A-Za-z]/.test(input.password) || !/[0-9]/.test(input.password)) {
    errors.password = 'Use at least 8 characters, with a letter and a number.';
  }
  if (input.phone && input.phone.length > 30) errors.phone = 'Use 30 characters or fewer.';
  return errors;
}

function issuesToFields(error: ApiError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.details) {
    const key = issue.path.split('.').at(-1);
    if (key === 'firstName' || key === 'lastName' || key === 'email' || key === 'password' || key === 'phone') {
      errors[key] = issue.message;
    }
    if (key === 'planId') errors.plan = issue.message;
  }
  return errors;
}

function enrollmentNotice(name: string, plan: Plan, subscription: Subscription): string {
  if (subscription.status === 'active') return `${name} is on ${plan.name}.`;
  return `${name} is pending on ${plan.name} until the desk records payment.`;
}

export function Join({ member, onCancel, onDone }: Props) {
  const creating = member === null;
  const planGroupId = useId();
  const firstField = useRef<HTMLInputElement>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [planId, setPlanId] = useState('');
  const [paid, setPaid] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [planError, setPlanError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Member | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const enrolling = saved ?? member;
  const selectedPlan = plans.find((plan) => plan.id === planId) ?? null;

  useEffect(() => {
    let cancelled = false;
    listPlans()
      .then((page) => {
        if (!cancelled) setPlans(page.rows);
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setPlanError(caught instanceof ApiError ? caught.message : 'Plans could not be loaded.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingPlans(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loadingPlans) firstField.current?.focus();
  }, [loadingPlans, saved]);

  function clearField(name: keyof FieldErrors) {
    setFieldErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function paymentFor(plan: Plan): DeskPayment | undefined {
    if (!paid) return undefined;
    return { method: 'cash', amount: plan.price };
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    const plan = selectedPlan;
    if (enrolling) {
      if (!plan) {
        setFieldErrors({ plan: 'Choose a plan.' });
        return;
      }
      setFieldErrors({});
      setPending(true);
      try {
        const subscription = await subscribeMember(enrolling.id, plan.id, paymentFor(plan));
        onDone(enrollmentNotice(personName(enrolling), plan, subscription), enrolling.id);
      } catch (caught) {
        applyFailure(caught);
      } finally {
        setPending(false);
      }
      return;
    }

    const input: NewMemberInput = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      password,
      ...(phone.trim() ? { phone: phone.trim() } : {}),
    };
    const errors = validateIdentity(input);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setPending(true);
    try {
      if (!plan) {
        setSaved(await createMember(input));
        setPlanId('');
        return;
      }
      const result = await enrollNewMember(plan.id, { ...input, payment: paymentFor(plan) });
      onDone(enrollmentNotice(personName(result.member), plan, result.subscription), result.member.id);
    } catch (caught) {
      applyFailure(caught);
    } finally {
      setPending(false);
    }
  }

  function applyFailure(caught: unknown) {
    if (!(caught instanceof ApiError)) {
      setFormError('The desk could not save this.');
      return;
    }
    const fields = issuesToFields(caught);
    if (Object.keys(fields).length > 0) {
      setFieldErrors(fields);
      return;
    }
    setFormError(caught.message);
  }

  const title = saved ? `${personName(saved)} is on the books` : creating ? 'New member' : personName(member);
  const lede = saved
    ? 'Choose a plan now, or go back to the floor and enroll them later.'
    : creating
      ? 'Write them in. Put them on a plan now, or save them and enroll later.'
      : 'Pick a plan. Cash at the desk starts it today.';

  return (
    <form className="join-form" onSubmit={submit} noValidate>
      <div className="join-identity">
        <h2 className="h2">{title}</h2>
        <p className="lede">{lede}</p>
        {formError ? (
          <p className="alert" role="alert">
            {formError}
          </p>
        ) : null}
        {creating && !saved ? (
          <>
            <div className="field">
              <label htmlFor="member-first-name">First name</label>
              <input
                ref={saved ? undefined : firstField}
                id="member-first-name"
                name="firstName"
                autoComplete="given-name"
                value={firstName}
                aria-invalid={fieldErrors.firstName ? true : undefined}
                aria-describedby={fieldErrors.firstName ? 'member-first-name-error' : undefined}
                onChange={(event) => {
                  setFirstName(event.target.value);
                  clearField('firstName');
                }}
              />
              {fieldErrors.firstName ? (
                <p id="member-first-name-error" className="field-error" role="alert">
                  {fieldErrors.firstName}
                </p>
              ) : null}
            </div>
            <div className="field">
              <label htmlFor="member-last-name">Last name</label>
              <input
                id="member-last-name"
                name="lastName"
                autoComplete="family-name"
                value={lastName}
                aria-invalid={fieldErrors.lastName ? true : undefined}
                aria-describedby={fieldErrors.lastName ? 'member-last-name-error' : undefined}
                onChange={(event) => {
                  setLastName(event.target.value);
                  clearField('lastName');
                }}
              />
              {fieldErrors.lastName ? (
                <p id="member-last-name-error" className="field-error" role="alert">
                  {fieldErrors.lastName}
                </p>
              ) : null}
            </div>
            <div className="field">
              <label htmlFor="member-email">Email</label>
              <input
                id="member-email"
                name="email"
                type="email"
                autoComplete="off"
                value={email}
                aria-invalid={fieldErrors.email ? true : undefined}
                aria-describedby={fieldErrors.email ? 'member-email-error' : undefined}
                onChange={(event) => {
                  setEmail(event.target.value);
                  clearField('email');
                }}
              />
              {fieldErrors.email ? (
                <p id="member-email-error" className="field-error" role="alert">
                  {fieldErrors.email}
                </p>
              ) : null}
            </div>
            <div className="field">
              <label htmlFor="member-password">Temporary password</label>
              <input
                id="member-password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={password}
                aria-invalid={fieldErrors.password ? true : undefined}
                aria-describedby={fieldErrors.password ? 'member-password-hint member-password-error' : 'member-password-hint'}
                onChange={(event) => {
                  setPassword(event.target.value);
                  clearField('password');
                }}
              />
              <p id="member-password-hint" className="hint">
                At least 8 characters, with a letter and a number. This is their login.
              </p>
              {fieldErrors.password ? (
                <p id="member-password-error" className="field-error" role="alert">
                  {fieldErrors.password}
                </p>
              ) : null}
            </div>
            <div className="field">
              <label htmlFor="member-phone">Phone</label>
              <input
                id="member-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                aria-invalid={fieldErrors.phone ? true : undefined}
                aria-describedby={fieldErrors.phone ? 'member-phone-error' : undefined}
                onChange={(event) => {
                  setPhone(event.target.value);
                  clearField('phone');
                }}
              />
              {fieldErrors.phone ? (
                <p id="member-phone-error" className="field-error" role="alert">
                  {fieldErrors.phone}
                </p>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
      <fieldset className="plan-board">
        <legend>Choose a plan</legend>
        {loadingPlans ? <p role="status">Loading plans…</p> : null}
        {planError ? (
          <p className="alert" role="alert">
            {planError}
          </p>
        ) : null}
        {!loadingPlans && plans.length === 0 ? (
          <p className="empty">
            <b>No active plans.</b>
            Save the member and enroll them when a plan is available.
          </p>
        ) : null}
        <div className="plan-list" role="presentation">
          {creating && !saved ? (
            <label className="plan-row">
              <input
                type="radio"
                name={planGroupId}
                value=""
                checked={planId === ''}
                onChange={() => {
                  setPlanId('');
                  clearField('plan');
                }}
              />
              <span>
                <span className="name">No plan yet</span>
                <span className="meta">Save the member and enroll later</span>
              </span>
            </label>
          ) : null}
          {plans.map((plan, index) => (
            <label className="plan-row" key={plan.id}>
              <input
                ref={index === 0 && (!creating || saved) ? firstField : undefined}
                type="radio"
                name={planGroupId}
                value={plan.id}
                checked={planId === plan.id}
                onChange={() => {
                  setPlanId(plan.id);
                  clearField('plan');
                }}
              />
              <span>
                <span className="name">{plan.name}</span>
                <span className="meta">
                  {durationLabel[plan.duration]} · {money(plan)}
                </span>
              </span>
            </label>
          ))}
        </div>
        {fieldErrors.plan ? (
          <p className="field-error" role="alert">
            {fieldErrors.plan}
          </p>
        ) : null}
        {selectedPlan ? (
          <label className="pay-line">
            <input type="checkbox" checked={paid} onChange={(event) => setPaid(event.target.checked)} />
            <span>
              Paid {money(selectedPlan)} in cash
              <span className="meta">Leave this off to keep the plan pending.</span>
            </span>
          </label>
        ) : null}
      </fieldset>
      <div className="join-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Back to the floor
        </button>
        <button className="btn btn--primary" type="submit" disabled={pending || loadingPlans || (Boolean(enrolling) && plans.length === 0)}>
          {pending ? 'Saving…' : submitLabel(Boolean(enrolling), Boolean(selectedPlan))}
        </button>
      </div>
    </form>
  );
}

function submitLabel(enrolling: boolean, hasPlan: boolean): string {
  if (enrolling) return 'Enroll on this plan';
  if (hasPlan) return 'Create and enroll';
  return 'Save member';
}
