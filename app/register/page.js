'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './register.module.css';

const MAX_PHOTO_MB = 3;

function Toast({ message, type }) {
  if (!message) return null;
  const bg = type === 'success' ? '#2ed573' : '#ff4757';
  const color = type === 'success' ? '#0a0a0f' : '#fff';
  return (
    <div style={{
      position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
      background: bg, color, padding: '14px 24px', borderRadius: 10,
      fontWeight: 600, fontSize: 15, zIndex: 9999,
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      whiteSpace: 'nowrap', maxWidth: '90vw', textAlign: 'center',
    }}>
      {message}
    </div>
  );
}

// Inline field error
function FieldErr({ msg }) {
  if (!msg) return null;
  return <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 5, marginBottom: 0 }}>{msg}</p>;
}

export default function RegisterPage() {
  const router = useRouter();
  const [token, setToken]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [toast, setToast]               = useState({ message: '', type: '' });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile]       = useState(null);
  const [errors, setErrors]             = useState({});
  const fileRef = useRef();

  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    address: '', dateOfBirth: '', gender: '', notes: '',
  });

  useEffect(() => {
    const t = sessionStorage.getItem('portal_token');
    if (!t) { router.replace('/otp'); return; }
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) {
        sessionStorage.removeItem('portal_token');
        router.replace('/otp');
        return;
      }
      setToken(t);
    } catch {
      router.replace('/otp');
    }
  }, []);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    // Clear error for this field on change
    setErrors((prev) => ({ ...prev, [k]: '' }));
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    setErrors((prev) => ({ ...prev, photo: '' }));
    if (!file) return;
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photo: `Photo must be under ${MAX_PHOTO_MB} MB` }));
      return;
    }
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setErrors((prev) => ({ ...prev, photo: 'Only JPEG, PNG or WebP images allowed' }));
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const errs = {};
    if (!photoFile)
      errs.photo = 'A photo is required';
    if (!form.name.trim())
      errs.name = 'Full name is required';
    if (!form.email.trim() && !form.phone.trim())
      errs.contact = 'Either email or phone number is required';
    if (!form.dateOfBirth)
      errs.dateOfBirth = 'Date of birth is required';
    if (!form.gender)
      errs.gender = 'Gender is required';
    if (!form.address.trim())
      errs.address = 'Address is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Scroll to top of form so user sees errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (photoFile) fd.append('photo', photoFile);

      const res = await fetch('/api/submit-member', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          sessionStorage.removeItem('portal_token');
          router.replace('/otp');
          return;
        }
        setErrors({ form: data.message || 'Submission failed' });
        return;
      }

      sessionStorage.removeItem('portal_token');
      setToast({ message: '✓ Registration submitted successfully!', type: 'success' });
      setTimeout(() => router.replace('/otp'), 2500);

    } catch {
      setErrors({ form: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  return (
    <div className={styles.page}>
      <Toast message={toast.message} type={toast.type} />
      <div className={styles.glow} />
      <div className={styles.container}>

        <div className={styles.brand}>
          <div className={styles.logoBox}>
            <Image src="/images/logo.png" alt="Flexfit" width={44} height={44} className={styles.logoImg} />
            <span className={styles.logoFallback}>FF</span>
          </div>
          <span className={styles.brandName}>FLEXFIT</span>
        </div>

        <div className={styles.card}>
          <h1 className={styles.title}>Member Registration</h1>
          <p className={styles.subtitle}>Fill in your details to join Flexfit.</p>

          {errors.form && <div className="error-banner">{errors.form}</div>}

          <form onSubmit={handleSubmit} noValidate>

            {/* Photo */}
            <div className={styles.photoSection}>
              <div
                className={`${styles.photoTarget} ${errors.photo ? styles.photoTargetError : ''}`}
                onClick={() => fileRef.current?.click()}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className={styles.photoPreview} />
                ) : (
                  <div className={styles.photoPlaceholder}>
                    <span className={styles.photoIcon}>+</span>
                    <span className={styles.photoLabel}>Add Photo *</span>
                    <span className={styles.photoHint}>Max {MAX_PHOTO_MB} MB · JPG / PNG</span>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handlePhoto}
              />
              <FieldErr msg={errors.photo} />
              {photoPreview && (
                <button
                  type="button"
                  className={styles.removePhoto}
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview(null);
                    fileRef.current.value = '';
                    setErrors((prev) => ({ ...prev, photo: '' }));
                  }}
                >
                  Remove photo
                </button>
              )}
            </div>

            {/* Full Name */}
            <div className="form-group">
              <label className="label">Full Name *</label>
              <input
                className={`input-field ${errors.name ? 'input-error' : ''}`}
                value={form.name}
                onChange={set('name')}
                placeholder="Your full name"
              />
              <FieldErr msg={errors.name} />
            </div>

            {/* Phone + Email — one of these required */}
            <div className={styles.contactRow}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="label">Phone *</label>
                <input
                  className={`input-field ${errors.contact ? 'input-error' : ''}`}
                  type="tel"
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              <div className={styles.orDivider}>
                <span>OR</span>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="label">Email *</label>
                <input
                  className={`input-field ${errors.contact ? 'input-error' : ''}`}
                  type="email"
                  value={form.email}
                  onChange={(e) => {
                    set('email')(e);
                    setErrors((prev) => ({ ...prev, contact: '' }));
                  }}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* DOB + Gender */}
            <div className={styles.row}>
              <div className="form-group">
                <label className="label">Date of Birth *</label>
                <input
                  className={`input-field ${errors.dateOfBirth ? 'input-error' : ''}`}
                  type="date"
                  value={form.dateOfBirth}
                  onChange={set('dateOfBirth')}
                />
                <FieldErr msg={errors.dateOfBirth} />
              </div>
              <div className="form-group">
                <label className="label">Gender *</label>
                <select
                  className={`input-field ${errors.gender ? 'input-error' : ''}`}
                  value={form.gender}
                  onChange={set('gender')}
                >
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
                <FieldErr msg={errors.gender} />
              </div>
            </div>

            {/* Address */}
            <div className="form-group">
              <label className="label">Address *</label>
              <input
                className={`input-field ${errors.address ? 'input-error' : ''}`}
                value={form.address}
                onChange={set('address')}
                placeholder="Your address"
              />
              <FieldErr msg={errors.address} />
            </div>

            {/* Notes — optional */}
            <div className="form-group">
              <label className="label">Additional Notes <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(optional)</span></label>
              <textarea
                className="input-field"
                value={form.notes}
                onChange={set('notes')}
                placeholder="Any health conditions, preferences, etc."
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting…' : 'Submit Registration →'}
            </button>
          </form>

          <p className={styles.sessionNote}>
            Session active · <button className={styles.logoutBtn} onClick={() => {
              sessionStorage.removeItem('portal_token');
              router.replace('/otp');
            }}>Change code</button>
          </p>
        </div>
      </div>
    </div>
  );
}