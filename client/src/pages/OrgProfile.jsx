import { useState, useEffect, useRef } from 'react';
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

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef(null);

  const [kycFiles, setKycFiles] = useState({ kyc_reg_doc: null, kyc_tax_doc: null });
  const [kycFilePreviews, setKycFilePreviews] = useState({ kyc_reg_doc: null, kyc_tax_doc: null });
  const [kycDocUrls, setKycDocUrls] = useState({ kyc_reg_doc: null, kyc_tax_doc: null });
  const [uploadingKyc, setUploadingKyc] = useState(false);

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
      if (data.logo_url) setLogoUrl(data.logo_url);
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
      if (kyc.kyc_reg_doc_url) setKycDocUrls(prev => ({ ...prev, kyc_reg_doc: kyc.kyc_reg_doc_url }));
      if (kyc.kyc_tax_doc_url) setKycDocUrls(prev => ({ ...prev, kyc_tax_doc: kyc.kyc_tax_doc_url }));
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

  async function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Logo must be under 5 MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('File must be an image');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function uploadLogo() {
    if (!logoFile) return;
    setUploadingLogo(true);
    setError('');
    try {
      const ext = logoFile.name.split('.').pop();
      const path = `${user.org_id}/logo.${ext}`;
      const data = await api.upload('/org-profile/logo', logoFile, path);
      setLogoUrl(data.url);
      setLogoFile(null);
      setLogoPreview(null);
      setMessage('Logo uploaded!');
    } catch (err) {
      setError(err.message);
    }
    setUploadingLogo(false);
  }

  function handleKycFileChange(field, e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('Document must be under 10 MB');
      return;
    }
    setKycFiles(prev => ({ ...prev, [field]: file }));
    setKycFilePreviews(prev => ({ ...prev, [field]: URL.createObjectURL(file) }));
  }

  async function uploadKycDocs() {
    const filesToUpload = Object.entries(kycFiles).filter(([, f]) => f);
    if (!filesToUpload.length) return;
    setUploadingKyc(true);
    setError('');
    try {
      const results = {};
      for (const [field, file] of filesToUpload) {
        const ext = file.name.split('.').pop();
        const path = `${user.org_id}/kyc/${field}.${ext}`;
        const data = await api.upload('/org-profile/kyc/document', file, path);
        results[field] = data.url;
      }
      setKycDocUrls(prev => ({ ...prev, ...results }));
      setKycFiles({ kyc_reg_doc: null, kyc_tax_doc: null });
      setKycFilePreviews({ kyc_reg_doc: null, kyc_tax_doc: null });
      setMessage('Documents uploaded!');
    } catch (err) {
      setError(err.message);
    }
    setUploadingKyc(false);
  }

  async function submitKYC(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      const payload = {
        ...kycForm,
        kyc_reg_doc_url: kycDocUrls.kyc_reg_doc || null,
        kyc_tax_doc_url: kycDocUrls.kyc_tax_doc || null,
      };
      const data = await api.request('/org-profile/kyc', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setMessage(data.message);
      setKycStatus('pending');
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  async function approveKYC() {
    setError('');
    setMessage('');
    setSaving(true);
    try {
      const data = await api.request('/org-profile/kyc/approve', { method: 'PUT' });
      setMessage(data.message);
      setKycStatus('verified');
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
    <div className="space-y-4">
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
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 space-y-4">
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

            <div className="card !p-4 space-y-3">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Organization Logo</h2>
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>PNG or JPG, max 5 MB. Recommended 512×512px.</p>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'var(--bg-card-hover)', border: '1px dashed var(--border)' }}>
                  {(logoPreview || logoUrl) ? (
                    <img src={logoPreview || logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">🏢</span>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                  <button type="button" onClick={() => logoInputRef.current?.click()}
                    className="text-xs px-3 py-1.5 rounded" style={{ backgroundColor: 'var(--bg-card-hover)', color: 'var(--text-secondary)' }}>
                    {logoUrl ? 'Change Logo' : 'Choose Logo'}
                  </button>
                  {logoFile && (
                    <button type="button" onClick={uploadLogo} disabled={uploadingLogo}
                      className="btn-primary text-xs !py-1.5 !px-3">
                      {uploadingLogo ? 'Uploading...' : 'Upload'}
                    </button>
                  )}
                  {logoUrl && !logoFile && (
                    <span className="text-[10px] text-emerald-400">✓ Uploaded</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="card !p-4 sticky top-4">
              <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Preview</h2>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center text-2xl font-bold shrink-0"
                  style={{ backgroundColor: 'var(--bg-card-hover)', color: 'var(--text-secondary)' }}>
                  {(logoPreview || logoUrl) ? (
                    <img src={logoPreview || logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    form.name?.charAt(0)?.toUpperCase() || '🏢'
                  )}
                </div>
                <div>
                  <div className="font-medium text-sm">{form.name || 'Organization Name'}</div>
                  <div className="text-xs" style={{ color: 'var(--text-dim)' }}>{form.contact_email || 'No email'}</div>
                </div>
              </div>
              <div className="space-y-2 text-xs" style={{ color: 'var(--text-dim)' }}>
                {form.description && (
                  <div className="p-2 rounded" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
                    <div className="whitespace-pre-wrap line-clamp-3">{form.description}</div>
                  </div>
                )}
                {form.contact_phone && <div className="flex justify-between"><span>Phone</span><span>{form.contact_phone}</span></div>}
                {form.address && <div className="flex justify-between"><span>Address</span><span className="text-right max-w-[60%] truncate">{form.address}</span></div>}
                {form.website && <div className="flex justify-between"><span>Website</span><a href={form.website} target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline truncate max-w-[60%]">{form.website}</a></div>}
                {kycStatus !== 'none' && (
                  <div className="flex justify-between items-center mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                    <span>KYC</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${s.bg} ${s.color}`}>{s.label}</span>
                  </div>
                )}
                {kycForm.kyc_business_name && (
                  <div className="mt-2 pt-2 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="font-medium" style={{ color: 'var(--text-secondary)' }}>Business Info</div>
                    <div className="flex justify-between"><span>Business</span><span>{kycForm.kyc_business_name}</span></div>
                    {kycForm.kyc_registration_number && <div className="flex justify-between"><span>Reg #</span><span>{kycForm.kyc_registration_number}</span></div>}
                    {kycForm.kyc_business_type && <div className="flex justify-between"><span>Type</span><span className="capitalize">{kycForm.kyc_business_type.replace(/_/g, ' ')}</span></div>}
                  </div>
                )}
                {!form.name && !form.description && !form.contact_email && !kycForm.kyc_business_name && (
                  <p className="text-center py-4" style={{ color: 'var(--text-faint)' }}>Fill in details to see preview</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'kyc' && (
        <>
          <div className={`flex items-center gap-3 p-3 rounded-lg border ${s.bg} ${s.border}`}>
            <div className={`text-sm font-medium ${s.color}`}>Business Verification: {s.label}</div>
            {kycStatus === 'verified' && <span className="text-emerald-400">✓</span>}
          </div>

          {(kycStatus === 'none' || kycStatus === 'rejected' || kycStatus === 'pending') && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <form onSubmit={submitKYC} className="lg:col-span-3 card !p-4 space-y-4">
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
                    Upload registration certificate and tax documents. Max 10 MB each.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { field: 'kyc_reg_doc', label: 'Registration Certificate' },
                      { field: 'kyc_tax_doc', label: 'Tax Document' },
                    ].map(({ field, label }) => (
                      <div key={field} className="space-y-2">
                        <div className="text-center p-3 rounded-lg relative"
                          style={{ backgroundColor: 'var(--bg-card-hover)', border: '1px dashed var(--border)' }}>
                          {(kycDocUrls[field] || kycFilePreviews[field]) ? (
                            <img src={kycFilePreviews[field] || kycDocUrls[field]} alt={label}
                              className="w-full h-16 object-cover rounded mb-1" />
                          ) : (
                            <div className="text-lg mb-1">📄</div>
                          )}
                          <div className="text-[10px]" style={{ color: 'var(--text-dim)' }}>{label}</div>
                          {kycDocUrls[field] && !kycFiles[field] && (
                            <div className="text-[10px] text-emerald-400">✓ Uploaded</div>
                          )}
                        </div>
                        <label className="btn-secondary text-[10px] !py-1 !px-2 text-center block cursor-pointer">
                          {kycDocUrls[field] ? 'Replace' : 'Choose File'}
                          <input type="file" accept="image/*,.pdf" onChange={e => handleKycFileChange(field, e)} className="hidden" />
                        </label>
                      </div>
                    ))}
                  </div>
                  {Object.values(kycFiles).some(f => f) && (
                    <button type="button" onClick={uploadKycDocs} disabled={uploadingKyc}
                      className="btn-primary text-xs !py-1.5 w-full mt-2">
                      {uploadingKyc ? 'Uploading...' : 'Upload Documents'}
                    </button>
                  )}
                </div>

                <button type="submit" disabled={saving} className="btn-primary w-full !py-2.5">
                  {saving ? 'Submitting...' : 'Submit for Verification'}
                </button>
              </form>

              <div className="lg:col-span-2">
                <div className="card !p-4 sticky top-4">
                  <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Verification Preview</h2>
                  <div className="space-y-2 text-xs" style={{ color: 'var(--text-dim)' }}>
                    {kycForm.kyc_business_name && <div className="flex justify-between"><span>Business</span><span>{kycForm.kyc_business_name}</span></div>}
                    {kycForm.kyc_registration_number && <div className="flex justify-between"><span>Reg #</span><span>{kycForm.kyc_registration_number}</span></div>}
                    {kycForm.kyc_tax_id && <div className="flex justify-between"><span>Tax ID</span><span>{kycForm.kyc_tax_id}</span></div>}
                    {kycForm.kyc_business_type && <div className="flex justify-between"><span>Type</span><span className="capitalize">{kycForm.kyc_business_type.replace(/_/g, ' ')}</span></div>}
                    {kycForm.kyc_business_address && (
                      <div className="p-2 rounded" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
                        <div className="font-medium mb-1">Address</div>
                        <div className="whitespace-pre-wrap">{kycForm.kyc_business_address}</div>
                      </div>
                    )}
                    {kycForm.kyc_contact_person && <div className="flex justify-between"><span>Contact</span><span>{kycForm.kyc_contact_person}</span></div>}
                    {kycForm.kyc_contact_email && <div className="flex justify-between"><span>Email</span><span>{kycForm.kyc_contact_email}</span></div>}
                    {kycForm.kyc_contact_phone && <div className="flex justify-between"><span>Phone</span><span>{kycForm.kyc_contact_phone}</span></div>}
                    {(kycDocUrls.kyc_reg_doc || kycDocUrls.kyc_tax_doc) && (
                      <div className="mt-2 p-2 rounded" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
                        <div className="font-medium mb-1">Documents</div>
                        {kycDocUrls.kyc_reg_doc && <div className="text-emerald-400">✓ Registration Certificate</div>}
                        {kycDocUrls.kyc_tax_doc && <div className="text-emerald-400">✓ Tax Document</div>}
                      </div>
                    )}
                    {!kycForm.kyc_business_name && !kycForm.kyc_registration_number && (
                      <p className="text-center py-4" style={{ color: 'var(--text-faint)' }}>Fill in details to see preview</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {kycStatus === 'pending' && (
            <div className="card !p-4 text-center space-y-3">
              <div className="text-3xl">⏳</div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Pending Verification</h2>
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                Business KYC has been submitted. As the organization owner, you can approve it now.
              </p>
              <button onClick={approveKYC} disabled={saving} className="btn-primary text-sm !py-2 !px-6">
                {saving ? 'Approving...' : 'Approve Business KYC'}
              </button>
            </div>
          )}

          {kycStatus === 'verified' && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-3 card !p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-emerald-400">✓ Business Verified</div>
                </div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Submitted Information</h2>

                <div>
                  <label className={labelClass} style={labelStyle}>Business Name</label>
                  <input type="text" value={kycForm.kyc_business_name} className={inputClass} readOnly />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass} style={labelStyle}>Registration Number</label>
                    <input type="text" value={kycForm.kyc_registration_number} className={inputClass} readOnly />
                  </div>
                  <div>
                    <label className={labelClass} style={labelStyle}>Tax ID / VAT Number</label>
                    <input type="text" value={kycForm.kyc_tax_id} className={inputClass} readOnly />
                  </div>
                </div>

                <div>
                  <label className={labelClass} style={labelStyle}>Business Type</label>
                  <input type="text" value={kycForm.kyc_business_type?.replace(/_/g, ' ') || ''} className={inputClass} readOnly style={{ textTransform: 'capitalize' }} />
                </div>

                {kycForm.kyc_business_address && (
                  <div>
                    <label className={labelClass} style={labelStyle}>Business Address</label>
                    <textarea value={kycForm.kyc_business_address} className={inputClass} rows={2} readOnly />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {kycForm.kyc_contact_person && (
                    <div>
                      <label className={labelClass} style={labelStyle}>Contact Person</label>
                      <input type="text" value={kycForm.kyc_contact_person} className={inputClass} readOnly />
                    </div>
                  )}
                  {kycForm.kyc_contact_email && (
                    <div>
                      <label className={labelClass} style={labelStyle}>Contact Email</label>
                      <input type="text" value={kycForm.kyc_contact_email} className={inputClass} readOnly />
                    </div>
                  )}
                </div>

                {kycForm.kyc_contact_phone && (
                  <div>
                    <label className={labelClass} style={labelStyle}>Contact Phone</label>
                    <input type="text" value={kycForm.kyc_contact_phone} className={inputClass} readOnly />
                  </div>
                )}

                {(kycDocUrls.kyc_reg_doc || kycDocUrls.kyc_tax_doc) && (
                  <div className="card !p-3 border" style={{ borderColor: 'var(--border)' }}>
                    <h3 className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Uploaded Documents</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {kycDocUrls.kyc_reg_doc && (
                        <a href={kycDocUrls.kyc_reg_doc} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 underline">✓ Registration Certificate</a>
                      )}
                      {kycDocUrls.kyc_tax_doc && (
                        <a href={kycDocUrls.kyc_tax_doc} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 underline">✓ Tax Document</a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-2">
                <div className="card !p-4 sticky top-4">
                  <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Verification Info</h2>
                  <div className="space-y-2 text-xs" style={{ color: 'var(--text-dim)' }}>
                    {kycForm.kyc_business_name && <div className="flex justify-between"><span>Business</span><span>{kycForm.kyc_business_name}</span></div>}
                    {kycForm.kyc_registration_number && <div className="flex justify-between"><span>Reg #</span><span>{kycForm.kyc_registration_number}</span></div>}
                    {kycForm.kyc_tax_id && <div className="flex justify-between"><span>Tax ID</span><span>{kycForm.kyc_tax_id}</span></div>}
                    {kycForm.kyc_business_type && <div className="flex justify-between"><span>Type</span><span className="capitalize">{kycForm.kyc_business_type.replace(/_/g, ' ')}</span></div>}
                    {kycForm.kyc_contact_person && <div className="flex justify-between"><span>Contact</span><span>{kycForm.kyc_contact_person}</span></div>}
                    {kycForm.kyc_contact_email && <div className="flex justify-between"><span>Email</span><span>{kycForm.kyc_contact_email}</span></div>}
                    {kycForm.kyc_contact_phone && <div className="flex justify-between"><span>Phone</span><span>{kycForm.kyc_contact_phone}</span></div>}
                    {(kycDocUrls.kyc_reg_doc || kycDocUrls.kyc_tax_doc) && (
                      <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                        <div className="font-medium mb-1">Documents</div>
                        {kycDocUrls.kyc_reg_doc && <div className="text-emerald-400">✓ Registration Certificate</div>}
                        {kycDocUrls.kyc_tax_doc && <div className="text-emerald-400">✓ Tax Document</div>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
