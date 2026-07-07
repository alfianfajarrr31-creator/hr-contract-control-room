import React, { useState, useEffect } from "react";
import { 
  ProbationItem, 
  ProbationStatus, 
  PriorityType, 
  UserRecommendation, 
  ApprovalStatus,
  ContractItem,
  ContractStatus,
  isContractNumberExists,
  getNextContractSequence
} from "../types";
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  AlertCircle, 
  ArrowUpDown,
  RefreshCw,
  CheckCircle,
  HelpCircle,
  Clock,
  X,
  Info
} from "lucide-react";
import { DEPARTMENTS } from "../seedData";

interface ProbationTrackerViewProps {
  probations: ProbationItem[];
  contracts: ContractItem[];
  hrPics: string[];
  departments: string[];
  directManagers: string[];
  onAddProbation: () => void;
  onEditProbation: (probation: ProbationItem) => void;
  onDeleteProbation: (id: string) => void;
  onExportCSV: (items: ProbationItem[]) => void;
  onConvertProbationToContract: (newContract: ContractItem, updatedProbation: ProbationItem) => void;
  onUpdateProbation?: (probation: ProbationItem) => void;
}

export const ProbationTrackerView: React.FC<ProbationTrackerViewProps> = ({
  probations,
  contracts,
  hrPics,
  departments,
  directManagers,
  onAddProbation,
  onEditProbation,
  onDeleteProbation,
  onExportCSV,
  onConvertProbationToContract,
  onUpdateProbation
}) => {
  // Filters & State
  const [searchTerm, setSearchTerm] = useState("");

  // Conversion state (ARC 3.3)
  const [conversionProbation, setConversionProbation] = useState<ProbationItem | null>(null);
  const [convDept, setConvDept] = useState("");
  const [convPos, setConvPos] = useState("");
  const [convMgr, setConvMgr] = useState("");
  const [convContractType, setConvContractType] = useState("PKWT");
  const [convContractNum, setConvContractNum] = useState("");
  const [convStartDate, setConvStartDate] = useState("");
  const [convDuration, setConvDuration] = useState("12 months");
  const [convEndDate, setConvEndDate] = useState("");
  const [convHrPic, setConvHrPic] = useState("");
  const [convNotes, setConvNotes] = useState("Converted from probation record. Awaiting contract drafting.");
  const [convErrors, setConvErrors] = useState<Record<string, string>>({});

  // Toast state for conversion contract number auto-generation (ARC 3.5)
  const [convToastMessage, setConvToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (convToastMessage) {
      const timer = setTimeout(() => setConvToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [convToastMessage]);

  const handleAutoGenerateConvNumber = () => {
    if (convContractNum.trim()) {
      const confirmReplace = window.confirm("Nomor kontrak sudah terisi. Ganti dengan nomor urut terbaru?");
      if (!confirmReplace) return;
    }
    const nextSeq = getNextContractSequence(contracts);
    setConvContractNum(nextSeq);
    setConvToastMessage(`Generated contract number: ${nextSeq}`);
  };

  const calculateEndDate = (start: string, duration: string): string => {
    if (!start) return "";
    const d = new Date(start);
    if (isNaN(d.getTime())) return "";
    
    if (duration === "3 months") {
      d.setMonth(d.getMonth() + 3);
      d.setDate(d.getDate() - 1);
    } else if (duration === "6 months") {
      d.setMonth(d.getMonth() + 6);
      d.setDate(d.getDate() - 1);
    } else if (duration === "12 months") {
      d.setMonth(d.getMonth() + 12);
      d.setDate(d.getDate() - 1);
    } else {
      return "";
    }
    
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const startConversion = (p: ProbationItem) => {
    setConversionProbation(p);
    setConvDept(p.department);
    setConvPos(p.position);
    setConvMgr(p.directManager);
    setConvContractType("PKWT");
    
    // contractStartDate = 1 day after probationEndDate
    let defaultStart = "";
    if (p.probationEndDate) {
      const d = new Date(p.probationEndDate);
      d.setDate(d.getDate() + 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      defaultStart = `${y}-${m}-${day}`;
    }
    setConvStartDate(defaultStart);
    setConvDuration("12 months");
    
    // Auto calculate End Date based on Default Start + 12 months duration
    const end = calculateEndDate(defaultStart, "12 months");
    setConvEndDate(end);
    
    // contract number is empty initially on open
    setConvContractNum("");
    
    setConvHrPic(p.hrPic || hrPics[0] || "HR Team");
    setConvNotes("Converted from probation record. Awaiting contract drafting.");
    setConvErrors({});
  };

  const handleDurationChange = (duration: string, start: string = convStartDate) => {
    setConvDuration(duration);
    if (duration !== "Custom") {
      const computedEnd = calculateEndDate(start, duration);
      setConvEndDate(computedEnd);
    }
  };

  const handleStartDateChange = (start: string) => {
    setConvStartDate(start);
    if (convDuration !== "Custom") {
      const computedEnd = calculateEndDate(start, convDuration);
      setConvEndDate(computedEnd);
    }
  };

  const handleConvertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversionProbation) return;

    // Duplicate prevention check
    const alreadyLinked = conversionProbation.linkedContractId;
    const hasContractWithSameSource = contracts?.some(c => c.sourceProbationId === conversionProbation.id);

    if (alreadyLinked || hasContractWithSameSource) {
      alert(`Conflict Detected! A contract record has already been created/linked for ${conversionProbation.employeeName}. Conversion aborted to prevent duplicates.`);
      setConversionProbation(null);
      return;
    }

    const errors: Record<string, string> = {};
    if (!convDept.trim()) errors.dept = "Department is required";
    if (!convPos.trim()) errors.position = "Position is required";
    if (!convMgr.trim()) errors.manager = "Direct Manager is required";
    if (!convContractType.trim()) errors.contractType = "Contract Type is required";
    if (!convStartDate) errors.startDate = "Start Date is required";
    if (!convEndDate) errors.endDate = "End Date is required";
    if (!convHrPic.trim()) errors.hrPic = "HR PIC is required";

    // Duplicate Contract Number prevention
    const normNum = convContractNum.trim().toLowerCase();
    if (normNum) {
      const isDuplicate = contracts?.some(c => 
        c.contractNumber && 
        c.contractNumber.trim().toLowerCase() === normNum
      );
      if (isDuplicate) {
        errors.contractNum = "Nomor kontrak ini sudah digunakan. Silakan generate nomor baru atau edit manual.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setConvErrors(errors);
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Generate a truly unique Contract ID (duplicate prevention)
    let newContractId = `CONV-${conversionProbation.employeeId || "EMP"}-${Date.now()}`;
    let counter = 1;
    while (contracts?.some(c => c.id === newContractId)) {
      newContractId = `CONV-${conversionProbation.employeeId || "EMP"}-${Date.now()}-${counter}`;
      counter++;
    }

    // Create the new contract item
    const newContract: ContractItem = {
      id: newContractId,
      employeeId: conversionProbation.employeeId || `EMP-${Math.floor(100 + Math.random() * 900)}`,
      employeeName: conversionProbation.employeeName,
      department: convDept,
      position: convPos,
      directManager: convMgr,
      contractType: convContractType,
      contractNumber: convContractNum.trim(),
      contractStartDate: convStartDate,
      contractEndDate: convEndDate,
      daysRemaining: 0, // App sync will recalculate this
      compensationReviewNeeded: false,
      negotiationStatus: "No Negotiation",
      negotiationNotes: "",
      payrollFollowUpNotes: "",
      userRecommendation: UserRecommendation.PassProbation,
      directorApproval: conversionProbation.directorApproval === ApprovalStatus.Approved ? ApprovalStatus.Approved : ApprovalStatus.Pending,
      headHRReview: ApprovalStatus.Pending,
      contractDraftDate: todayStr,
      contractSentDate: "",
      signedDeadline: "",
      signedReceivedDate: "",
      contractStatus: ContractStatus.ContractDrafting,
      salaryNegotiationStatus: "No Negotiation" as any,
      hrPic: convHrPic,
      notes: convNotes,
      priority: "Low", // App sync will recalculate this
      sourceProbationId: conversionProbation.id,
      createdFrom: "probation-conversion"
    };

    // Update the probation record
    const updatedProbation: ProbationItem = {
      ...conversionProbation,
      probationStatus: ProbationStatus.ConvertedToContract,
      finalDecision: "Converted to Contract",
      newEmploymentStatus: "Contract",
      linkedContractId: newContractId,
      notes: `${conversionProbation.notes || ""}\n[System Note: Converted to Contract on ${todayStr}. Contract record created.]`.trim()
    };

    onConvertProbationToContract(newContract, updatedProbation);
    setConversionProbation(null);
    alert(`Success! ${conversionProbation.employeeName} has been converted to Contract tracker.`);
  };
  const [selectedDept, setSelectedDept] = useState("All Departments");
  const [selectedManager, setSelectedManager] = useState("All Direct Managers");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  const [selectedPriority, setSelectedPriority] = useState("All Priorities");
  const [selectedPIC, setSelectedPIC] = useState("All HR PICs");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Dropdown options
  const allStatuses = ["All Statuses", ...Object.values(ProbationStatus)];
  const allPriorities = ["All Priorities", "Low", "Medium", "High", "Critical", "Overdue"];

  // Toggle expanded state
  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter & Sort
  const filteredProbations = probations.filter(p => {
    const matchesSearch = p.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = selectedDept === "All Departments" || p.department === selectedDept;
    const matchesManager = selectedManager === "All Direct Managers" || p.directManager === selectedManager;
    const matchesStatus = selectedStatus === "All Statuses" || p.probationStatus === selectedStatus;
    const matchesPriority = selectedPriority === "All Priorities" || p.priority === selectedPriority;
    const matchesPIC = selectedPIC === "All HR PICs" || p.hrPic === selectedPIC;

    return matchesSearch && matchesDept && matchesManager && matchesStatus && matchesPriority && matchesPIC;
  }).sort((a, b) => {
    const dateA = new Date(a.probationEndDate).getTime();
    const dateB = new Date(b.probationEndDate).getTime();
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedDept("All Departments");
    setSelectedManager("All Direct Managers");
    setSelectedStatus("All Statuses");
    setSelectedPriority("All Priorities");
    setSelectedPIC("All HR PICs");
  };

  // Badge helpers
  const getPriorityBadgeClass = (priority: PriorityType) => {
    switch (priority) {
      case "Overdue":
        return "bg-rose-100 text-rose-800 border border-rose-200 animate-pulse font-bold";
      case "Critical":
        return "bg-amber-100 text-amber-800 border border-amber-200 font-bold";
      case "High":
        return "bg-orange-50 text-orange-700 border border-orange-100 font-semibold";
      case "Medium":
        return "bg-blue-50 text-blue-700 border border-blue-100 font-medium";
      default:
        return "bg-slate-50 text-slate-600 border border-slate-100";
    }
  };

  const getStatusBadgeClass = (status: ProbationStatus) => {
    switch (status) {
      case ProbationStatus.ActiveProbation:
        return "bg-emerald-50 text-emerald-700 border border-emerald-150";
      case ProbationStatus.PassedProbation:
      case ProbationStatus.ConvertedToPermanent:
        return "bg-teal-50 text-teal-700 border border-teal-150";
      case ProbationStatus.FailedProbation:
        return "bg-rose-50 text-rose-700 border border-rose-150";
      case ProbationStatus.Critical:
      case ProbationStatus.Overdue:
        return "bg-red-50 text-red-700 border border-red-150 font-bold";
      case ProbationStatus.WaitingDirectorApproval:
      case ProbationStatus.WaitingReviewForm:
      case ProbationStatus.WaitingUserRecommendation:
        return "bg-amber-50 text-amber-700 border border-amber-150";
      default:
        return "bg-indigo-50 text-indigo-700 border border-indigo-150";
    }
  };

  const getApprovalBadgeClass = (appStatus: ApprovalStatus) => {
    switch (appStatus) {
      case ApprovalStatus.Approved:
        return "bg-emerald-50 text-emerald-700 border border-emerald-100";
      case ApprovalStatus.Rejected:
        return "bg-rose-50 text-rose-700 border border-rose-100";
      case ApprovalStatus.RevisionNeeded:
        return "bg-amber-50 text-amber-700 border border-amber-100";
      case ApprovalStatus.Pending:
        return "bg-slate-100 text-slate-700 border border-slate-200";
      default:
        return "text-slate-400";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="probation-tracker-view">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-5 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Probation Control Tracker</h1>
          <p className="text-slate-500 mt-1">Manage, filter, and monitor active or maturing 3-month trial/probation staff.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            id="export-probations-btn"
            onClick={() => onExportCSV(filteredProbations)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-sm font-medium transition shadow-xs"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Export CSV ({filteredProbations.length})
          </button>
          <button
            id="add-probation-btn"
            onClick={onAddProbation}
            className="inline-flex items-center gap-2 px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition shadow-md"
          >
            <Plus className="h-4 w-4" />
            Add Probation
          </button>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm font-display">
            <Filter className="h-4 w-4 text-slate-500" />
            Filters & Search
          </h3>
          {(searchTerm || selectedDept !== "All Departments" || selectedManager !== "All Direct Managers" || selectedStatus !== "All Statuses" || selectedPriority !== "All Priorities" || selectedPIC !== "All HR PICs") && (
            <button
              onClick={resetFilters}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search bar */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="ID, Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition outline-none"
              />
            </div>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition outline-none"
            >
              <option value="All Departments">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Direct Manager Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Direct Manager</label>
            <select
              value={selectedManager}
              onChange={(e) => setSelectedManager(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition outline-none"
            >
              <option value="All Direct Managers">All Direct Managers</option>
              {directManagers.map(mgr => (
                <option key={mgr} value={mgr}>{mgr}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Probation Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition outline-none"
            >
              {allStatuses.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">SLA Priority</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition outline-none"
            >
              {allPriorities.map(pr => (
                <option key={pr} value={pr}>{pr === "All Priorities" ? pr : `${pr} SLA`}</option>
              ))}
            </select>
          </div>

          {/* HR PIC Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">HR PIC</label>
            <select
              value={selectedPIC}
              onChange={(e) => setSelectedPIC(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition outline-none"
            >
              {["All HR PICs", ...hrPics].map(pic => (
                <option key={pic} value={pic}>{pic}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-150 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="probation-main-table">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-xs font-medium font-mono uppercase bg-slate-50/50">
                <th className="px-6 py-3 w-10 text-center">Detail</th>
                <th className="px-6 py-3">Employee ID</th>
                <th className="px-6 py-3">Employee Name</th>
                <th className="px-6 py-3">Dept / Position</th>
                <th className="px-6 py-3">Direct Manager</th>
                <th 
                  className="px-6 py-3 cursor-pointer hover:bg-slate-100 hover:text-slate-700 transition"
                  onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                >
                  <div className="flex items-center gap-1.5 justify-end">
                    Days Remaining
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Priority</th>
                <th className="px-6 py-3">HR PIC</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredProbations.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                    <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-600">No probation records found</p>
                    <p className="text-xs mt-0.5 text-slate-400">Try adjusting your filters or add a new probation record.</p>
                  </td>
                </tr>
              ) : (
                filteredProbations.map((p) => {
                  const isExpanded = !!expandedRows[p.id];
                  return (
                    <React.Fragment key={p.id}>
                      {/* Main Row */}
                      <tr className={`hover:bg-slate-50/50 transition ${isExpanded ? "bg-slate-50/20" : ""}`}>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => toggleRow(p.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition cursor-pointer"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 font-mono font-medium text-slate-500 text-xs">
                          {p.employeeId}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {p.employeeName}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-700">{p.department}</div>
                          <div className="text-slate-400 text-xs mt-0.5">{p.position}</div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-600">
                          {p.directManager}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-semibold">
                          {p.daysRemaining < 0 ? (
                            <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                              {Math.abs(p.daysRemaining)} Days ago
                            </span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded border ${
                              p.daysRemaining <= 6 
                                ? "text-amber-700 bg-amber-50 border-amber-200" 
                                : p.daysRemaining <= 20
                                ? "text-orange-700 bg-orange-50 border-orange-150"
                                : "text-slate-700 bg-slate-50 border-slate-100"
                            }`}>
                              {p.daysRemaining} Days left
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(p.probationStatus)}`}>
                            {p.probationStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase font-mono ${getPriorityBadgeClass(p.priority)}`}>
                            {p.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium">
                          {p.hrPic}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onEditProbation(p)}
                              className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition cursor-pointer"
                              title="Edit Probation"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete probation record for ${p.employeeName}?`)) {
                                  onDeleteProbation(p.id);
                                }
                              }}
                              className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                              title="Delete Probation"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable details panel */}
                      {isExpanded && (
                        <tr className="bg-slate-50/40">
                          <td colSpan={10} className="px-8 py-5 border-t border-b border-slate-100">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
                              
                              {/* Dates Section */}
                              <div className="space-y-2 border-r border-slate-100 pr-4">
                                <h4 className="font-semibold text-slate-800 font-display flex items-center gap-1.5 border-b border-slate-100 pb-1.5 mb-2 uppercase text-xs tracking-wider">
                                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                  Probation Timeline
                                </h4>
                                <div className="flex justify-between">
                                  <span className="text-slate-400 text-xs">Start Date:</span>
                                  <span className="font-mono text-slate-700 font-medium">{p.probationStartDate || "-"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400 text-xs">End Date:</span>
                                  <span className="font-mono text-slate-700 font-semibold">{p.probationEndDate || "-"}</span>
                                </div>
                                <div className="flex justify-between pt-1 border-t border-slate-100">
                                  <span className="text-slate-400 text-xs">Days Remaining:</span>
                                  <span className="font-mono text-slate-800 font-bold">{p.daysRemaining} Days</span>
                                </div>
                              </div>

                              {/* Form Status & Review Info */}
                              <div className="space-y-2 border-r border-slate-100 pr-4">
                                <h4 className="font-semibold text-slate-800 font-display flex items-center gap-1.5 border-b border-slate-100 pb-1.5 mb-2 uppercase text-xs tracking-wider">
                                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                                  Evaluation & Feedback
                                </h4>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-400 text-xs">Form Status:</span>
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium font-mono ${
                                    p.reviewFormStatus === "Completed" 
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                                      : "bg-amber-50 text-amber-700 border border-amber-100"
                                  }`}>
                                    {p.reviewFormStatus || "Not Sent"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400 text-xs">User Recommendation:</span>
                                  <span className="font-semibold text-slate-700">{p.userRecommendation || "None"}</span>
                                </div>
                              </div>

                              {/* Final Decision & Employment Status */}
                              <div className="space-y-2 border-r border-slate-100 pr-4">
                                <h4 className="font-semibold text-slate-800 font-display flex items-center gap-1.5 border-b border-slate-100 pb-1.5 mb-2 uppercase text-xs tracking-wider">
                                  <CheckCircle className="h-3.5 w-3.5 text-slate-400" />
                                  Decision Control
                                </h4>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-400 text-xs">Director Sign-Off:</span>
                                  <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-semibold border ${getApprovalBadgeClass(p.directorApproval)}`}>
                                    {p.directorApproval}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400 text-xs">Final Decision:</span>
                                  <span className="font-bold text-slate-800">{p.finalDecision || "-"}</span>
                                </div>
                                <div className="flex justify-between pt-1 border-t border-slate-100">
                                  <span className="text-slate-400 text-xs">New Contract Status:</span>
                                  <span className="font-semibold text-indigo-700">{p.newEmploymentStatus || "-"}</span>
                                </div>
                                {p.linkedContractId ? (
                                  <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5">
                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold block">Linked Contract</span>
                                    {(() => {
                                      const linkedContract = contracts?.find(c => c.id === p.linkedContractId);
                                      return (
                                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-50 border border-indigo-150 text-indigo-800 text-xs font-semibold">
                                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse shrink-0"></span>
                                          <span>Contract Created ({linkedContract?.contractStatus || "Drafting"})</span>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                ) : (
                                  (p.finalDecision === "Passed Probation" ||
                                   p.finalDecision === "Converted to Contract" ||
                                   p.newEmploymentStatus === "Contract" ||
                                   p.probationStatus === ProbationStatus.PassedProbation ||
                                   p.probationStatus === ProbationStatus.ConvertedToContract) && (
                                    <div className="mt-3">
                                      <button
                                        onClick={() => startConversion(p)}
                                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer"
                                      >
                                        <RefreshCw className="h-3 w-3 animate-spin" style={{ animationDuration: '3s' }} />
                                        Convert to Contract
                                      </button>
                                    </div>
                                  )
                                )}
                              </div>

                              {/* Notes */}
                              <div className="space-y-2">
                                <h4 className="font-semibold text-slate-800 font-display flex items-center gap-1.5 border-b border-slate-100 pb-1.5 mb-2 uppercase text-xs tracking-wider">
                                  <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
                                  HR Notes
                                </h4>
                                <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-xs text-slate-600 h-24 overflow-y-auto font-mono">
                                  {p.notes || "No special evaluation notes added for this probation record yet."}
                                </div>
                              </div>

                              {/* Exit Process Flow (ARC 3.8) */}
                              {((p.exitProcessStatus && p.exitProcessStatus !== "Not Started") || ["Resigned", "Not Continued", "Failed Probation", "End Process", "Exit Process", "Closed"].includes(p.probationStatus)) && (
                                <div className="col-span-1 md:col-span-4 mt-4 p-4 bg-emerald-50/20 border border-emerald-100 rounded-xl space-y-3">
                                  <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                                    <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 font-sans">
                                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                                      Exit Process & Clearance Tracking
                                    </h5>
                                    <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-emerald-150 text-emerald-700 rounded-lg shadow-2xs">
                                      Exit Status: {p.exitProcessStatus || "Not Started"}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                    <div>
                                      <span className="text-slate-400 block mb-0.5">End Reason:</span>
                                      <span className="font-semibold text-slate-700">{p.endReason || "-"}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block mb-0.5">Notice Date:</span>
                                      <span className="font-mono text-slate-700">{p.noticeDate || "-"}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block mb-0.5">Last Working Date:</span>
                                      <span className="font-mono text-rose-600 font-bold">{p.lastWorkingDate || "-"}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block mb-0.5">Closed Date:</span>
                                      <span className="font-mono text-slate-700">{p.closedDate || "-"}</span>
                                    </div>

                                    <div>
                                      <span className="text-slate-400 block mb-0.5">Form Akses & Asset:</span>
                                      <div className="space-y-0.5">
                                        <div className="text-[10px] text-slate-500 font-mono">Sent: {p.accessAssetFormSentDate || "-"}</div>
                                        <div className="text-[10px] text-emerald-600 font-mono font-semibold">Done: {p.accessAssetFormCompletedDate || "-"}</div>
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block mb-0.5">Form Exit Clearance:</span>
                                      <div className="space-y-0.5">
                                        <div className="text-[10px] text-slate-500 font-mono">Sent: {p.exitClearanceFormSentDate || "-"}</div>
                                        <div className="text-[10px] text-emerald-600 font-mono font-semibold">Done: {p.exitClearanceCompletedDate || "-"}</div>
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block mb-0.5">Form Exit Interview (Private):</span>
                                      <div className="space-y-0.5">
                                        <div className="text-[10px] text-slate-500 font-mono">Sent: {p.exitInterviewFormSentDate || "-"}</div>
                                        <div className="text-[10px] font-semibold text-emerald-700">Status: {p.exitInterviewStatus || "Not Sent"}</div>
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block mb-0.5">Akses & Asset Details:</span>
                                      <div className="space-y-0.5 text-[11px]">
                                        <div><span className="text-slate-500">Akses Closure:</span> <span className="font-semibold text-slate-700">{p.accessClosureStatus || "Not Started"}</span></div>
                                        <div><span className="text-slate-500">Asset Return:</span> <span className="font-semibold text-slate-700">{p.assetReturnStatus || "Not Started"} {p.assetReturnRequired && `(${p.assetReturnRequired})`}</span></div>
                                      </div>
                                    </div>
                                  </div>
                                  {p.exitNotes && (
                                    <div className="bg-white border border-slate-150 p-2.5 rounded-lg text-xs text-slate-600 font-mono mt-2">
                                      <span className="text-slate-400 font-sans font-semibold block text-[10px] uppercase mb-1">Exit Process Notes:</span>
                                      {p.exitNotes}
                                    </div>
                                  )}

                                  {/* Quick Actions for Offboarding */}
                                  <div className="mt-4 pt-3 border-t border-emerald-100/50">
                                    <span className="text-slate-500 text-xs font-semibold block mb-2 uppercase font-sans tracking-wide">Update Offboarding State (Quick Actions):</span>
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        onClick={() => {
                                          const today = new Date().toISOString().slice(0, 10);
                                          let deadline = "";
                                          if (p.lastWorkingDate) {
                                            const lDate = new Date(p.lastWorkingDate);
                                            lDate.setDate(lDate.getDate() - 2);
                                            deadline = lDate.toISOString().slice(0, 10);
                                          }
                                          onUpdateProbation?.({
                                            ...p,
                                            exitDocumentsSentDate: today,
                                            accessAssetFormSentDate: today,
                                            exitClearanceFormSentDate: today,
                                            exitInterviewFormSentDate: today,
                                            exitProcessStatus: "Exit Documents Sent",
                                            accessAssetFormStatus: "Pending",
                                            exitClearanceFormStatus: "Pending",
                                            exitInterviewFormStatus: "Sent",
                                            exitDocumentsReturnDeadline: deadline
                                          });
                                        }}
                                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition shadow-xs cursor-pointer"
                                      >
                                        Mark Exit Docs Sent
                                      </button>

                                      <button
                                        onClick={() => {
                                          const today = new Date().toISOString().slice(0, 10);
                                          onUpdateProbation?.({
                                            ...p,
                                            accessAssetFormCompletedDate: today,
                                            accessAssetFormStatus: "Completed",
                                            exitProcessStatus: "Access & Asset Form Completed"
                                          });
                                        }}
                                        className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 transition shadow-xs cursor-pointer"
                                      >
                                        Mark Access & Asset Done
                                      </button>

                                      <button
                                        onClick={() => {
                                          const today = new Date().toISOString().slice(0, 10);
                                          onUpdateProbation?.({
                                            ...p,
                                            exitClearanceCompletedDate: today,
                                            exitClearanceFormStatus: "Completed",
                                            exitProcessStatus: "Exit Clearance Completed"
                                          });
                                        }}
                                        className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 transition shadow-xs cursor-pointer"
                                      >
                                        Mark Exit Clearance Done
                                      </button>

                                      <button
                                        onClick={() => {
                                          const today = new Date().toISOString().slice(0, 10);
                                          onUpdateProbation?.({
                                            ...p,
                                            exitInterviewCompletedDate: today,
                                            exitInterviewFormStatus: "Completed",
                                            exitInterviewStatus: "Completed",
                                            exitProcessStatus: "Exit Interview Completed"
                                          });
                                        }}
                                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition shadow-xs cursor-pointer"
                                      >
                                        Mark Interview Done
                                      </button>

                                      <button
                                        onClick={() => {
                                          const today = new Date().toISOString().slice(0, 10);
                                          onUpdateProbation?.({
                                            ...p,
                                            exitInterviewCompletedDate: today,
                                            exitInterviewFormStatus: "Declined",
                                            exitInterviewStatus: "Declined",
                                            exitProcessStatus: "Exit Interview Completed"
                                          });
                                        }}
                                        className="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-xs font-semibold hover:bg-rose-600 transition shadow-xs cursor-pointer"
                                      >
                                        Mark Interview Declined
                                      </button>

                                      <button
                                        onClick={() => {
                                          const today = new Date().toISOString().slice(0, 10);
                                          onUpdateProbation?.({
                                            ...p,
                                            exitClosedDate: today,
                                            exitProcessStatus: "Closed"
                                          });
                                        }}
                                        className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-950 transition shadow-xs cursor-pointer"
                                      >
                                        Mark Closed
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Conversion Modal (ARC 3.3) */}
      {conversionProbation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="conversion-modal">
          <div className="bg-white rounded-2xl border border-slate-150 shadow-2xl max-w-xl w-full overflow-hidden transform transition-all">
            {/* Modal Header */}
            <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                  CONV
                </div>
                <div>
                  <h3 className="font-semibold text-sm tracking-wide font-display">Convert Probation to PKWT Contract</h3>
                  <p className="text-[10px] text-slate-400 font-mono">ARC 3.3 Flow Engine</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setConversionProbation(null)}
                className="text-slate-400 hover:text-white transition p-1 hover:bg-slate-800 rounded-lg cursor-pointer animate-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConvertSubmit} className="p-6 space-y-4">
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5 text-xs text-indigo-950 flex gap-2.5">
                <Info className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Converting {conversionProbation.employeeName}</span>
                  <p className="text-slate-500 mt-0.5 leading-normal">
                    This will automatically create a new PKWT record in the Contracts tracker and flag this probation record as converted.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto px-1">
                {/* Employee Name */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 font-mono">Employee Name (Read-Only)</label>
                  <input
                    type="text"
                    value={conversionProbation.employeeName}
                    readOnly
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg text-sm font-semibold outline-none"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 font-mono">Department</label>
                  <input
                    list="conv-department-list"
                    value={convDept}
                    onChange={(e) => setConvDept(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none ${
                      convErrors.dept ? "border-rose-400" : "border-slate-200"
                    }`}
                  />
                  <datalist id="conv-department-list">
                    {departments.map(dept => (
                      <option key={dept} value={dept} />
                    ))}
                  </datalist>
                  {convErrors.dept && <p className="text-rose-500 text-[10px] mt-0.5">{convErrors.dept}</p>}
                </div>

                {/* Position */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 font-mono">Position</label>
                  <input
                    type="text"
                    value={convPos}
                    onChange={(e) => setConvPos(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-sm bg-slate-50/20 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none ${
                      convErrors.position ? "border-rose-400" : "border-slate-200"
                    }`}
                  />
                  {convErrors.position && <p className="text-rose-500 text-[10px] mt-0.5">{convErrors.position}</p>}
                </div>

                {/* Direct Manager */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 font-mono">Direct Manager</label>
                  <input
                    list="conv-manager-list"
                    value={convMgr}
                    onChange={(e) => setConvMgr(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none ${
                      convErrors.manager ? "border-rose-400" : "border-slate-200"
                    }`}
                  />
                  <datalist id="conv-manager-list">
                    {directManagers.map(mgr => (
                      <option key={mgr} value={mgr} />
                    ))}
                  </datalist>
                  {convErrors.manager && <p className="text-rose-500 text-[10px] mt-0.5">{convErrors.manager}</p>}
                </div>

                {/* HR PIC */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 font-mono">HR PIC</label>
                  <select
                    value={convHrPic}
                    onChange={(e) => setConvHrPic(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/20 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none"
                  >
                    {hrPics.map(pic => (
                      <option key={pic} value={pic}>{pic}</option>
                    ))}
                  </select>
                </div>

                {/* Contract Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 font-mono">Contract Type</label>
                  <input
                    type="text"
                    value={convContractType}
                    onChange={(e) => setConvContractType(e.target.value)}
                    placeholder="e.g. PKWT"
                    className={`w-full px-3 py-2 border rounded-lg text-sm bg-slate-50/20 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none ${
                      convErrors.contractType ? "border-rose-400" : "border-slate-200"
                    }`}
                  />
                  {convErrors.contractType && <p className="text-rose-500 text-[10px] mt-0.5">{convErrors.contractType}</p>}
                </div>

                {/* Contract Number */}
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 font-mono flex justify-between items-center">
                    <span>Contract Number</span>
                    {convContractNum.trim() && isContractNumberExists(contracts, convContractNum) && (
                      <span className="text-[10px] text-amber-600 font-medium normal-case">⚠️ Already in use</span>
                    )}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={convContractNum}
                      onChange={(e) => setConvContractNum(e.target.value)}
                      placeholder="e.g. 001"
                      className={`flex-1 px-3 py-2 border rounded-lg text-sm bg-slate-50/20 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none font-mono ${
                        convErrors.contractNum ? "border-rose-400" : "border-slate-200"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleAutoGenerateConvNumber}
                      className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 hover:border-indigo-300 rounded-lg text-xs font-semibold cursor-pointer transition shrink-0"
                    >
                      Auto Generate Nomor Urut
                    </button>
                  </div>
                  {convToastMessage && (
                    <p className="text-[10px] text-indigo-600 font-medium mt-1">✓ {convToastMessage}</p>
                  )}
                  {convErrors.contractNum && (
                    <p className="text-rose-500 text-[10px] mt-0.5 font-sans leading-normal">{convErrors.contractNum}</p>
                  )}
                </div>

                {/* Contract Start Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 font-mono">Contract Start Date</label>
                  <input
                    type="date"
                    value={convStartDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-sm bg-slate-50/20 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none font-mono ${
                      convErrors.startDate ? "border-rose-400" : "border-slate-200"
                    }`}
                  />
                  {convErrors.startDate && <p className="text-rose-500 text-[10px] mt-0.5">{convErrors.startDate}</p>}
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 font-mono">Contract Duration</label>
                  <select
                    value={convDuration}
                    onChange={(e) => handleDurationChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/20 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none"
                  >
                    <option value="3 months">3 months</option>
                    <option value="6 months">6 months</option>
                    <option value="12 months">12 months</option>
                    <option value="Custom">Custom (Specify manual End Date)</option>
                  </select>
                </div>

                {/* Contract End Date */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 font-mono">Contract End Date</label>
                  <input
                    type="date"
                    value={convEndDate}
                    onChange={(e) => {
                      setConvEndDate(e.target.value);
                      setConvDuration("Custom");
                    }}
                    className={`w-full px-3 py-2 border rounded-lg text-sm bg-slate-50/20 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none font-mono ${
                      convErrors.endDate ? "border-rose-400" : "border-slate-200"
                    }`}
                  />
                  {convErrors.endDate && <p className="text-rose-500 text-[10px] mt-0.5">{convErrors.endDate}</p>}
                </div>

                {/* Notes */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 font-mono">Conversion Notes</label>
                  <textarea
                    rows={2}
                    value={convNotes}
                    onChange={(e) => setConvNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50/20 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none font-mono"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConversionProbation(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  Convert & Create Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
