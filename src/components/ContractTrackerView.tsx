import React, { useState } from "react";
import { 
  ContractItem, 
  ContractStatus, 
  PriorityType, 
  SalaryNegotiationStatus, 
  UserRecommendation, 
  ApprovalStatus 
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
  DollarSign, 
  AlertCircle, 
  ArrowUpDown,
  RefreshCw,
  MoreVertical,
  CheckCircle,
  XCircle,
  HelpCircle
} from "lucide-react";
import { DEPARTMENTS } from "../seedData";

interface ContractTrackerViewProps {
  contracts: ContractItem[];
  hrPics: string[];
  departments: string[];
  directManagers: string[];
  onAddContract: () => void;
  onEditContract: (contract: ContractItem) => void;
  onDeleteContract: (id: string) => void;
  onExportCSV: (items: ContractItem[]) => void;
  onUpdateContract?: (contract: ContractItem) => void;
  onViewExitProcess?: (employeeName: string) => void;
  initialSearchTerm?: string;
  onClearInitialSearch?: () => void;
  simulationDate?: string;
}

export const ContractTrackerView: React.FC<ContractTrackerViewProps> = ({
  contracts,
  hrPics,
  departments,
  directManagers,
  onAddContract,
  onEditContract,
  onDeleteContract,
  onExportCSV,
  onUpdateContract,
  onViewExitProcess,
  initialSearchTerm,
  onClearInitialSearch,
  simulationDate
}) => {
  // Filters & State
  const [searchTerm, setSearchTerm] = useState("");
  const [hideExitRecords, setHideExitRecords] = useState(true);

  React.useEffect(() => {
    if (initialSearchTerm) {
      setSearchTerm(initialSearchTerm);
      onClearInitialSearch?.();
    }
  }, [initialSearchTerm, onClearInitialSearch]);

  const [selectedDept, setSelectedDept] = useState("All Departments");
  const [selectedManager, setSelectedManager] = useState("All Direct Managers");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  const [selectedPriority, setSelectedPriority] = useState("All Priorities");
  const [selectedPIC, setSelectedPIC] = useState("All HR PICs");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Dropdown list generation
  const allStatuses = ["All Statuses", ...Object.values(ContractStatus)];
  const allPriorities = ["All Priorities", "Low", "Medium", "High", "Critical", "Overdue"];

  // Toggle expanded state
  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isExitRecord = (c: ContractItem) => {
    return (
      c.contractStatus === "Resigned" ||
      c.contractStatus === "Not Renewed" ||
      c.contractStatus === "Employee Declined" ||
      c.contractStatus === "End Process" ||
      c.contractStatus === "Exit Process" ||
      c.contractStatus === "Closed" ||
      (c.endReason !== undefined && c.endReason.trim() !== "") ||
      (c.exitProcessStatus !== undefined && c.exitProcessStatus.trim() !== "" && c.exitProcessStatus !== "Not Started")
    );
  };

  // Filter & Sort Logic
  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = selectedDept === "All Departments" || c.department === selectedDept;
    const matchesManager = selectedManager === "All Direct Managers" || c.directManager === selectedManager;
    const matchesStatus = selectedStatus === "All Statuses" || c.contractStatus === selectedStatus;
    const matchesPriority = selectedPriority === "All Priorities" || c.priority === selectedPriority;
    const matchesPIC = selectedPIC === "All HR PICs" || c.hrPic === selectedPIC;
    const matchesExitHide = !hideExitRecords || !isExitRecord(c);

    return matchesSearch && matchesDept && matchesManager && matchesStatus && matchesPriority && matchesPIC && matchesExitHide;
  }).sort((a, b) => {
    const dateA = new Date(a.contractEndDate).getTime();
    const dateB = new Date(b.contractEndDate).getTime();
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedDept("All Departments");
    setSelectedManager("All Direct Managers");
    setSelectedStatus("All Statuses");
    setSelectedPriority("All Priorities");
    setSelectedPIC("All HR PICs");
    setHideExitRecords(true);
  };

  // Helper formatting for currency
  const formatIDR = (num: number) => {
    if (!num) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num);
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

  const getStatusBadgeClass = (status: ContractStatus) => {
    switch (status) {
      case ContractStatus.Active:
        return "bg-emerald-50 text-emerald-700 border border-emerald-150";
      case ContractStatus.Completed:
      case ContractStatus.ConvertedToPermanent:
      case ContractStatus.SignedReceived:
        return "bg-teal-50 text-teal-700 border border-teal-150";
      case ContractStatus.Critical:
      case ContractStatus.Overdue:
        return "bg-red-50 text-red-700 border border-red-150 font-bold";
      case ContractStatus.WaitingDirectorApproval:
      case ContractStatus.WaitingHeadHRReview:
      case ContractStatus.WaitingUserReview:
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
    <div className="space-y-6 animate-fade-in" id="contract-tracker-view">
      {/* Top action header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-5 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Contract Control Tracker</h1>
          <p className="text-slate-500 mt-1">Manage, filter, and monitor active or maturing employment contracts.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            id="export-contracts-btn"
            onClick={() => onExportCSV(filteredContracts)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-sm font-medium transition shadow-xs"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Export CSV ({filteredContracts.length})
          </button>
          <button
            id="add-contract-btn"
            onClick={onAddContract}
            className="inline-flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition shadow-md"
          >
            <Plus className="h-4 w-4" />
            Add Contract
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
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
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none"
              />
            </div>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none"
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
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none"
            >
              <option value="All Direct Managers">All Direct Managers</option>
              {directManagers.map(mgr => (
                <option key={mgr} value={mgr}>{mgr}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Contract Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none"
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
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none"
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
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none"
            >
              {["All HR PICs", ...hrPics].map(pic => (
                <option key={pic} value={pic}>{pic}</option>
              ))}
            </select>
          </div>

          {/* Exit Process Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Exit Process Filter</label>
            <select
              value={hideExitRecords ? "true" : "false"}
              onChange={(e) => setHideExitRecords(e.target.value === "true")}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none"
            >
              <option value="true">Hide Exit Processes</option>
              <option value="false">Show All (Inc. Exits)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-150 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="contracts-main-table">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-xs font-medium font-mono uppercase bg-slate-50/50">
                <th className="px-6 py-3 w-10 text-center">Detail</th>
                <th className="px-6 py-3">Employee ID</th>
                <th className="px-6 py-3">Employee Name</th>
                <th className="px-6 py-3">Dept / Position</th>
                <th className="px-6 py-3">Type / Number</th>
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
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                    <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-600">No contracts found</p>
                    <p className="text-xs mt-0.5 text-slate-400">Try loosening your search filters or add a new contract.</p>
                  </td>
                </tr>
              ) : (
                filteredContracts.map((c) => {
                  const isExpanded = !!expandedRows[c.id];
                  return (
                    <React.Fragment key={c.id}>
                      {/* Main Row */}
                      <tr className={`hover:bg-slate-50/50 transition ${isExpanded ? "bg-slate-50/20" : ""}`}>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => toggleRow(c.id)}
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
                          {c.employeeId}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          <div>{c.employeeName}</div>
                          {isExitRecord(c) && (
                            <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-100 font-mono">
                              In Exit Tracker
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-700">{c.department}</div>
                          <div className="text-slate-400 text-xs mt-0.5">{c.position}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-700">{c.contractType}</div>
                          <div className="text-slate-400 text-xs mt-0.5 font-mono">{c.contractNumber}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-semibold">
                          {c.daysRemaining < 0 ? (
                            <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                              {Math.abs(c.daysRemaining)} Days ago
                            </span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded border ${
                              c.daysRemaining <= 3 
                                ? "text-amber-700 bg-amber-50 border-amber-200" 
                                : c.daysRemaining <= 14
                                ? "text-orange-700 bg-orange-50 border-orange-150"
                                : "text-slate-700 bg-slate-50 border-slate-100"
                            }`}>
                              {c.daysRemaining} Days left
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(c.contractStatus)}`}>
                            {c.contractStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase font-mono ${getPriorityBadgeClass(c.priority)}`}>
                            {c.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium">
                          {c.hrPic}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isExitRecord(c) && onViewExitProcess && (
                              <button
                                onClick={() => onViewExitProcess(c.employeeName)}
                                className="px-2.5 py-1 text-[10px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-200 transition cursor-pointer"
                                title="View Exit Process"
                              >
                                View Exit Process
                              </button>
                            )}
                            <button
                              onClick={() => onEditContract(c)}
                              className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition cursor-pointer"
                              title="Edit Contract"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete contract for ${c.employeeName}?`)) {
                                  onDeleteContract(c.id);
                                }
                              }}
                              className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                              title="Delete Contract"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Panel */}
                      {isExpanded && (
                        <tr className="bg-slate-50/40">
                          <td colSpan={10} className="px-8 py-5 border-t border-b border-slate-100">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
                              
                              {/* Dates and Deadlines Column */}
                              <div className="space-y-2 border-r border-slate-100 pr-4">
                                <h4 className="font-semibold text-slate-800 font-display flex items-center gap-1.5 border-b border-slate-100 pb-1.5 mb-2 uppercase text-xs tracking-wider">
                                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                  Timeline & Dates
                                </h4>
                                <div className="flex justify-between">
                                  <span className="text-slate-400 text-xs">Start Date:</span>
                                  <span className="font-mono text-slate-700 font-medium">{c.contractStartDate || "-"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400 text-xs">End Date:</span>
                                  <span className="font-mono text-slate-700 font-medium">{c.contractEndDate || "-"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400 text-xs">Drafting Date:</span>
                                  <span className="font-mono text-slate-700 font-medium">{c.contractDraftDate || "-"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400 text-xs">Contract Sent:</span>
                                  <span className="font-mono text-slate-700 font-medium">{c.contractSentDate || "-"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400 text-xs">Signed Deadline:</span>
                                  <span className="font-mono text-rose-600 font-semibold">{c.signedDeadline || "-"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400 text-xs">Signed Received:</span>
                                  <span className="font-mono text-emerald-600 font-semibold">{c.signedReceivedDate || "-"}</span>
                                </div>
                              </div>

                              {/* Compensation & Negotiation Column */}
                              <div className="space-y-2 border-r border-slate-100 pr-4">
                                <h4 className="font-semibold text-slate-800 font-display flex items-center gap-1.5 border-b border-slate-100 pb-1.5 mb-2 uppercase text-xs tracking-wider">
                                  <HelpCircle className="h-3.5 w-3.5 text-indigo-500" />
                                  Compensation Review
                                </h4>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-400 text-xs">Review Needed:</span>
                                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                    c.compensationReviewNeeded 
                                      ? "text-rose-700 bg-rose-50 border border-rose-100" 
                                      : "text-slate-500 bg-slate-50 border border-slate-100"
                                  }`}>
                                    {c.compensationReviewNeeded ? "Yes" : "No"}
                                  </span>
                                </div>
                                <div className="pt-1">
                                  <span className="text-slate-400 text-xs block mb-1">Negotiation Status:</span>
                                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold border ${
                                    c.salaryNegotiationStatus === SalaryNegotiationStatus.Resolved
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                      : c.salaryNegotiationStatus === SalaryNegotiationStatus.NoNegotiation
                                      ? "bg-slate-50 text-slate-500 border-slate-100"
                                      : "bg-indigo-50 text-indigo-700 border-indigo-100"
                                  }`}>
                                    {c.salaryNegotiationStatus}
                                  </span>
                                </div>
                                {c.negotiationNotes && (
                                  <div className="pt-1.5">
                                    <span className="text-slate-400 text-xs block">Negotiation Notes:</span>
                                    <p className="text-[11px] text-slate-600 line-clamp-2 italic">{c.negotiationNotes}</p>
                                  </div>
                                )}
                                {c.payrollFollowUpNotes && (
                                  <div className="pt-1 border-t border-slate-100 mt-1">
                                    <span className="text-slate-400 text-xs block">Payroll/Mgmt Notes:</span>
                                    <p className="text-[11px] text-slate-600 line-clamp-2 italic">{c.payrollFollowUpNotes}</p>
                                  </div>
                                )}
                              </div>

                              {/* Approval Tracking Column */}
                              <div className="space-y-2 border-r border-slate-100 pr-4">
                                <h4 className="font-semibold text-slate-800 font-display flex items-center gap-1.5 border-b border-slate-100 pb-1.5 mb-2 uppercase text-xs tracking-wider">
                                  <CheckCircle className="h-3.5 w-3.5 text-slate-400" />
                                  Approvals & Workflow
                                </h4>
                                <div className="flex justify-between">
                                  <span className="text-slate-400 text-xs">User Recommendation:</span>
                                  <span className="font-semibold text-slate-700">{c.userRecommendation}</span>
                                </div>
                                <div className="flex justify-between items-center pt-1">
                                  <span className="text-slate-400 text-xs">Director Sign-Off:</span>
                                  <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-semibold border ${getApprovalBadgeClass(c.directorApproval)}`}>
                                    {c.directorApproval}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center pt-1">
                                  <span className="text-slate-400 text-xs">Head HR Approval:</span>
                                  <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-semibold border ${getApprovalBadgeClass(c.headHRReview)}`}>
                                    {c.headHRReview}
                                  </span>
                                </div>
                                <div className="pt-2 border-t border-slate-100">
                                  <span className="text-slate-400 text-xs block mb-0.5">Direct Manager:</span>
                                  <span className="text-slate-700 font-medium text-xs">{c.directManager}</span>
                                </div>
                              </div>

                              {/* Operational Notes Column */}
                              <div className="space-y-2">
                                <h4 className="font-semibold text-slate-800 font-display flex items-center gap-1.5 border-b border-slate-100 pb-1.5 mb-2 uppercase text-xs tracking-wider">
                                  <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
                                  Operational Notes
                                </h4>
                                <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-xs text-slate-600 h-28 overflow-y-auto font-mono">
                                  {c.notes || "No special HR notes entered for this contract yet."}
                                </div>
                                {c.createdFrom === "probation-conversion" && (
                                  <div className="mt-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1.5 font-sans">
                                    <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                    <span>Converted from Probation record {c.sourceProbationId && `(ID: ${c.sourceProbationId})`}</span>
                                  </div>
                                )}
                              </div>

                              {/* Exit Process Flow (ARC 3.8) */}
                              {((c.exitProcessStatus && c.exitProcessStatus !== "Not Started") || ["Resigned", "End Process", "Exit Process", "Closed"].includes(c.contractStatus)) && (
                                <div className="col-span-1 md:col-span-4 mt-4 p-4 bg-indigo-50/20 border border-indigo-100 rounded-xl space-y-3">
                                  <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                                    <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 font-sans">
                                      <CheckCircle className="h-4 w-4 text-indigo-600" />
                                      Exit Process & Clearance Tracking
                                    </h5>
                                    <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-indigo-150 text-indigo-700 rounded-lg shadow-2xs">
                                      Exit Status: {c.exitProcessStatus || "Not Started"}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                    <div>
                                      <span className="text-slate-400 block mb-0.5">End Reason:</span>
                                      <span className="font-semibold text-slate-700">{c.endReason || "-"}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block mb-0.5">Notice Date:</span>
                                      <span className="font-mono text-slate-700">{c.noticeDate || "-"}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block mb-0.5">Last Working Date:</span>
                                      <span className="font-mono text-rose-600 font-bold">{c.lastWorkingDate || "-"}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block mb-0.5">Closed Date:</span>
                                      <span className="font-mono text-slate-700">{c.closedDate || "-"}</span>
                                    </div>

                                    <div>
                                      <span className="text-slate-400 block mb-0.5">Form Akses & Asset:</span>
                                      <div className="space-y-0.5">
                                        <div className="text-[10px] text-slate-500 font-mono">Sent: {c.accessAssetFormSentDate || "-"}</div>
                                        <div className="text-[10px] text-emerald-600 font-mono font-semibold">Done: {c.accessAssetFormCompletedDate || "-"}</div>
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block mb-0.5">Form Exit Clearance:</span>
                                      <div className="space-y-0.5">
                                        <div className="text-[10px] text-slate-500 font-mono">Sent: {c.exitClearanceFormSentDate || "-"}</div>
                                        <div className="text-[10px] text-emerald-600 font-mono font-semibold">Done: {c.exitClearanceCompletedDate || "-"}</div>
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block mb-0.5">Form Exit Interview (Private):</span>
                                      <div className="space-y-0.5">
                                        <div className="text-[10px] text-slate-500 font-mono">Sent: {c.exitInterviewFormSentDate || "-"}</div>
                                        <div className="text-[10px] font-semibold text-indigo-700">Status: {c.exitInterviewStatus || "Not Sent"}</div>
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block mb-0.5">Akses & Asset Details:</span>
                                      <div className="space-y-0.5 text-[11px]">
                                        <div><span className="text-slate-500">Akses Closure:</span> <span className="font-semibold text-slate-700">{c.accessClosureStatus || "Not Started"}</span></div>
                                        <div><span className="text-slate-500">Asset Return:</span> <span className="font-semibold text-slate-700">{c.assetReturnStatus || "Not Started"} {c.assetReturnRequired && `(${c.assetReturnRequired})`}</span></div>
                                      </div>
                                    </div>
                                  </div>
                                  {c.exitNotes && (
                                    <div className="bg-white border border-slate-150 p-2.5 rounded-lg text-xs text-slate-600 font-mono mt-2">
                                      <span className="text-slate-400 font-sans font-semibold block text-[10px] uppercase mb-1">Exit Process Notes:</span>
                                      {c.exitNotes}
                                    </div>
                                  )}

                                  {/* Quick Actions for Offboarding */}
                                  <div className="mt-4 pt-3 border-t border-indigo-100/50">
                                    <span className="text-slate-500 text-xs font-semibold block mb-2 uppercase font-sans tracking-wide">Update Offboarding State (Quick Actions):</span>
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        onClick={() => {
                                          const today = simulationDate || new Date().toISOString().slice(0, 10);
                                          let deadline = "";
                                          if (c.lastWorkingDate) {
                                            const lDate = new Date(c.lastWorkingDate);
                                            lDate.setDate(lDate.getDate() - 2);
                                            deadline = lDate.toISOString().slice(0, 10);
                                          }
                                          onUpdateContract?.({
                                            ...c,
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
                                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition shadow-xs cursor-pointer"
                                      >
                                        Mark Exit Docs Sent
                                      </button>

                                      <button
                                        onClick={() => {
                                          const today = simulationDate || new Date().toISOString().slice(0, 10);
                                          onUpdateContract?.({
                                            ...c,
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
                                          const today = simulationDate || new Date().toISOString().slice(0, 10);
                                          onUpdateContract?.({
                                            ...c,
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
                                          const today = simulationDate || new Date().toISOString().slice(0, 10);
                                          onUpdateContract?.({
                                            ...c,
                                            exitInterviewCompletedDate: today,
                                            exitInterviewFormStatus: "Completed",
                                            exitInterviewStatus: "Completed",
                                            exitProcessStatus: "Exit Interview Completed"
                                          });
                                        }}
                                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition shadow-xs cursor-pointer"
                                      >
                                        Mark Interview Done
                                      </button>

                                      <button
                                        onClick={() => {
                                          const today = simulationDate || new Date().toISOString().slice(0, 10);
                                          onUpdateContract?.({
                                            ...c,
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
                                          const today = simulationDate || new Date().toISOString().slice(0, 10);
                                          onUpdateContract?.({
                                            ...c,
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
    </div>
  );
};
