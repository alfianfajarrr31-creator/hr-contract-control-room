import React, { useState } from "react";
import { 
  ProbationItem, 
  ProbationStatus, 
  PriorityType, 
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
  AlertCircle, 
  ArrowUpDown,
  RefreshCw,
  CheckCircle,
  HelpCircle,
  Clock
} from "lucide-react";
import { DEPARTMENTS, HR_PICS } from "../seedData";

interface ProbationTrackerViewProps {
  probations: ProbationItem[];
  onAddProbation: () => void;
  onEditProbation: (probation: ProbationItem) => void;
  onDeleteProbation: (id: string) => void;
  onExportCSV: (items: ProbationItem[]) => void;
}

export const ProbationTrackerView: React.FC<ProbationTrackerViewProps> = ({
  probations,
  onAddProbation,
  onEditProbation,
  onDeleteProbation,
  onExportCSV
}) => {
  // Filters & State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("All Departments");
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
    const matchesStatus = selectedStatus === "All Statuses" || p.probationStatus === selectedStatus;
    const matchesPriority = selectedPriority === "All Priorities" || p.priority === selectedPriority;
    const matchesPIC = selectedPIC === "All HR PICs" || p.hrPic === selectedPIC;

    return matchesSearch && matchesDept && matchesStatus && matchesPriority && matchesPIC;
  }).sort((a, b) => {
    const dateA = new Date(a.probationEndDate).getTime();
    const dateB = new Date(b.probationEndDate).getTime();
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedDept("All Departments");
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
          {(searchTerm || selectedDept !== "All Departments" || selectedStatus !== "All Statuses" || selectedPriority !== "All Priorities" || selectedPIC !== "All HR PICs") && (
            <button
              onClick={resetFilters}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search bar */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="ID, Name, or Position..."
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
              {DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
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
              {HR_PICS.map(pic => (
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
