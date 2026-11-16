import { useEffect, useRef, useState } from 'react';
import type { Me } from '../../shared/types';
import { useI18n } from '../i18n/I18nProvider';

interface AccountMenuProps {
  me: Me | null;
  onSignOut: () => void;
  onDeleteAccount: () => void;
  exportUrl: string;
}

function GoogleMark() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="account__google"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.36l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.06v2.62A9.99 9.99 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.41 13.94A6.01 6.01 0 0 1 6.1 12c0-.67.11-1.32.31-1.94V7.44H3.06A9.99 9.99 0 0 0 2 12c0 1.61.39 3.14 1.06 4.56l3.35-2.62Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.94c1.47 0 2.79.5 3.82 1.5l2.87-2.87A9.62 9.62 0 0 0 12 2a9.99 9.99 0 0 0-8.94 5.44l3.35 2.62C7.2 7.7 9.4 5.94 12 5.94Z"
      />
    </svg>
  );
}

export function AccountMenu({
  me,
  onSignOut,
  onDeleteAccount,
  exportUrl,
}: AccountMenuProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnPointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnPointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  if (!me) return null;
  const { profile, auth } = me;

  if (profile.kind === 'guest') {
    if (!auth.googleEnabled) return null;
    return (
      <a className="account account--signin" href={auth.signInUrl} aria-label={t('signInWithGoogle')}>
        <GoogleMark />
        <span>{t('signInWithGoogle')}</span>
      </a>
    );
  }

  const label = profile.name?.trim() || profile.email || t('account');
  const initial = label.charAt(0).toUpperCase() || '?';

  return (
    <div className="account" ref={rootRef}>
      <button
        type="button"
        className="account__trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t('account')}
      >
        {profile.pictureUrl ? (
          <img
            className="account__avatar"
            src={profile.pictureUrl}
            alt=""
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="account__avatar account__avatar--letter">{initial}</span>
        )}
        <span className="account__label">{label}</span>
        <span className={`account__chevron${open ? ' account__chevron--open' : ''}`} aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="account__menu" role="menu">
          <div className="account__head">
            <span className="account__menu-name">{label}</span>
            {profile.email && <span className="account__menu-email">{profile.email}</span>}
          </div>
          <a
            className="account__item"
            role="menuitem"
            href={exportUrl}
            onClick={() => setOpen(false)}
          >
            {t('exportData')}
          </a>
          <button
            type="button"
            className="account__item"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
          >
            {t('signOut')}
          </button>
          <button
            type="button"
            className="account__item account__item--danger"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onDeleteAccount();
            }}
          >
            {t('deleteAccount')}
          </button>
        </div>
      )}
    </div>
  );
}
