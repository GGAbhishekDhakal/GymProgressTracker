import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function OrgProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('profile');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '', description: '', contact_email: '', contact_phone: '',
    address: '', website: '',
  });
  const [kycStatus, setKycStatus] = useState('none');
  const [kycForm, setKycForm] = useState({
    kyc_business_name: '', kyc_registration_number: '', kyc_tax_id: '',
    kyc_business_type: '', kyc_business_address: '', kyc_contact_person: '',
    kyc_contact_email: '', kyc_contact_phone: '',
  });

  useEffect(() => { loadOrg(); }, []);

  async function loadOrg() {
    setLoading(true);
    try {
      const data = await api.request('/org-profile/profile');
      setForm({
        name: data.name || '',
        description: data.description || '',
        contact_email: data.contact_email || '',
        contact_phone: data.contact_phone || '',
        address: data.address || '',
        website: data.website || '',
      });
    } catch (err) {
      setError(err.message);
    }
    try {
      const kyc = await api.request('/org-profile/kyc');
      setKycStatus(kyc.kyc_status || 'none');
      setKycForm({
        kyc_business_name: kyc.kyc_business_name || '',
        kyc_registration_number: kyc.kyc_registration_number || '',
        kyc_tax_id: kyc.kyc_tax_id || '',
        kyc_business_type: kyc.kyc_business_type || '',
        kyc_business_address: kyc.kyc_business_address || '',
        kyc_contact_person: kyc.kyc_contact_person || '',
        kyc_contact_email: kyc.kyc_contact_email || '',
        kyc_contact_phone: kyc.kyc_contact_phone || '',
      });
    } catch {}
    setLoading(false);
  }

  async function saveProfile(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      await api.request('/org-profile/profile', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      setMessage('Organization profile updated!');
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  async function submitKYC(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      const data = await api.request('/org-profile/kyc', {
        method: 'POST',
        body: JSON.stringify(kycForm),
      });
      setMessage(data.message);
      setKycStatus('pending');
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  if (loading) return <LoadingSpinner />;

  const inputClass = 'w-full !py-2 mt-1';
  const labelClass = 'text-xs font-medium';
  const labelStyle = { color: 'var(--text-dim)' };

  const statusConfig = {
    none: { label: 'Not Started', color: 'text-gray-400', bg: 'bg-gray-800/40', border: 'border-gray-700' },
    pending: { label: 'Pending Review', color: 'text-yellow-400', bg: 'bg-yellow-900/30', border: 'border-yellow-800/40' },
    verified: { label: 'Verified', color: 'text-emerald-400', bg: 'bg-emerald-900/30', border: 'border-emerald-800/40' },
    rejected: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-900/30', border: 'border-red-800/40' },
  };
  const s = statusConfig[kycStatus] || statusConfig.none;

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-xl font-bold">Organization Profile</h1>

      {message && (
        <div className="text-sm p-2 rounded bg-emerald-900/30 text-emerald-400 border border-emerald-800/40 text-center">
          {message}
          <button onClick={() => setMessage('')} className="float-right">✕</button>
        </div>
      )}
      {error && (
        <div className="text-sm p-2 rounded bg-red-900/30 text-red-400 border border-red-800/40 text-center">
          {error}
          <button onClick={() => setError('')} className="float-right">✕</button>
        </div>
      )}

      <div className="flex gap-2 border-b pb-2 flex-wrap" style={{ borderColor: 'var(--border)' }}>
        {[
          { key: 'profile', label: 'Organization' },
          { key: 'kyc', label: 'Business KYC' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`text-sm px-3 py-1 rounded-t ${tab === t.key ? 'font-semibold' : ''}`}
            style={tab === t.key ? { color: 'var(--text-secondary)', borderBottom: '2px solid #34d399' } : { color: 'var(--text-dim)' }}>
            {t.label}
            {t.key === 'kyc' && kycStatus !== 'none' && (
              <span className={`ml-1.5 text-[10px] px-1 py-0.5 rounded ${s.bg} ${s.color}`}>{s.label}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <form onSubmit={saveProfile} className="card !p-4 space-y-4">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Organization Details</h2>
          <div>
            <label className={labelClass} style={labelStyle}>Organization Name</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className={inputClass} required />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className={inputClass} rows={3} placeholder="About your organization" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} style={labelStyle}>Contact Email</label>
              <input type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
                className={inputClass} placeholder="info@gym.com" />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Contact Phone</label>
              <input type="tel" value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))}
                className={inputClass} placeholder="+1 234 567 890" />
            </div>
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Address</label>
            <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              className={inputClass} rows={2} placeholder="Full address" />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Website</label>
            <input type="url" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
              className={inputClass} placeholder="https://..." />
          </div>
          <button type="submit" disabled={saving} className="btn-primary text-sm !py-2">Save Organization</button>
        </form>
      )}

      {tab === 'kyc' && (
        <>
          <div className={`flex items-center gap-3 p-3 rounded-lg border ${s.bg} ${s.border}`}>
            <div className={`text-sm font-medium ${s.color}`}>Business Verification: {s.label}</div>
            {kycStatus === 'verified' && <span className="text-emerald-400">✓</span>}
          </div>

          {(kycStatus === 'none' || kycStatus === 'rejected') && (
            <form onSubmit={submitKYC} className="card !p-4 space-y-4">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Business Verification</h2>
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                Verify your organization to unlock all features. Business documents are encrypted and secure.
              </p>

              <div>
                <label className={labelClass} style={labelStyle}>Business Name</label>
                <input type="text" value={kycForm.kyc_business_name} onChange={e => setKycForm(f => ({ ...f, kyc_business_name: e.target.value }))}
                  className={inputClass} required placeholder="Registered business name" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} style={labelStyle}>Registration Number</label>
                  <input type="text" value={kycForm.kyc_registration_number} onChange={e => setKycForm(f => ({ ...f, kyc_registration_number: e.target.value }))}
                    className={inputClass} required placeholder="Company reg. #" />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Tax ID / VAT Number</label>
                  <input type="text" value={kycForm.kyc_tax_id} onChange={e => setKycForm(f => ({ ...f, kyc_tax_id: e.target.value }))}
                    className={inputClass} required placeholder="Tax ID" />
                </div>
              </div>

              <div>
                <label className={labelClass} style={labelStyle}>Business Type</label>
                <select value={kycForm.kyc_business_type} onChange={e => setKycForm(f => ({ ...f, kyc_business_type: e.target.value }))}
                  className={inputClass} required>
                  <option value="">Select</option>
                  <option value="gym">Gym / Fitness Center</option>
                  <option value="studio">Fitness Studio</option>
                  <option value="personal_training">Personal Training</option>
                  <option value="crossfit">CrossFit Box</option>
                  <option value="yoga">Yoga Studio</option>
                  <option value="martial_arts">Martial Arts</option>
                  <option value="sports_club">Sports Club</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className={labelClass} style={labelStyle}>Business Address</label>
                <textarea value={kycForm.kyc_business_address} onChange={e => setKycForm(f => ({ ...f, kyc_business_address: e.target.value }))}
                  className={inputClass} rows={2} placeholder="Registered business address" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} style={labelStyle}>Contact Person</label>
                  <input type="text" value={kycForm.kyc_contact_person} onChange={e => setKycForm(f => ({ ...f, kyc_contact_person: e.target.value }))}
                    className={inputClass} placeholder="Authorized representative" />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Contact Email</label>
                  <input type="email" value={kycForm.kyc_contact_email} onChange={e => setKycForm(f => ({ ...f, kyc_contact_email: e.target.value }))}
                    className={inputClass} placeholder="contact@gym.com" />
                </div>
              </div>

              <div>
                <label className={labelClass} style={labelStyle}>Contact Phone</label>
                <input type="tel" value={kycForm.kyc_contact_phone} onChange={e => setKycForm(f => ({ ...f, kyc_contact_phone: e.target.value }))}
                  className={inputClass} placeholder="+1 234 567 890" />
              </div>

              <div className="card !p-3 border border-dashed" style={{ borderColor: 'var(--border)' }}>
                <h3 className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Business Documents</h3>
                <p className="text-xs mb-3" style={{ color: 'var(--text-dim)' }}>
                  Upload registration certificate and tax documents. Coming soon.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {['Registration Certificate', 'Tax Document'].map(label => (
                    <div key={label} className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-card-hover)', border: '1px dashed var(--border)' }}>
                      <div className="text-lg mb-1">📄</div>
                      <div className="text-[10px]" style={{ color: 'var(--text-dim)' }}>{label}</div>
                      <div className="text-[10px] text-gray-500">Coming soon</div>
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={saving} className="btn-primary w-full !py-2.5">
                {saving ? 'Submitting...' : 'Submit for Verification'}
              </button>
            </form>
          )}

          {kycStatus === 'pending' && (
            <div className="card !p-4 text-center space-y-3">
              <div className="text-3xl">⏳</div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Under Review</h2>
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                Your business KYC is being reviewed. This usually takes 2-3 business days.
              </p>
            </div>
          )}

          {kycStatus === 'verified' && (
            <div className="card !p-4 text-center space-y-3">
              <div className="text-3xl">✅</div>
              <h2 className="text-sm font-semibold text-emerald-400">Business Verified</h2>
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Your organization has been verified.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
