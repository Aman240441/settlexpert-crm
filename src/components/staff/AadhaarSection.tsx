import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Shield, FileImage, AlertCircle, CheckCircle2, Download, X, Upload, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface AadhaarSectionProps {
  staffId: string;
  maskedAadhaar?: string | null;
  fullAadhaarInitial?: string | null;
  kycStatus?: string;
  hasFront?: number | boolean;
  hasBack?: number | boolean;
  isEditing?: boolean;
  editAadhaarNumber?: string;
  editFrontDoc?: string | null;
  editBackDoc?: string | null;
  onAadhaarNumberChange?: (val: string) => void;
  onFrontDocChange?: (docData: string | null) => void;
  onBackDocChange?: (docData: string | null) => void;
}

export const AadhaarSection: React.FC<AadhaarSectionProps> = ({
  staffId,
  maskedAadhaar,
  fullAadhaarInitial,
  kycStatus = 'pending',
  hasFront = false,
  hasBack = false,
  isEditing = false,
  editAadhaarNumber = '',
  editFrontDoc = null,
  editBackDoc = null,
  onAadhaarNumberChange,
  onFrontDocChange,
  onBackDocChange,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [showFull, setShowFull] = useState(false);
  const [fullAadhaar, setFullAadhaar] = useState<string | null>(fullAadhaarInitial || null);
  const [revealing, setRevealing] = useState(false);
  const [revealError, setRevealError] = useState('');
  const [frontDocData, setFrontDocData] = useState<string | null>(null);
  const [backDocData, setBackDocData] = useState<string | null>(null);
  const [loadingFront, setLoadingFront] = useState(false);
  const [loadingBack, setLoadingBack] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ type: 'front' | 'back'; data: string } | null>(null);

  // Sync initial full aadhaar if provided
  useEffect(() => {
    if (fullAadhaarInitial) {
      setFullAadhaar(fullAadhaarInitial);
    }
  }, [fullAadhaarInitial]);

  const handleReveal = async () => {
    if (showFull) { setShowFull(false); setFullAadhaar(null); return; }
    setRevealing(true); setRevealError('');
    try {
      const res = await api.revealAadhaar(staffId);
      setFullAadhaar(res.aadhaar_number);
      setShowFull(true);
    } catch (e: any) {
      setRevealError(e.message || 'Failed to reveal Aadhaar');
    } finally { setRevealing(false); }
  };

  const handleViewDoc = async (type: 'front' | 'back') => {
    const overrideData = type === 'front' ? editFrontDoc : editBackDoc;
    if (overrideData) {
      setPreviewDoc({ type, data: overrideData });
      return;
    }
    const existingData = type === 'front' ? frontDocData : backDocData;
    if (existingData) { setPreviewDoc({ type, data: existingData }); return; }
    type === 'front' ? setLoadingFront(true) : setLoadingBack(true);
    try {
      const res = await api.getAadhaarDocument(staffId, type);
      if (type === 'front') setFrontDocData(res.doc_data);
      else setBackDocData(res.doc_data);
      setPreviewDoc({ type, data: res.doc_data });
    } catch (e: any) {
      alert(`Failed to load Aadhaar ${type}: ${e.message}`);
    } finally { type === 'front' ? setLoadingFront(false) : setLoadingBack(false); }
  };

  const formatAadhaar = (num: string) => num.replace(/\s/g, '').match(/.{1,4}/g)?.join(' ') || num;

  const kycStatusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'KYC Pending', color: 'text-amber-700 bg-amber-50 border-amber-200' },
    uploaded: { label: 'Uploaded', color: 'text-blue-700 bg-blue-50 border-blue-200' },
    verified: { label: 'KYC Verified', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
  };
  const statusCfg = kycStatusConfig[kycStatus] || kycStatusConfig.pending;

  return (
    <div className="space-y-4">
      {/* Aadhaar Number */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-5 border border-slate-700 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400"><Shield className="h-4 w-4" /></div>
            <div>
              <h3 className="text-sm font-bold text-white">Aadhaar Card Number</h3>
              <p className="text-[10px] text-slate-400">Government issued identity</p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${isEditing ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : statusCfg.color}`}>
            {isEditing ? 'Editing Mode' : statusCfg.label}
          </span>
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <div className="rounded-xl bg-slate-700/50 border border-slate-600 px-4 py-3">
              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                12-Digit Aadhaar Card Number
              </label>
              <input
                type="text"
                value={editAadhaarNumber}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
                  const fmt = raw.match(/.{1,4}/g)?.join(' ') || raw;
                  onAadhaarNumberChange?.(fmt);
                }}
                placeholder="XXXX XXXX XXXX"
                maxLength={14}
                className="w-full font-mono text-xl font-black tracking-widest text-white bg-slate-800/90 border border-slate-500 rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-400"
              />
              <p className="text-[10px] text-slate-400 mt-2">
                Updating will reflect on KYC identity records.
              </p>
            </div>
          </div>
        ) : maskedAadhaar ? (
          <div className="space-y-3">
            <div className="rounded-xl bg-slate-700/50 border border-slate-600 px-5 py-4">
              <p className="font-mono text-2xl font-black tracking-[0.25em] text-white select-none">
                {showFull && fullAadhaar ? formatAadhaar(fullAadhaar) : maskedAadhaar}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                {showFull ? '⚠ Full Aadhaar visible — handle with care' : 'Masked for security'}
              </p>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-3">
                <button
                  id="aadhaar-show-full-btn"
                  onClick={handleReveal}
                  disabled={revealing}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                    showFull ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-amber-500 hover:bg-amber-400 text-white shadow-amber-500/30'
                  }`}
                >
                  {showFull ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {revealing ? 'Revealing...' : showFull ? 'Hide Aadhaar' : 'Show Full'}
                </button>
                {showFull && (
                  <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Action logged in audit trail
                  </span>
                )}
              </div>
            )}
            {revealError && <p className="text-xs text-rose-400 font-semibold">{revealError}</p>}
          </div>
        ) : (
          <div className="rounded-xl bg-slate-700/30 border border-slate-600/50 px-5 py-4">
            <p className="font-mono text-xl text-slate-500 tracking-[0.2em]">Not Provided</p>
            <p className="text-[10px] text-slate-500 mt-1">No Aadhaar number on record</p>
          </div>
        )}
      </div>

      {/* Documents */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AadhaarDocCard
            label="Aadhaar Front"
            hasDoc={editFrontDoc ? true : editFrontDoc === '' ? false : !!hasFront}
            docData={editFrontDoc !== null ? editFrontDoc : frontDocData}
            loading={loadingFront}
            onView={() => handleViewDoc('front')}
            isEditing={isEditing}
            onUpload={(dataUrl) => onFrontDocChange?.(dataUrl)}
            onRemove={() => onFrontDocChange?.('')}
          />
          <AadhaarDocCard
            label="Aadhaar Back"
            hasDoc={editBackDoc ? true : editBackDoc === '' ? false : !!hasBack}
            docData={editBackDoc !== null ? editBackDoc : backDocData}
            loading={loadingBack}
            onView={() => handleViewDoc('back')}
            isEditing={isEditing}
            onUpload={(dataUrl) => onBackDocChange?.(dataUrl)}
            onRemove={() => onBackDocChange?.('')}
          />
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewDoc(null)}>
          <div className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 bg-slate-900">
              <div className="flex items-center gap-2 text-white">
                <Shield className="h-4 w-4 text-amber-400" />
                <span className="font-bold text-sm">Aadhaar {previewDoc.type === 'front' ? 'Front' : 'Back'} — Confidential</span>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 bg-slate-50 flex items-center justify-center min-h-[300px]">
              {previewDoc.data && previewDoc.data.length > 0 ? (
                <img
                  src={previewDoc.data.startsWith('data:') ? previewDoc.data : `data:image/jpeg;base64,${previewDoc.data}`}
                  alt={`Aadhaar ${previewDoc.type}`}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-md"
                />
              ) : (
                <div className="text-center text-slate-400">
                  <FileImage className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-sm">Document preview unavailable</p>
                </div>
              )}
            </div>
            <div className="px-5 py-3 bg-slate-100 flex justify-end gap-2">
              {previewDoc.data && previewDoc.data.length > 0 && (
                <a
                  href={previewDoc.data.startsWith('data:') ? previewDoc.data : `data:image/jpeg;base64,${previewDoc.data}`}
                  download={`aadhaar_${previewDoc.type}.jpg`}
                  className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-slate-700"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
              )}
              <button onClick={() => setPreviewDoc(null)} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface AadhaarDocCardProps {
  label: string;
  hasDoc: boolean;
  docData: string | null;
  loading: boolean;
  onView: () => void;
  isEditing?: boolean;
  onUpload?: (dataUrl: string) => void;
  onRemove?: () => void;
}

const AadhaarDocCard: React.FC<AadhaarDocCardProps> = ({
  label,
  hasDoc,
  docData,
  loading,
  onView,
  isEditing,
  onUpload,
  onRemove,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        onUpload?.(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between">
      <div>
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileImage className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700">{label}</span>
          </div>
          {hasDoc ? (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Uploaded</span>
          ) : (
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">No Document</span>
          )}
        </div>

        <div className="p-4 flex flex-col items-center justify-center min-h-[120px]">
          {!hasDoc ? (
            <div className="text-center py-2">
              <FileImage className="h-10 w-10 text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400 mb-2">No document uploaded</p>
              {isEditing && (
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-colors shadow-xs">
                  <Upload className="h-3 w-3" />
                  <span>Upload</span>
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>
          ) : docData ? (
            <div className="relative group text-center">
              <img
                src={docData.startsWith('data:') ? docData : `data:image/jpeg;base64,${docData}`}
                alt={label}
                className="max-h-[100px] object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity shadow-sm mx-auto"
                onClick={onView}
              />
            </div>
          ) : (
            <div className="text-center">
              <FileImage className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 mb-2">Document available</p>
              <button
                type="button"
                onClick={onView}
                disabled={loading}
                className="px-3 py-1.5 bg-slate-800 text-white text-[11px] font-bold rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-1.5 mx-auto"
              >
                <Eye className="h-3 w-3" />
                {loading ? 'Loading...' : 'View Document'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Actions footer */}
      {hasDoc && (
        <div className="px-3 pb-3 pt-1 flex items-center gap-1.5 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onView}
            className="flex-1 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition-colors shadow-2xs"
          >
            <Eye className="h-3 w-3" /> Preview
          </button>
          {isEditing && (
            <>
              <label className="flex-1 py-1.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors">
                <Upload className="h-3 w-3" /> Replace
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
              </label>
              <button
                type="button"
                onClick={onRemove}
                title="Remove document"
                className="p-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center transition-colors"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

