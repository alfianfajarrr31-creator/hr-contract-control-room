import React, { useState, useEffect } from "react";
import { 
  ContractItem, 
  ContractStatus, 
  UserRecommendation, 
  ApprovalStatus, 
  SalaryNegotiationStatus,
  isContractNumberExists,
  getNextContractSequence
} from "../types";
import { DEPARTMENTS, HR_PICS } from "../seedData";
import { Save, ArrowLeft, AlertCircle } from "lucide-react";

interface ContractFormProps {
  contractToEdit: ContractItem | null;
  existingContracts?: ContractItem[];
  onSave: (contract: ContractItem) => void;
  onCancel: () => void;
}

export const ContractForm: React.FC<ContractFormProps> = ({
  contractToEdit,
  existingContracts = [],
  onSave,
  onCancel
}) => {
  const isEditMode = !!contractToEdit;

  // Form State
  const [employeeId, setEmployeeId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [position, setPosition] = useState("");
  const [directManager, setDirectManager] = useState("");
  const [contractType, setContractType] = useState("PKWT I");
  const [contractNumber, setContractNumber] = useState("");
  const [contractStartDate, setContractStartDate] = useState("");
  const [contractEndDate, setContractEndDate] = useState("");
  
  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleAutoGenerateNumber = () => {
    if (contractNumber.trim()) {
      const confirmReplace = window.confirm("Nomor kontrak sudah terisi. Ganti dengan nomor urut terbaru?");
      if (!confirmReplace) return;
    }
    const nextSeq = getNextContractSequence(existingContracts);
    setContractNumber(nextSeq);
    setToastMessage(`Generated contract number: ${nextSeq}`);
  };
  
  // ARC 3.1 Non-nominal states
  const [compensationReviewNeeded, setCompensationReviewNeeded] = useState(false);
  const [salaryNegotiationStatus, setSalaryNegotiationStatus] = useState<SalaryNegotiationStatus>(SalaryNegotiationStatus.NoNegotiation);
  const [negotiationNotes, setNegotiationNotes] = useState("");
  const [payrollFollowUpNotes, setPayrollFollowUpNotes] = useState("");

  const [userRecommendation, setUserRecommendation] = useState<UserRecommendation>(UserRecommendation.None);
  const [directorApproval, setDirectorApproval] = useState<ApprovalStatus>(ApprovalStatus.None);
  const [headHRReview, setHeadHRReview] = useState<ApprovalStatus>(ApprovalStatus.None);
  const [contractDraftDate, setContractDraftDate] = useState("");
  const [contractSentDate, setContractSentDate] = useState("");
  const [signedDeadline, setSignedDeadline] = useState("");
  const [signedReceivedDate, setSignedReceivedDate] = useState("");
  const [contractStatus, setContractStatus] = useState<ContractStatus>(ContractStatus.Active);
  const [hrPic, setHrPic] = useState("Siti Rahma");
  const [notes, setNotes] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load editing item if applicable
  useEffect(() => {
    if (contractToEdit) {
      setEmployeeId(contractToEdit.employeeId);
      setEmployeeName(contractToEdit.employeeName);
      setDepartment(contractToEdit.department);
      setPosition(contractToEdit.position);
      setDirectManager(contractToEdit.directManager);
      setContractType(contractToEdit.contractType);
      setContractNumber(contractToEdit.contractNumber);
      setContractStartDate(contractToEdit.contractStartDate);
      setContractEndDate(contractToEdit.contractEndDate);
      
      // Load ARC 3.1 safe fields
      setCompensationReviewNeeded(!!contractToEdit.compensationReviewNeeded);
      setSalaryNegotiationStatus(contractToEdit.salaryNegotiationStatus || SalaryNegotiationStatus.NoNegotiation);
      setNegotiationNotes(contractToEdit.negotiationNotes || "");
      setPayrollFollowUpNotes(contractToEdit.payrollFollowUpNotes || "");

      setUserRecommendation(contractToEdit.userRecommendation);
      setDirectorApproval(contractToEdit.directorApproval);
      setHeadHRReview(contractToEdit.headHRReview);
      setContractDraftDate(contractToEdit.contractDraftDate);
      setContractSentDate(contractToEdit.contractSentDate);
      setSignedDeadline(contractToEdit.signedDeadline);
      setSignedReceivedDate(contractToEdit.signedReceivedDate);
      setContractStatus(contractToEdit.contractStatus);
      setHrPic(contractToEdit.hrPic);
      setNotes(contractToEdit.notes);
    } else {
      // Generate some default dummy data
      const randomIdNum = Math.floor(100 + Math.random() * 900);
      setEmployeeId(`EMP-${randomIdNum}`);
      setEmployeeName("");
      setDepartment(DEPARTMENTS[1] || "Engineering");
      setPosition("");
      setDirectManager("");
      setContractType("PKWT I");
      setContractNumber("");
      setContractStartDate("");
      setContractEndDate("");
      
      // Reset ARC 3.1 fields
      setCompensationReviewNeeded(false);
      setSalaryNegotiationStatus(SalaryNegotiationStatus.NoNegotiation);
      setNegotiationNotes("");
      setPayrollFollowUpNotes("");

      setUserRecommendation(UserRecommendation.None);
      setDirectorApproval(ApprovalStatus.None);
      setHeadHRReview(ApprovalStatus.None);
      setContractDraftDate("");
      setContractSentDate("");
      setSignedDeadline("");
      setSignedReceivedDate("");
      setContractStatus(ContractStatus.NeedReview);
      setHrPic(HR_PICS[1] || "Siti Rahma");
      setNotes("");
    }
    setErrors({});
  }, [contractToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // Validate mandatory fields
    if (!employeeName.trim()) newErrors.employeeName = "Employee Name is required";
    if (!department.trim()) newErrors.department = "Department is required";
    if (!position.trim()) newErrors.position = "Position is required";
    if (!directManager.trim()) newErrors.directManager = "Direct Manager is required";
    if (!contractType.trim()) newErrors.contractType = "Contract Type is required";
    if (!contractStartDate) newErrors.contractStartDate = "Contract Start Date is required";
    if (!contractEndDate) newErrors.contractEndDate = "Contract End Date is required";
    if (!hrPic.trim() || hrPic === "All HR PICs") newErrors.hrPic = "Valid HR PIC is required";
    if (!contractStatus.trim()) newErrors.contractStatus = "Contract Status is required";

    // Check for duplicate Contract Number (prevent save if duplicate)
    const normNum = contractNumber.trim().toLowerCase();
    if (normNum) {
      const isDuplicate = existingContracts.some(c => 
        c.contractNumber && 
        c.contractNumber.trim().toLowerCase() === normNum && 
        (!isEditMode || c.id !== contractToEdit?.id)
      );
      if (isDuplicate) {
        newErrors.contractNumber = "Nomor kontrak ini sudah digunakan. Silakan generate nomor baru atau edit manual.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // scroll to top of form
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const payload: ContractItem = {
      id: isEditMode ? contractToEdit!.id : employeeId,
      employeeId,
      employeeName,
      department,
      position,
      directManager,
      contractType,
      contractNumber: contractNumber.trim(),
      contractStartDate,
      contractEndDate,
      daysRemaining: contractToEdit ? contractToEdit.daysRemaining : 0, // will be computed in App state on save
      
      // ARC 3.1 fields
      compensationReviewNeeded,
      negotiationStatus: salaryNegotiationStatus,
      negotiationNotes,
      payrollFollowUpNotes,

      userRecommendation,
      directorApproval,
      headHRReview,
      contractDraftDate,
      contractSentDate,
      signedDeadline,
      signedReceivedDate,
      contractStatus,
      salaryNegotiationStatus,
      hrPic,
      notes,
      priority: contractToEdit ? contractToEdit.priority : "Low" // will be computed in App state on save
    };

    onSave(payload);
  };

  return (
    <div className="bg-white border border-slate-150 rounded-xl shadow-xs overflow-hidden animate-fade-in" id="contract-form-container">
      {/* Form Header */}
      <div className="bg-slate-50 border-b border-slate-100 px-6 py-5 flex items-center gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">
            {isEditMode ? `Edit Contract - ${contractToEdit?.employeeName}` : "Register New Employee Contract"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isEditMode ? "Modify contract status, approval process, or compensation reviews." : "Input new recruit contract detail. Days remaining and SLAs will auto-calculate."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8" id="contract-form-tag">
        {/* Error message block */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-rose-900">Missing Mandatory Fields</p>
              <p className="text-xs text-rose-700 mt-0.5">Please check and complete the highlighted inputs below.</p>
            </div>
          </div>
        )}

        {/* Section A: Employee & Core Placement */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 font-mono border-b border-indigo-50 pb-2">
            A. Employee Profile & Placement
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Employee ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                disabled={isEditMode}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 disabled:text-slate-400 font-mono focus:ring-2 focus:ring-indigo-500/20 transition outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Employee Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={employeeName}
                placeholder="e.g. John Doe"
                onChange={(e) => setEmployeeName(e.target.value)}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm transition outline-none ${
                  errors.employeeName ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20" : "border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                }`}
              />
              {errors.employeeName && <p className="text-xs text-rose-600 mt-1">{errors.employeeName}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none"
              >
                {DEPARTMENTS.filter(d => d !== "All Departments").map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Job Position <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={position}
                placeholder="e.g. Senior Recruiter"
                onChange={(e) => setPosition(e.target.value)}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm transition outline-none ${
                  errors.position ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20" : "border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                }`}
              />
              {errors.position && <p className="text-xs text-rose-600 mt-1">{errors.position}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Direct Manager <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={directManager}
                placeholder="e.g. Budi Santoso"
                onChange={(e) => setDirectManager(e.target.value)}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm transition outline-none ${
                  errors.directManager ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20" : "border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                }`}
              />
              {errors.directManager && <p className="text-xs text-rose-600 mt-1">{errors.directManager}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                HR PIC <span className="text-rose-500">*</span>
              </label>
              <select
                value={hrPic}
                onChange={(e) => setHrPic(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none"
              >
                {HR_PICS.filter(p => p !== "All HR PICs").map(pic => (
                  <option key={pic} value={pic}>{pic}</option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* Section B: Contract Specifications & Dates */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 font-mono border-b border-indigo-50 pb-2">
            B. Contract Details & Key Dates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Contract Type <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={contractType}
                placeholder="e.g. PKWT I or PKWT II"
                onChange={(e) => setContractType(e.target.value)}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm transition outline-none ${
                  errors.contractType ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20" : "border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                }`}
              />
              {errors.contractType && <p className="text-xs text-rose-600 mt-1">{errors.contractType}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex justify-between items-center">
                <span>Contract Number</span>
                {contractNumber.trim() && isContractNumberExists(existingContracts, contractNumber) && (
                  <span className="text-[10px] text-amber-600 font-medium normal-case">⚠️ Already in use</span>
                )}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={contractNumber}
                  placeholder="e.g. 001"
                  onChange={(e) => setContractNumber(e.target.value)}
                  className={`flex-1 px-3.5 py-2.5 border rounded-lg text-sm bg-white font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none ${
                    errors.contractNumber ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20" : "border-slate-200"
                  }`}
                />
                <button
                  type="button"
                  onClick={handleAutoGenerateNumber}
                  className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 hover:border-indigo-300 rounded-lg text-xs font-semibold cursor-pointer transition shrink-0 flex items-center gap-1"
                >
                  Auto Generate Nomor Urut
                </button>
              </div>
              {toastMessage && (
                <p className="text-[11px] text-indigo-600 font-medium mt-1">✓ {toastMessage}</p>
              )}
              {errors.contractNumber && (
                <p className="text-xs text-rose-600 mt-1 leading-normal font-sans">{errors.contractNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Contract Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={contractStartDate}
                onChange={(e) => setContractStartDate(e.target.value)}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm font-mono transition outline-none bg-white ${
                  errors.contractStartDate ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20" : "border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                }`}
              />
              {errors.contractStartDate && <p className="text-xs text-rose-600 mt-1">{errors.contractStartDate}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Contract End (Expired) Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={contractEndDate}
                onChange={(e) => setContractEndDate(e.target.value)}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm font-mono transition outline-none bg-white ${
                  errors.contractEndDate ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20" : "border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                }`}
              />
              {errors.contractEndDate && <p className="text-xs text-rose-600 mt-1">{errors.contractEndDate}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Draft Date
              </label>
              <input
                type="date"
                value={contractDraftDate}
                onChange={(e) => setContractDraftDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Sent to Employee Date
              </label>
              <input
                type="date"
                value={contractSentDate}
                onChange={(e) => setContractSentDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Signed Deadline Date
              </label>
              <input
                type="date"
                value={signedDeadline}
                onChange={(e) => setSignedDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Signed Received Date
              </label>
              <input
                type="date"
                value={signedReceivedDate}
                onChange={(e) => setSignedReceivedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none bg-white"
              />
            </div>

          </div>
        </div>

        {/* Section C: Non-nominal Compensation & Negotiation Tracker */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 font-mono border-b border-indigo-50 pb-2">
            C. Negotiation & Compensation Review (Non-Nominal)
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-150 rounded-xl">
                <input
                  type="checkbox"
                  id="compensationReviewNeeded"
                  checked={compensationReviewNeeded}
                  onChange={(e) => setCompensationReviewNeeded(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="compensationReviewNeeded" className="text-xs font-bold text-slate-700 uppercase tracking-wider cursor-pointer">
                  Compensation Review Needed <span className="text-[10px] text-slate-400 font-normal block font-sans">Toggle if employee requested compensation updates</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Negotiation Status
                </label>
                <select
                  value={salaryNegotiationStatus}
                  onChange={(e) => setSalaryNegotiationStatus(e.target.value as SalaryNegotiationStatus)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none"
                >
                  {Object.values(SalaryNegotiationStatus).map(val => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </select>
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Negotiation Notes
                </label>
                <textarea
                  rows={3}
                  value={negotiationNotes}
                  placeholder="Record employee request details, date discussed, etc. (Strictly no nominal amount)"
                  onChange={(e) => setNegotiationNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-white font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Payroll/Management Follow-up Notes
                </label>
                <textarea
                  rows={3}
                  value={payrollFollowUpNotes}
                  placeholder="Record instructions or notes for Payroll / Management handling outside this system."
                  onChange={(e) => setPayrollFollowUpNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-white font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section D: Approvals & Workflow Status */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 font-mono border-b border-indigo-50 pb-2">
            D. Approval Tracking & Workflow Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                User / Manager Recommendation
              </label>
              <select
                value={userRecommendation}
                onChange={(e) => setUserRecommendation(e.target.value as UserRecommendation)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none"
              >
                {Object.values(UserRecommendation).map(val => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Director Sign-Off Approval
              </label>
              <select
                value={directorApproval}
                onChange={(e) => setDirectorApproval(e.target.value as ApprovalStatus)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none"
              >
                {Object.values(ApprovalStatus).map(val => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Head HR Review / Approval
              </label>
              <select
                value={headHRReview}
                onChange={(e) => setHeadHRReview(e.target.value as ApprovalStatus)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none"
              >
                {Object.values(ApprovalStatus).map(val => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Contract Workflow Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={contractStatus}
                onChange={(e) => setContractStatus(e.target.value as ContractStatus)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none text-indigo-700 font-semibold"
              >
                {Object.values(ContractStatus).map(val => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* Section E: Operational HR Notes */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 font-mono border-b border-indigo-50 pb-2">
            E. Operational Notes
          </h3>
          <div>
            <textarea
              rows={4}
              value={notes}
              placeholder="Enter general timeline feedback, manager discussions, or delay issues..."
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-white font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            id="save-contract-submit-btn"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition shadow-md cursor-pointer"
          >
            <Save className="h-4 w-4" />
            {isEditMode ? "Save Changes" : "Create Contract"}
          </button>
        </div>

      </form>
    </div>
  );
};
