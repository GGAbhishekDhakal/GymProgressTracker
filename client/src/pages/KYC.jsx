import { useState, useEffect, useRef } from 'react';
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
    kyc_full_name: '', kyc_dob: '', kyc_address: '', kyc_id_type: '', kyc_id_number: '',
  });

  const [docFiles, setDocFiles] = useState({ kyc_id_front: null, kyc_id_back: null, kyc_selfie: null });
  const [docPreviews, setDocPreviews] = useState({ kyc_id_front: null, kyc_id_back: null, kyc_selfie: null });
  const [docUrls, setDocUrls] = useState({ kyc_id_front: null, kyc_id_back: null, kyc_selfie: null });
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => { loadKYC(); }, []);

  async function loadKYC() {
    setLoading(true);
    try {
      const data = await api.request('/profiles/me/kyc');
      setStatus(data.kyc_status);
      setForm({
        kyc_full_name: data.kyc_full_name || '',
        kyc_dob: data.kyc_dob || '',
        kyc_address: data.kyc_address || '',
        kyc_id_type: data.kyc_id_type || '',
        kyc_id_number: data.kyc_id_number || '',
      });
      if (data.kyc_id_front_url) setDocUrls(prev => ({ ...prev, kyc_id_front: data.kyc_id_front_url }));
      if (data.kyc_id_back_url) setDocUrls(prev => ({ ...prev, kyc_id_back: data.kyc_id_back_url }));
      if (data.kyc_selfie_url) setDocUrls(prev => ({ ...prev, kyc_selfie: data.kyc_selfie_url }));
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  function handleDocChange(field, e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('Document must be under 10 MB');
      return;
    }
    setDocFiles(prev => ({ ...prev, [field]: file }));
    setDocPreviews(prev => ({ ...prev, [field]: URL.createObjectURL(file) }));
  }

  async function uploadDocs() {
    const filesToUpload = Object.entries(docFiles).filter(([, f]) => f);
    if (!filesToUpload.length) return;
    setUploadingDoc(true);
    setError('');
    try {
      const results = {};
      for (const [field, file] of filesToUpload) {
        const data = await api.upload('/profiles/me/kyc/documents', file, field);
        results[field] = data.url;
      }
      setDocUrls(prev => ({ ...prev, ...results }));
      setDocFiles({ kyc_id_front: null, kyc_id_back: null, kyc_selfie: null });
      setDocPreviews({ kyc_id_front: null, kyc_id_back: null, kyc_selfie: null });
      setMessage('Documents uploaded!');
    } catch (err) {
      setError(err.message);
    }
    setUploadingDoc(false);
  }

  async function submitKYC(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    const allUploaded = docUrls.kyc_id_front && docUrls.kyc_id_back && docUrls.kyc_selfie;
    if (!allUploaded) {
      setError('Please upload all three documents before submitting');
      return;
    }

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
  const canEdit = status === 'none' || status === 'rejected' || status === 'pending';

  if (isSuperadmin) {
    return (
      <div className="space-y-4 max-w-2xl">
        <h1 className="text-xl font-bold">KYC Verification</h1>
        <div className="card !p-6 text-center space-y-4">
          <div className="text-4xl">🏢</div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Organization Owner</h2>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            As the organization owner, your identity is verified through your organization's business KYC.
          </p>
          <Link to="/org-profile" className="btn-primary inline-block text-sm !py-2 !px-4">
            Go to Org Settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-xl font-bold">KYC Verification</h1>

      <div className={`flex items-center gap-3 p-3 rounded-lg border ${s.bg} ${s.border}`}>
        <div className={`text-sm font-medium ${s.color}`}>Status: {s.label}</div>
        {status === 'verified' && <span className="text-emerald-400">✓</span>}
        {status === 'pending' && (
          <span className="text-xs" style={{ color: 'var(--text-dim)' }}>You can edit and re-submit while pending.</span>
        )}
        {status === 'rejected' && (
          <span className="text-xs" style={{ color: 'var(--text-dim)' }}>Please correct your information and re-submit.</span>
        )}
      </div>

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

      {canEdit && (
        <form onSubmit={submitKYC} className="space-y-4">
          <div className="card !p-4 space-y-4">
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
          </div>

          <div className="card !p-4 space-y-3">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Document Upload</h3>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Upload a photo of the front and back of your ID, plus a selfie. JPG, PNG, or PDF. Max 10 MB each.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { field: 'kyc_id_front', label: 'ID Front' },
                { field: 'kyc_id_back', label: 'ID Back' },
                { field: 'kyc_selfie', label: 'Selfie' },
              ].map(({ field, label }) => (
                <div key={field} className="space-y-2">
                  <div className="text-center p-3 rounded-lg relative"
                    style={{ backgroundColor: 'var(--bg-card-hover)', border: '1px dashed var(--border)' }}>
                    {(docPreviews[field] || docUrls[field]) ? (
                      <img src={docPreviews[field] || docUrls[field]} alt={label}
                        className="w-full h-20 object-cover rounded mb-1" />
                    ) : (
                      <div className="text-2xl mb-1">📄</div>
                    )}
                    <div className="text-[10px]" style={{ color: 'var(--text-dim)' }}>{label}</div>
                    {docUrls[field] && !docFiles[field] && (
                      <div className="text-[10px] text-emerald-400">✓ Uploaded</div>
                    )}
                  </div>
                  <label className="btn-secondary text-[10px] !py-1 !px-2 text-center block cursor-pointer">
                    {docUrls[field] ? 'Replace' : 'Choose File'}
                    <input type="file" accept="image/*,.pdf" onChange={e => handleDocChange(field, e)} className="hidden" />
                  </label>
                </div>
              ))}
            </div>
            {Object.values(docFiles).some(f => f) && (
              <button type="button" onClick={uploadDocs} disabled={uploadingDoc}
                className="btn-primary text-xs !py-1.5 w-full">
                {uploadingDoc ? 'Uploading...' : 'Upload Documents'}
              </button>
            )}
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full !py-2.5">
            {saving ? 'Submitting...' : status === 'pending' ? 'Re-submit for Verification' : 'Submit for Verification'}
          </button>
        </form>
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
