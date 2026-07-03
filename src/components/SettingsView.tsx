import React, { useState } from "react";
import { 
  ContractItem,
  ProbationItem,
  ContractStatus, 
  ProbationStatus, 
  UserRecommendation, 
  ApprovalStatus, 
  SalaryNegotiationStatus 
} from "../types";
import { 
  Sliders, 
  CheckCircle, 
  Info, 
  Settings, 
  Calendar, 
  Users, 
  TrendingUp, 
  ShieldAlert,
  Database,
  Download,
  Trash2,
  RefreshCw,
  FileText,
  AlertTriangle,
  Plus,
  Edit2
} from "lucide-react";

interface SettingsViewProps {
  contracts: ContractItem[];
  probations: ProbationItem[];
  hrPics: string[];
  onAddHrPic: (name: string) => string | null;
  onEditHrPic: (oldName: string, newName: string) => string | null;
  onDeleteHrPic: (name: string) => void;
  onClearSampleData: () => void;
  onClearAllData: () => void;
  onResetToSampleData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  contracts,
  probations,
  hrPics,
  onAddHrPic,
  onEditHrPic,
  onDeleteHrPic,
  onClearSampleData,
  onClearAllData,
  onResetToSampleData
}) => {
  // HR PIC Management state
  const [newPicName, setNewPicName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  
  // Editing state
  const [editingPicName, setEditingPicName] = useState<string | null>(null);
  const [editInputValue, setEditInputValue] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  
  // Deleting confirmation state
  const [deletingPic, setDeletingPic] = useState<string | null>(null);
  
  // Success toast/alert message
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleExportContractsBackup = () => {
    const dataStr = JSON.stringify(contracts, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `contracts_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportProbationBackup = () => {
    const dataStr = JSON.stringify(probations, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `probations_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPicUsageCount = (pic: string) => {
    const norm = pic.trim().toLowerCase();
    const cCount = contracts.filter(c => c.hrPic && c.hrPic.trim().toLowerCase() === norm).length;
    const pCount = probations.filter(p => p.hrPic && p.hrPic.trim().toLowerCase() === norm).length;
    return { cCount, pCount };
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setSuccessMessage(null);
    
    const err = onAddHrPic(newPicName);
    if (err) {
      setAddError(err);
    } else {
      setSuccessMessage(`Berhasil menambahkan HR PIC "${newPicName.trim()}"`);
      setNewPicName("");
    }
  };

  const handleSaveEditSubmit = (pic: string) => {
    setEditError(null);
    setSuccessMessage(null);
    
    const err = onEditHrPic(pic, editInputValue);
    if (err) {
      setEditError(err);
    } else {
      setSuccessMessage(`Nama HR PIC "${pic}" berhasil diubah menjadi "${editInputValue.trim()}"`);
      setEditingPicName(null);
      setEditInputValue("");
    }
  };

  const handleDeleteClick = (pic: string) => {
    setSuccessMessage(null);
    const { cCount, pCount } = getPicUsageCount(pic);
    if (cCount > 0 || pCount > 0) {
      // Show custom warning modal/alert
      setDeletingPic(pic);
    } else {
      // No usage, we can ask for normal confirmation or delete immediately
      if (confirm(`Apakah Anda yakin ingin menghapus HR PIC "${pic}"?`)) {
        onDeleteHrPic(pic);
        setSuccessMessage(`Berhasil menghapus HR PIC "${pic}"`);
      }
    }
  };

  const confirmDelete = () => {
    if (deletingPic) {
      onDeleteHrPic(deletingPic);
      setSuccessMessage(`Berhasil menghapus HR PIC "${deletingPic}"`);
      setDeletingPic(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="settings-view-container">
      {/* Header */}
      <div className="border-b border-slate-100 pb-5">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Master Data & Policy Control</h1>
        <p className="text-slate-500 mt-1">Configure and reference corporate dropdowns, approval definitions, and SLA reminder matrices.</p>
      </div>

      {/* Grid of Drodown definitions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* HR PIC Management Section */}
        <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-xs space-y-4 lg:col-span-2">
          <h3 className="font-semibold text-slate-900 font-display flex items-center gap-2 border-b border-slate-100 pb-3 mb-1">
            <Users className="h-5 w-5 text-indigo-600" />
            HR PIC Management
          </h3>
          <p className="text-xs text-slate-500">
            Kelola daftar Person In Charge (PIC) HR untuk penugasan pengawasan kontrak dan probation.
          </p>

          {/* Success Notification */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-850 text-xs rounded-lg font-medium animate-fade-in">
              ✓ {successMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Left Col: Add form */}
            <div className="space-y-4">
              <form onSubmit={handleAddSubmit} className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Tambah HR PIC Baru</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Contoh: Alfian"
                    value={newPicName}
                    onChange={(e) => { setNewPicName(e.target.value); setAddError(null); }}
                    className="flex-1 px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah
                  </button>
                </div>
                {addError && <p className="text-[11px] text-rose-600 font-medium">{addError}</p>}
              </form>

              <div className="bg-slate-50 p-4 border border-slate-150 rounded-xl text-xs space-y-2 text-slate-600 leading-relaxed">
                <div className="font-semibold text-slate-800 flex items-center gap-1">
                  <Info className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                  Aturan & Validasi
                </div>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>Nama tidak boleh kosong (setelah di-trim).</li>
                  <li>Nama harus unik secara case-insensitive.</li>
                  <li>Mengedit nama akan otomatis memperbarui seluruh data kontrak & probation terkait.</li>
                  <li>Menghapus nama yang terpakai akan menampilkan dialog konfirmasi peringatan.</li>
                </ul>
              </div>
            </div>

            {/* Right Col: List of current HR PICs */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Daftar Master HR PIC ({hrPics.length})</label>
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/30">
                <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-150">
                  {hrPics.map(pic => {
                    const { cCount, pCount } = getPicUsageCount(pic);
                    const isEditing = editingPicName === pic;

                    return (
                      <div key={pic} className="flex items-center justify-between p-3.5 bg-white hover:bg-slate-50/50 transition gap-4">
                        {isEditing ? (
                          <div className="flex-1 space-y-1.5">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editInputValue}
                                onChange={(e) => { setEditInputValue(e.target.value); setEditError(null); }}
                                className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveEditSubmit(pic)}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer"
                              >
                                Simpan
                              </button>
                              <button
                                type="button"
                                onClick={() => { setEditingPicName(null); setEditError(null); }}
                                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                              >
                                Batal
                              </button>
                            </div>
                            {editError && <p className="text-[10px] text-rose-600 font-medium">{editError}</p>}
                          </div>
                        ) : (
                          <>
                            <div className="min-w-0">
                              <p className="font-semibold text-xs text-slate-800 truncate">{pic}</p>
                              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                Terhubung ke: <span className="text-slate-600 font-semibold">{cCount} kontrak</span> & <span className="text-slate-600 font-semibold">{pCount} probation</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => { setEditingPicName(pic); setEditInputValue(pic); setEditError(null); }}
                                className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 hover:text-indigo-600 transition cursor-pointer"
                                title="Edit"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteClick(pic)}
                                className="p-1.5 hover:bg-rose-50 rounded-md text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                title="Hapus"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contract Status Values */}
        <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-xs">
          <h3 className="font-semibold text-slate-900 font-display flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
            <Sliders className="h-4 w-4 text-indigo-600" />
            Contract Status Domain Definitions
          </h3>
          <p className="text-xs text-slate-500 mb-4">Standard lifecycle stages utilized within the Contract Control Tracker.</p>
          <div className="flex flex-wrap gap-2">
            {Object.values(ContractStatus).map(val => (
              <span key={val} className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-100 font-mono">
                {val}
              </span>
            ))}
          </div>
        </div>

        {/* Probation Status Values */}
        <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-xs">
          <h3 className="font-semibold text-slate-900 font-display flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
            <Users className="h-4 w-4 text-emerald-600" />
            Probation Status Domain Definitions
          </h3>
          <p className="text-xs text-slate-500 mb-4">Standard tracking phases for 3-month trial employees undergoing appraisal.</p>
          <div className="flex flex-wrap gap-2">
            {Object.values(ProbationStatus).map(val => (
              <span key={val} className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100 font-mono">
                {val}
              </span>
            ))}
          </div>
        </div>

        {/* User Recommendations & Approvals */}
        <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-xs space-y-5">
          <div>
            <h3 className="font-semibold text-slate-900 font-display flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
              <CheckCircle className="h-4 w-4 text-slate-700" />
              Manager Recommendation Choices
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.values(UserRecommendation).filter(r => r !== "None").map(val => (
                <span key={val} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                  {val}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 font-display flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
              <CheckCircle className="h-4 w-4 text-purple-600" />
              Workflow Sign-off Statuses
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.values(ApprovalStatus).filter(a => a !== "None").map(val => (
                <span key={val} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-800 border border-purple-100 font-mono">
                  {val}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Compensation Review Dropdowns */}
        <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-xs">
          <h3 className="font-semibold text-slate-900 font-display flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
            <TrendingUp className="h-4 w-4 text-teal-600" />
            Compensation Review Matrix
          </h3>
          <p className="text-xs text-slate-500 mb-4">Standard compensation review and negotiation status triggers.</p>
          <div className="flex flex-wrap gap-2">
            {Object.values(SalaryNegotiationStatus).map(val => (
              <span key={val} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-teal-50 text-teal-800 border border-teal-100 font-mono">
                {val}
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* Data Management Section */}
      <div className="bg-white border border-slate-150 rounded-xl p-6 shadow-xs space-y-6" id="data-management-panel">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="font-bold text-slate-900 font-display text-lg flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-600" />
            Data Management
          </h3>
          <p className="text-xs text-slate-500 mt-1">Export database backups or modify the active LocalStorage sandbox contents.</p>
        </div>

        {/* Backup Reminder Box */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl flex items-start gap-3 shadow-xs">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">LocalStorage Backup Advisory</h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              Data is currently stored in this browser using LocalStorage. Before deploying major updates or clearing data, export a backup first.
            </p>
          </div>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
          {/* Export Contracts Backup */}
          <button
            onClick={handleExportContractsBackup}
            id="btn-export-contracts-backup"
            className="flex flex-col items-center justify-center p-4 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/10 rounded-xl text-center transition cursor-pointer group space-y-2"
          >
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg group-hover:scale-110 transition">
              <Download className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">Export Contracts Backup</span>
            <span className="text-[10px] text-slate-400 font-mono">({contracts.length} records)</span>
          </button>

          {/* Export Probation Backup */}
          <button
            onClick={handleExportProbationBackup}
            id="btn-export-probation-backup"
            className="flex flex-col items-center justify-center p-4 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/10 rounded-xl text-center transition cursor-pointer group space-y-2"
          >
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-110 transition">
              <Download className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">Export Probation Backup</span>
            <span className="text-[10px] text-slate-400 font-mono">({probations.length} records)</span>
          </button>

          {/* Clear Sample Data */}
          <button
            onClick={onClearSampleData}
            id="btn-clear-sample-data"
            className="flex flex-col items-center justify-center p-4 border border-slate-200 hover:border-rose-300 hover:bg-rose-50/10 rounded-xl text-center transition cursor-pointer group space-y-2"
          >
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg group-hover:scale-110 transition">
              <Trash2 className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">Clear Sample Data</span>
            <span className="text-[10px] text-slate-400 leading-normal">
              Removes only records marked as sample ({contracts.filter(c => c.isSampleData).length + probations.filter(p => p.isSampleData).length} found)
            </span>
          </button>

          {/* Reset to Sample Data */}
          <button
            onClick={onResetToSampleData}
            id="btn-reset-sample-data"
            className="flex flex-col items-center justify-center p-4 border border-slate-200 hover:border-amber-300 hover:bg-amber-50/10 rounded-xl text-center transition cursor-pointer group space-y-2"
          >
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg group-hover:scale-110 transition">
              <RefreshCw className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">Reset to Sample Data</span>
            <span className="text-[10px] text-slate-400 leading-normal">
              Resets all active trackers back to the default sandboxed dataset
            </span>
          </button>

          {/* Clear All Data */}
          <button
            onClick={onClearAllData}
            id="btn-clear-all-data"
            className="flex flex-col items-center justify-center p-4 border border-rose-200 hover:border-rose-500 hover:bg-rose-500 hover:text-white rounded-xl text-center transition cursor-pointer group space-y-2"
          >
            <div className="p-2.5 bg-rose-100 text-rose-700 rounded-lg group-hover:scale-110 group-hover:bg-rose-200 transition">
              <Trash2 className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-white">Clear All Data</span>
            <span className="text-[10px] text-slate-400 group-hover:text-rose-100 leading-normal font-sans">
              Wipes entire local browser storage completely
            </span>
          </button>
        </div>
      </div>

      {/* SLA Matrix rules list */}
      <div className="bg-slate-900 text-slate-100 rounded-xl p-6 shadow-md border border-slate-800">
        <h3 className="text-lg font-bold font-display flex items-center gap-2 border-b border-slate-800 pb-4 mb-4">
          <Calendar className="h-5 w-5 text-indigo-400" />
          SLA & Auto-Priority Calculation Rules (Standard Policy)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
          {/* Contracts SLA policy */}
          <div className="space-y-4">
            <h4 className="font-bold text-indigo-300 font-display flex items-center gap-2 uppercase tracking-wide text-xs">
              <span className="h-2 w-2 rounded-full bg-indigo-400"></span>
              Contract SLA Intervals (H-Days to Expiration)
            </h4>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">&gt; 60 Days:</span>
                <span className="text-slate-200 font-bold">Priority Low (Active)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">H-60 to H-46:</span>
                <span className="text-amber-400 font-bold">Priority Medium (Suggested: Need Review)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">H-45 to H-31:</span>
                <span className="text-amber-400 font-bold">Priority Medium (Suggested: Waiting User Review)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">H-30 to H-22:</span>
                <span className="text-orange-400 font-bold">Priority High (Suggested: Waiting Director Approval)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">H-21 to H-15:</span>
                <span className="text-orange-400 font-bold">Priority High (Suggested: Contract Drafting)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">H-14 to H-11:</span>
                <span className="text-orange-400 font-bold">Priority High (Suggested: Waiting Head HR Review)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">H-10 to H-8:</span>
                <span className="text-orange-400 font-bold">Priority High (Suggested: Contract Sent)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">H-7 to H-4:</span>
                <span className="text-orange-400 font-bold">Priority High (Suggested: Waiting Signed Contract)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">H-3 to H-0:</span>
                <span className="text-rose-500 font-extrabold animate-pulse">Priority Critical</span>
              </div>
              <div className="flex justify-between">
                <span className="text-rose-400">Passed End Date (Without final state):</span>
                <span className="text-rose-600 font-extrabold underline decoration-2">Priority Overdue</span>
              </div>
            </div>
          </div>

          {/* Probations SLA policy */}
          <div className="space-y-4">
            <h4 className="font-bold text-emerald-300 font-display flex items-center gap-2 uppercase tracking-wide text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              Probation SLA Intervals (H-Days to Evaluation)
            </h4>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">&gt; 45 Days:</span>
                <span className="text-slate-200 font-bold">Priority Low (Active Probation)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">H-45 to H-31:</span>
                <span className="text-amber-400 font-bold">Priority Medium (Suggested: Need Review)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">H-30 to H-21:</span>
                <span className="text-amber-400 font-bold">Priority Medium (Suggested: Waiting Review Form)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">H-20 to H-14:</span>
                <span className="text-orange-400 font-bold">Priority High (Suggested: Waiting User Recommendation)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">H-13 to H-7:</span>
                <span className="text-orange-400 font-bold">Priority High (Suggested: Waiting Director Approval)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">H-6 to H-0:</span>
                <span className="text-rose-500 font-extrabold animate-pulse">Priority Critical</span>
              </div>
              <div className="flex justify-between">
                <span className="text-rose-400">Passed End Date (Without final decision):</span>
                <span className="text-rose-600 font-extrabold underline decoration-2">Priority Overdue</span>
              </div>
            </div>
            
            <div className="bg-slate-850 p-4 border border-slate-800 rounded-lg space-y-2 mt-4">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Info className="h-3 w-3 text-indigo-400" />
                Auto-Calculation Note
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                These rules are applied dynamically based on the set Simulation Date. If an employee has achieved a final state (e.g. status Completed/Not Renewed/Converted to Permanent for contracts, or has a finalized decision for probation), their priority is safely marked as <strong className="text-emerald-400">Low</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Deletion Warning Modal */}
      {deletingPic && (() => {
        const { cCount, pCount } = getPicUsageCount(deletingPic);
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="delete-pic-warning-modal">
            <div className="bg-white border border-slate-150 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-scale-up">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-950 font-display text-base">Hapus HR PIC Terpakai?</h3>
                  <p className="text-xs text-slate-500">
                    Nama HR PIC <strong className="text-slate-800">"{deletingPic}"</strong> saat ini sedang digunakan dalam data aktif tracker.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50/60 border border-amber-200 text-amber-950 rounded-xl space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider">Detail Penggunaan Data:</p>
                <ul className="text-xs list-disc list-inside space-y-0.5">
                  <li>Kontrak Terkait: <span className="font-semibold">{cCount} kontrak</span></li>
                  <li>Probation Terkait: <span className="font-semibold">{pCount} data probation</span></li>
                </ul>
                <p className="text-[11px] mt-2 border-t border-amber-200/50 pt-1.5 leading-normal">
                  ⚠️ Hapus akan tetap menghapus nama ini dari Master List, tapi data lama tidak diubah.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingPic(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  Batal / Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition shadow-md cursor-pointer"
                >
                  Ya, Tetap Hapus
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

