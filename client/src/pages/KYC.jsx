import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function KYC() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState(null);

  const isSuperadmin = user?.role === 'superadmin';

  const [form, setForm] = useState({
    kyc_full_name: '',
    kyc_dob: '',
    kyc_address: '',
    kyc_id_type: '',
    kyc_id_number: '',
  });

  useEffect(() => { loadKYC(); }, []);

  async function loadKYC() {
    setLoading(true);
    try {
      const data = await api.request('/profiles/me/kyc');
      setStatus(data.kyc_status);
      if (data.kyc_full_name) {
        setForm({
          kyc_full_name: data.kyc_full_name || '',
          kyc_dob: data.kyc_dob || '',
          kyc_address: data.kyc_address || '',
          kyc_id_type: data.kyc_id_type || '',
          kyc_id_number: data.kyc_id_number || '',
        });
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  async function submitKYC(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      const data = await api.request('/profiles/me/kyc', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setMessage(data.message);
      setStatus('pending');
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

  const s = statusConfig[status] || statusConfig.none;

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-xl font-bold">KYC Verification</h1>

      <div className={`flex items-center gap-3 p-3 rounded-lg border ${s.bg} ${s.border}`}>
        <div className={`text-sm font-medium ${s.color}`}>Status: {s.label}</div>
        {status === 'verified' && <span className="text-emerald-400">✓</span>}
      </div>

      {isSuperadmin && (
        <div className="card !p-3 border" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            This is your <strong>personal</strong> KYC. For your organization's business verification, go to{' '}
            <Link to="/org-profile" className="text-emerald-400 hover:text-emerald-300 underline">Org Profile → Business KYC</Link>.
          </p>
        </div>
      )}

      {message && (
        <div className="text-sm p-2 rounded bg-emerald-900/30 text-emerald-400 border border-emerald-800/40 text-center">
          {message}
        </div>
      )}
      {error && (
        <div className="text-sm p-2 rounded bg-red-900/30 text-red-400 border border-red-800/40 text-center">
          {error}
        </div>
      )}

      {(status === 'none' || status === 'rejected') && (
        <form onSubmit={submitKYC} className="card !p-4 space-y-4">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Identity Verification</h2>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            Verify your identity to unlock all features. Your information is encrypted and secure.
          </p>

          <div>
            <label className={labelClass} style={labelStyle}>Full Legal Name</label>
            <input type="text" value={form.kyc_full_name} onChange={e => setForm(f => ({ ...f, kyc_full_name: e.target.value }))}
              className={inputClass} required placeholder="As shown on your ID" />
          </div>

          <div>
            <label className={labelClass} style={labelStyle}>Date of Birth</label>
            <input type="date" value={form.kyc_dob} onChange={e => setForm(f => ({ ...f, kyc_dob: e.target.value }))}
              className={inputClass} required />
          </div>

          <div>
            <label className={labelClass} style={labelStyle}>Address</label>
            <textarea value={form.kyc_address} onChange={e => setForm(f => ({ ...f, kyc_address: e.target.value }))}
              className={inputClass} required rows={2} placeholder="Full residential address" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} style={labelStyle}>ID Type</label>
              <select value={form.kyc_id_type} onChange={e => setForm(f => ({ ...f, kyc_id_type: e.target.value }))}
                className={inputClass} required>
                <option value="">Select</option>
                <option value="passport">Passport</option>
                <option value="drivers_license">Driver's License</option>
                <option value="national_id">National ID</option>
              </select>
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>ID Number</label>
              <input type="text" value={form.kyc_id_number} onChange={e => setForm(f => ({ ...f, kyc_id_number: e.target.value }))}
                className={inputClass} required placeholder="ID number" />
            </div>
          </div>

          <div className="card !p-3 border border-dashed" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Document Upload</h3>
            <p className="text-xs mb-3" style={{ color: 'var(--text-dim)' }}>
              Document upload coming soon. After submission, you can upload your ID documents via a secure link.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {['ID Front', 'ID Back', 'Selfie'].map(label => (
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

      {status === 'pending' && (
        <div className="card !p-4 text-center space-y-3">
          <div className="text-3xl">⏳</div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Under Review</h2>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            Your KYC submission is being reviewed. This usually takes 1-2 business days.
          </p>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Submitted: {new Date(status === 'pending' ? Date.now() : '').toLocaleDateString()}</p>
        </div>
      )}

      {status === 'verified' && (
        <div className="card !p-4 text-center space-y-3">
          <div className="text-3xl">✅</div>
          <h2 className="text-sm font-semibold text-emerald-400">Verified</h2>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Your identity has been verified.</p>
        </div>
      )}
    </div>
  );
}
