'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './otp.module.css';

export default function OTPPage() {
  const [digits, setDigits]   = useState(['', '', '', '', '', '']);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const router = useRouter();

  // If already verified, skip to register
  useEffect(() => {
    const token = sessionStorage.getItem('portal_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          router.replace('/register');
        }
      } catch {}
    }
  }, []);

  const handleDigitChange = (idx, val) => {
    // Accept only digits
    const v = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = v;
    setDigits(next);
    setError('');
    if (v && idx < 5) refs[idx + 1].current?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      refs[idx - 1].current?.focus();
    }
    if (e.key === 'Enter') handleSubmit();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      refs[5].current?.focus();
    }
  };

  const handleSubmit = async () => {
    const code = digits.join('');
    if (code.length !== 6) { setError('Enter all 6 digits'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Verification failed'); return; }
      sessionStorage.setItem('portal_token', data.token);
      router.push('/register');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Background glow */}
      <div className={styles.glow} />

      <div className={styles.container}>
        {/* Brand header */}
        <div className={styles.brand}>
          <div className={styles.logoBox}>
            <Image
              src="/images/logo.png"
              alt="Flexfit"
              width={44}
              height={44}
              className={styles.logoImg}
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            />
            <span className={styles.logoFallback}>FF</span>
          </div>
          <span className={styles.brandName}>FLEXFIT</span>
        </div>

        <div className={styles.card}>
          <h1 className={styles.title}>Member Access</h1>
          <p className={styles.subtitle}>
            Enter the 6-digit code provided by the gym to register.
          </p>

          {error && <div className="error-banner">{error}</div>}

          {/* OTP digit inputs */}
          <div className={styles.otpRow} onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={refs[i]}
                className={styles.otpInput}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                autoFocus={i === 0}
              />
            ))}
          </div>

          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading || digits.join('').length !== 6}
            style={{ marginTop: 8 }}
          >
            {loading ? 'Verifying…' : 'Verify Code →'}
          </button>

          <p className={styles.hint}>
            Don't have a code? Ask the gym reception.
          </p>
        </div>
      </div>
    </div>
  );
}
