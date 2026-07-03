import React, { useState, useEffect } from "react";
import { 
  ProbationItem, 
  ProbationStatus, 
  UserRecommendation, 
  ApprovalStatus 
} from "../types";
import { DEPARTMENTS } from "../seedData";
import { Save, ArrowLeft, AlertCircle } from "lucide-react";

interface ProbationFormProps {
  probationToEdit: ProbationItem | null;
  hrPics: string[];
  departments: string[];
  directManagers: string[];
  onSave: (probation: ProbationItem) => void;
  onCancel: () => void;
}

export const ProbationForm: React.FC<ProbationFormProps> = ({
  probationToEdit,
  hrPics,
  departments,
  directManagers,
  onSave,
  onCancel
}) => {
  const isEditMode = !!probationToEdit;

  // Form State
  const [employeeId, setEmployeeId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [directManager, setDirectManager] = useState("");
  const [probationStartDate, setProbationStartDate] = useState("");
  const [probationEndDate, setProbationEndDate] = useState("");
  const [reviewFormStatus, setReviewFormStatus] = useState("Sent to User");
  const [userRecommendation, setUserRecommendation] = useState<UserRecommendation>(UserRecommendation.None);
  const [directorApproval, setDirectorApproval] = useState<ApprovalStatus>(ApprovalStatus.None);
  const [finalDecision, setFinalDecision] = useState("");
  const [newEmploymentStatus, setNewEmploymentStatus] = useState("");
  const [hrPic, setHrPic] = useState(() => hrPics[0] || "HR Team");
  const [notes, setNotes] = useState("");
  const [probationStatus, setProbationStatus] = useState<ProbationStatus>(ProbationStatus.ActiveProbation);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load editing item if applicable
  useEffect(() => {
    if (probationToEdit) {
      setEmployeeId(probationToEdit.employeeId);
      setEmployeeName(probationToEdit.employeeName);
      setDepartment(probationToEdit.department);
      setPosition(probationToEdit.position);
      setDirectManager(probationToEdit.directManager);
      setProbationStartDate(probationToEdit.probationStartDate);
      setProbationEndDate(probationToEdit.probationEndDate);
      setReviewFormStatus(probationToEdit.reviewFormStatus);
      setUserRecommendation(probationToEdit.userRecommendation);
      setDirectorApproval(probationToEdit.directorApproval);
      setFinalDecision(probationToEdit.finalDecision);
      setNewEmploymentStatus(probationToEdit.newEmploymentStatus);
      setHrPic(probationToEdit.hrPic);
      setNotes(probationToEdit.notes);
      setProbationStatus(probationToEdit.probationStatus);
    } else {
      // Generate some default dummy data
      const randomIdNum = Math.floor(100 + Math.random() * 900);
      setEmployeeId(`PRB-${randomIdNum}`);
      setEmployeeName("");
      setDepartment(departments[0] || "HR");
      setPosition("");
      setDirectManager(directManagers[0] || "");
      setProbationStartDate("");
      setProbationEndDate("");
      setReviewFormStatus("Pending");
      setUserRecommendation(UserRecommendation.None);
      setDirectorApproval(ApprovalStatus.None);
      setFinalDecision("");
      setNewEmploymentStatus("");
      setHrPic(hrPics[0] || "HR Team");
      setNotes("");
      setProbationStatus(ProbationStatus.ActiveProbation);
    }
    setErrors({});
  }, [probationToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // Validate mandatory fields
    if (!employeeName.trim()) newErrors.employeeName = "Employee Name is required";
    if (!department.trim()) newErrors.department = "Department is required";
    if (!position.trim()) newErrors.position = "Position is required";
    if (!directManager.trim()) newErrors.directManager = "Direct Manager is required";
    if (!probationStartDate) newErrors.probationStartDate = "Probation Start Date is required";
    if (!probationEndDate) newErrors.probationEndDate = "Probation End Date is required";
    if (!reviewFormStatus.trim()) newErrors.reviewFormStatus = "Review Form Status is required";
    if (!hrPic.trim() || hrPic === "All HR PICs") newErrors.hrPic = "Valid HR PIC is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const payload: ProbationItem = {
      id: isEditMode ? probationToEdit!.id : employeeId,
      employeeId,
      employeeName,
      department,
      position,
      directManager,
      probationStartDate,
      probationEndDate,
      daysRemaining: probationToEdit ? probationToEdit.daysRemaining : 0, // will be computed in App state on save
      reviewFormStatus,
      userRecommendation,
      directorApproval,
      finalDecision: finalDecision || "-",
      newEmploymentStatus: newEmploymentStatus || "-",
      hrPic,
      notes,
      probationStatus,
      priority: probationToEdit ? probationToEdit.priority : "Low" // will be computed in App state on save
    };

    onSave(payload);
  };

  return (
    <div className="bg-white border border-slate-150 rounded-xl shadow-xs overflow-hidden animate-fade-in" id="probation-form-container">
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
            {isEditMode ? `Edit Probation - ${probationToEdit?.employeeName}` : "Register New Probation Evaluation"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isEditMode ? "Modify trial feedback, status, decisions, or manager reviews." : "Input new trial hire profile. Deadlines and priority alerts will auto-calculate."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8" id="probation-form-tag">
        {/* Error Block */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-rose-900">Missing Mandatory Fields</p>
              <p className="text-xs text-rose-700 mt-0.5">Please check and complete the highlighted inputs below.</p>
            </div>
          </div>
        )}

        {/* Section A: Employee Profile & Placement */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 font-mono border-b border-emerald-50 pb-2">
            A. Trial Employee Profile
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
                placeholder="e.g. Jane Doe"
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
              <input
                list="department-list"
                value={department}
                placeholder="Select or type department..."
                onChange={(e) => setDepartment(e.target.value)}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm bg-white transition outline-none ${
                  errors.department ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20" : "border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                }`}
              />
              <datalist id="department-list">
                {departments.map(dept => (
                  <option key={dept} value={dept} />
                ))}
              </datalist>
              {errors.department && <p className="text-xs text-rose-600 mt-1">{errors.department}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Job Position <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={position}
                placeholder="e.g. Junior Designer"
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
                list="manager-list"
                value={directManager}
                placeholder="Select or type direct manager..."
                onChange={(e) => setDirectManager(e.target.value)}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm bg-white transition outline-none ${
                  errors.directManager ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20" : "border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                }`}
              />
              <datalist id="manager-list">
                {directManagers.map(mgr => (
                  <option key={mgr} value={mgr} />
                ))}
              </datalist>
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
                {hrPics.map(pic => (
                  <option key={pic} value={pic}>{pic}</option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* Section B: Probation Dates & Evaluation State */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 font-mono border-b border-emerald-50 pb-2">
            B. Probation Dates & Appraisal Forms
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Probation Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={probationStartDate}
                onChange={(e) => setProbationStartDate(e.target.value)}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm font-mono transition outline-none bg-white ${
                  errors.probationStartDate ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20" : "border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                }`}
              />
              {errors.probationStartDate && <p className="text-xs text-rose-600 mt-1">{errors.probationStartDate}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Probation End Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={probationEndDate}
                onChange={(e) => setProbationEndDate(e.target.value)}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm font-mono transition outline-none bg-white ${
                  errors.probationEndDate ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20" : "border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                }`}
              />
              {errors.probationEndDate && <p className="text-xs text-rose-600 mt-1">{errors.probationEndDate}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Review Form Status <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={reviewFormStatus}
                placeholder="e.g. Sent to User, Completed, Not Sent"
                onChange={(e) => setReviewFormStatus(e.target.value)}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm transition outline-none bg-white ${
                  errors.reviewFormStatus ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20" : "border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                }`}
              />
              {errors.reviewFormStatus && <p className="text-xs text-rose-600 mt-1">{errors.reviewFormStatus}</p>}
            </div>

          </div>
        </div>

        {/* Section C: Recommendations & Decision Tracker */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 font-mono border-b border-emerald-50 pb-2">
            C. Recommendations & Final Decision
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
                Director Sign-Off
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
                Final Decision / Outcome
              </label>
              <input
                type="text"
                value={finalDecision}
                placeholder="e.g. Passed, Failed, Extended"
                onChange={(e) => setFinalDecision(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                New Employment Status
              </label>
              <input
                type="text"
                value={newEmploymentStatus}
                placeholder="e.g. Permanent Employee, Terminated"
                onChange={(e) => setNewEmploymentStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none"
              />
            </div>

          </div>
        </div>

        {/* Section D: Status Configuration */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 font-mono border-b border-emerald-50 pb-2">
            D. Workflow State
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Probation Workflow Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={probationStatus}
                onChange={(e) => setProbationStatus(e.target.value as ProbationStatus)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none text-emerald-700 font-semibold"
              >
                {Object.values(ProbationStatus).map(val => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section E: Operational Notes */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 font-mono border-b border-emerald-50 pb-2">
            E. Evaluation Notes
          </h3>
          <div>
            <textarea
              rows={4}
              value={notes}
              placeholder="Enter special details regarding the probation period performance, feedback summary, training outcomes, or extension agreements..."
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
            id="save-probation-submit-btn"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition shadow-md cursor-pointer"
          >
            <Save className="h-4 w-4" />
            {isEditMode ? "Save Changes" : "Create Evaluation"}
          </button>
        </div>

      </form>
    </div>
  );
};
