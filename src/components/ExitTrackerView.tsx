import React, { useState } from "react";
import { ContractItem, ProbationItem, PriorityType } from "../types";
import { 
  Search, 
  Filter, 
  Download, 
  Edit2, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  ExternalLink, 
  X, 
  ChevronDown, 
  Check, 
  AlertCircle,
  HelpCircle
} from "lucide-react";

// Helper to compute exit priority
export function computeExitPriority(
  record: {
    exitProcessStatus?: string;
    closedDate?: string;
    exitDocumentsReturnDeadline?: string;
    lastWorkingDate?: string;
    exitDocumentsSentDate?: string;
    accessAssetFormStatus?: string;
    exitClearanceFormStatus?: string;
    exitInterviewFormStatus?: string;
    accessAssetFormCompletedDate?: string;
    exitClearanceCompletedDate?: string;
    exitInterviewCompletedDate?: string;
  },
  todayStr: string
): "Closed" | "Overdue" | "Critical" | "High" | "Medium" | "Low" {
  if (record.exitProcessStatus === "Closed" || record.closedDate) {
    return "Closed";
  }

  const today = new Date(todayStr);
  const lwd = record.lastWorkingDate ? new Date(record.lastWorkingDate) : null;
  const deadline = record.exitDocumentsReturnDeadline ? new Date(record.exitDocumentsReturnDeadline) : null;

  // Overdue jika today > exitDocumentsReturnDeadline dan exitProcessStatus bukan Closed
  // atau today > lastWorkingDate dan exitProcessStatus bukan Closed
  if (deadline && today > deadline) {
    return "Overdue";
  }
  if (lwd && today > lwd) {
    return "Overdue";
  }

  // Critical jika lastWorkingDate dalam 2 hari dan belum Closed
  if (lwd) {
    const timeDiff = lwd.getTime() - today.getTime();
    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    if (diffDays <= 2) {
      return "Critical";
    }
  }

  // High jika lastWorkingDate dalam 7 hari dan exitDocumentsSentDate kosong
  if (lwd && (!record.exitDocumentsSentDate || record.exitDocumentsSentDate.trim() === "")) {
    const timeDiff = lwd.getTime() - today.getTime();
    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    if (diffDays <= 7) {
      return "High";
    }
  }

  // Medium jika exitDocumentsSentDate ada tapi masih ada form pending
  const hasSentDoc = !!record.exitDocumentsSentDate && record.exitDocumentsSentDate.trim() !== "";
  const isFormPending = !record.accessAssetFormCompletedDate ||
                        !record.exitClearanceCompletedDate ||
                        !record.exitInterviewCompletedDate ||
                        record.accessAssetFormStatus === "Pending" ||
                        record.exitClearanceFormStatus === "Pending" ||
                        ["Pending", "Sent"].includes(record.exitInterviewFormStatus || "");
  if (hasSentDoc && isFormPending) {
    return "Medium";
  }

  // Low jika belum urgent
  return "Low";
}

export interface ExitTrackerRow {
  id: string;
  sourceType: "Contract" | "Probation";
  employeeId: string;
  employeeName: string;
  position: string;
  department: string;
  directManager: string;
  hrPic: string;
  endReason: string;
  noticeDate?: string;
  lastWorkingDate: string;
  exitDocumentsSentDate?: string;
  exitDocumentsReturnDeadline?: string;
  exitProcessStatus: string;
  accessAssetFormStatus: string;
  accessAssetFormCompletedDate?: string;
  exitClearanceFormStatus: string;
  exitClearanceCompletedDate?: string;
  exitInterviewFormStatus: string;
  exitInterviewCompletedDate?: string;
  closedDate?: string;
  exitNotes?: string;
  priority: "Closed" | "Overdue" | "Critical" | "High" | "Medium" | "Low";
  originalRecord: ContractItem | ProbationItem;
}

interface ExitTrackerViewProps {
  contracts: ContractItem[];
  probations: ProbationItem[];
  simulationDate: string;
  onUpdateContract: (c: ContractItem) => void;
  onUpdateProbation: (p: ProbationItem) => void;
  onNavigateToSource: (sourceType: "Contract" | "Probation", employeeName: string) => void;
  initialSearchTerm?: string;
  onClearInitialSearch?: () => void;
}

export const ExitTrackerView: React.FC<ExitTrackerViewProps> = ({
  contracts,
  probations,
  simulationDate,
  onUpdateContract,
  onUpdateProbation,
  onNavigateToSource,
  initialSearchTerm,
  onClearInitialSearch
}) => {
  // Derive search from incoming navigation search term if provided
  const [searchTerm, setSearchTerm] = useState("");

  React.useEffect(() => {
    if (initialSearchTerm) {
      setSearchTerm(initialSearchTerm);
      onClearInitialSearch?.();
    }
  }, [initialSearchTerm, onClearInitialSearch]);
  // 1. Derive combined Exit Tracker records based on defined rules
  const deriveExitRows = (): ExitTrackerRow[] => {
    const rows: ExitTrackerRow[] = [];

    // Filter contracts
    contracts.forEach(c => {
      const isExit = 
        c.contractStatus === "Resigned" ||
        c.contractStatus === "Not Renewed" ||
        c.contractStatus === "Employee Declined" ||
        c.contractStatus === "End Process" ||
        c.contractStatus === "Exit Process" ||
        c.contractStatus === "Closed" ||
        (c.endReason && c.endReason.trim() !== "") ||
        (c.exitProcessStatus && c.exitProcessStatus.trim() !== "" && c.exitProcessStatus !== "Not Started");

      if (isExit) {
        const priority = computeExitPriority(c, simulationDate);
        rows.push({
          id: c.id,
          sourceType: "Contract",
          employeeId: c.employeeId || "",
          employeeName: c.employeeName || "",
          position: c.position || "",
          department: c.department || "",
          directManager: c.directManager || "",
          hrPic: c.hrPic || "",
          endReason: c.endReason || "Not Specified",
          noticeDate: c.noticeDate,
          lastWorkingDate: c.lastWorkingDate || "",
          exitDocumentsSentDate: c.exitDocumentsSentDate,
          exitDocumentsReturnDeadline: c.exitDocumentsReturnDeadline,
          exitProcessStatus: c.exitProcessStatus || "Not Started",
          accessAssetFormStatus: c.accessAssetFormStatus || "Not Started",
          accessAssetFormCompletedDate: c.accessAssetFormCompletedDate,
          exitClearanceFormStatus: c.exitClearanceFormStatus || "Not Started",
          exitClearanceCompletedDate: c.exitClearanceCompletedDate,
          exitInterviewFormStatus: c.exitInterviewFormStatus || "Not Started",
          exitInterviewCompletedDate: c.exitInterviewCompletedDate,
          closedDate: c.closedDate,
          exitNotes: c.exitNotes,
          priority,
          originalRecord: c
        });
      }
    });

    // Filter probations
    probations.forEach(p => {
      const isExit = 
        p.probationStatus === "Resigned" ||
        p.probationStatus === "Not Continued" ||
        p.probationStatus === "Failed Probation" ||
        p.probationStatus === "End Process" ||
        p.probationStatus === "Exit Process" ||
        p.probationStatus === "Closed" ||
        (p.endReason && p.endReason.trim() !== "") ||
        (p.exitProcessStatus && p.exitProcessStatus.trim() !== "" && p.exitProcessStatus !== "Not Started");

      if (isExit) {
        const priority = computeExitPriority(p, simulationDate);
        rows.push({
          id: p.id,
          sourceType: "Probation",
          employeeId: p.employeeId || "",
          employeeName: p.employeeName || "",
          position: p.position || "",
          department: p.department || "",
          directManager: p.directManager || "",
          hrPic: p.hrPic || "",
          endReason: p.endReason || "Not Specified",
          noticeDate: p.noticeDate,
          lastWorkingDate: p.lastWorkingDate || "",
          exitDocumentsSentDate: p.exitDocumentsSentDate,
          exitDocumentsReturnDeadline: p.exitDocumentsReturnDeadline,
          exitProcessStatus: p.exitProcessStatus || "Not Started",
          accessAssetFormStatus: p.accessAssetFormStatus || "Not Started",
          accessAssetFormCompletedDate: p.accessAssetFormCompletedDate,
          exitClearanceFormStatus: p.exitClearanceFormStatus || "Not Started",
          exitClearanceCompletedDate: p.exitClearanceCompletedDate,
          exitInterviewFormStatus: p.exitInterviewFormStatus || "Not Started",
          exitInterviewCompletedDate: p.exitInterviewCompletedDate,
          closedDate: p.closedDate,
          exitNotes: p.exitNotes,
          priority,
          originalRecord: p
        });
      }
    });

    return rows;
  };

  const allRows = deriveExitRows();

  // Filters State
  const [selectedSource, setSelectedSource] = useState<"All" | "Contract" | "Probation">("All");
  const [selectedDept, setSelectedDept] = useState("All Departments");
  const [selectedManager, setSelectedManager] = useState("All Direct Managers");
  const [selectedPIC, setSelectedPIC] = useState("All HR PICs");
  const [selectedEndReason, setSelectedEndReason] = useState("All Reasons");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  const [selectedPriority, setSelectedPriority] = useState("All Priorities");
  const [showClosed, setShowClosed] = useState<"Yes" | "No">("No");

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<ExitTrackerRow | null>(null);

  // Form Fields inside Edit Modal
  const [formEndReason, setFormEndReason] = useState("");
  const [formNoticeDate, setFormNoticeDate] = useState("");
  const [formLastWorkingDate, setFormLastWorkingDate] = useState("");
  const [formExitDocsSentDate, setFormExitDocsSentDate] = useState("");
  const [formReturnDeadline, setFormReturnDeadline] = useState("");
  const [formExitProcessStatus, setFormExitProcessStatus] = useState("");
  const [formAccessAssetStatus, setFormAccessAssetStatus] = useState("");
  const [formAccessAssetCompletedDate, setFormAccessAssetCompletedDate] = useState("");
  const [formExitClearanceStatus, setFormExitClearanceStatus] = useState("");
  const [formExitClearanceCompletedDate, setFormExitClearanceCompletedDate] = useState("");
  const [formExitInterviewStatus, setFormExitInterviewStatus] = useState("");
  const [formExitInterviewCompletedDate, setFormExitInterviewCompletedDate] = useState("");
  const [formExitNotes, setFormExitNotes] = useState("");
  const [formClosedDate, setFormClosedDate] = useState("");

  // Unique lists for filtering
  const departmentsList = ["All Departments", ...Array.from(new Set(allRows.map(r => r.department).filter(Boolean)))];
  const managersList = ["All Direct Managers", ...Array.from(new Set(allRows.map(r => r.directManager).filter(Boolean)))];
  const picsList = ["All HR PICs", ...Array.from(new Set(allRows.map(r => r.hrPic).filter(Boolean)))];
  const endReasonsList = ["All Reasons", ...Array.from(new Set(allRows.map(r => r.endReason).filter(Boolean)))];
  const statusesList = [
    "All Statuses",
    "Not Started",
    "Exit Documents Sent",
    "Access & Asset Form Completed",
    "Exit Clearance Completed",
    "Exit Interview Completed",
    "Closed"
  ];
  const prioritiesList = ["All Priorities", "Overdue", "Critical", "High", "Medium", "Low", "Closed"];

  // Filter & Sort Logic
  const filteredRows = allRows.filter(row => {
    const matchesSearch = row.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          row.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          row.position.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSource = selectedSource === "All" || row.sourceType === selectedSource;
    const matchesDept = selectedDept === "All Departments" || row.department === selectedDept;
    const matchesManager = selectedManager === "All Direct Managers" || row.directManager === selectedManager;
    const matchesPIC = selectedPIC === "All HR PICs" || row.hrPic === selectedPIC;
    const matchesReason = selectedEndReason === "All Reasons" || row.endReason === selectedEndReason;
    const matchesStatus = selectedStatus === "All Statuses" || row.exitProcessStatus === selectedStatus;
    const matchesPriority = selectedPriority === "All Priorities" || row.priority === selectedPriority;
    
    const matchesClosed = showClosed === "Yes" ? true : row.exitProcessStatus !== "Closed";

    return matchesSearch && matchesSource && matchesDept && matchesManager && matchesPIC && matchesReason && matchesStatus && matchesPriority && matchesClosed;
  });

  // Priority Weights for sorting
  const priorityWeights: Record<string, number> = {
    "Overdue": 1,
    "Critical": 2,
    "High": 3,
    "Medium": 4,
    "Low": 5,
    "Closed": 6,
  };

  // Sort: priority weight ascending (Overdue/Critical first), then Last Working Date ascending
  const sortedRows = [...filteredRows].sort((a, b) => {
    const weightA = priorityWeights[a.priority] || 99;
    const weightB = priorityWeights[b.priority] || 99;
    if (weightA !== weightB) {
      return weightA - weightB;
    }
    // Compare LWD
    const dateA = a.lastWorkingDate ? new Date(a.lastWorkingDate).getTime() : 9999999999999;
    const dateB = b.lastWorkingDate ? new Date(b.lastWorkingDate).getTime() : 9999999999999;
    return dateA - dateB;
  });

  // Reset Filters handler
  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedSource("All");
    setSelectedDept("All Departments");
    setSelectedManager("All Direct Managers");
    setSelectedPIC("All HR PICs");
    setSelectedEndReason("All Reasons");
    setSelectedStatus("All Statuses");
    setSelectedPriority("All Priorities");
    setShowClosed("No");
  };

  // Trigger Edit Modal
  const handleOpenEditModal = (row: ExitTrackerRow) => {
    setEditingRow(row);
    setFormEndReason(row.endReason || "");
    setFormNoticeDate(row.noticeDate || "");
    setFormLastWorkingDate(row.lastWorkingDate || "");
    setFormExitDocsSentDate(row.exitDocumentsSentDate || "");
    setFormReturnDeadline(row.exitDocumentsReturnDeadline || "");
    setFormExitProcessStatus(row.exitProcessStatus || "Not Started");
    setFormAccessAssetStatus(row.accessAssetFormStatus || "Not Started");
    setFormAccessAssetCompletedDate(row.accessAssetFormCompletedDate || "");
    setFormExitClearanceStatus(row.exitClearanceFormStatus || "Not Started");
    setFormExitClearanceCompletedDate(row.exitClearanceCompletedDate || "");
    setFormExitInterviewStatus(row.exitInterviewFormStatus || "Not Started");
    setFormExitInterviewCompletedDate(row.exitInterviewCompletedDate || "");
    setFormExitNotes(row.exitNotes || "");
    setFormClosedDate(row.closedDate || "");
    setIsEditModalOpen(true);
  };

  // Save changes from Edit Modal
  const handleSaveExitProcess = () => {
    if (!editingRow) return;

    if (editingRow.sourceType === "Contract") {
      const orig = editingRow.originalRecord as ContractItem;
      const updated: ContractItem = {
        ...orig,
        endReason: formEndReason,
        noticeDate: formNoticeDate || undefined,
        lastWorkingDate: formLastWorkingDate || undefined,
        exitDocumentsSentDate: formExitDocsSentDate || undefined,
        exitDocumentsReturnDeadline: formReturnDeadline || undefined,
        exitProcessStatus: formExitProcessStatus,
        accessAssetFormStatus: formAccessAssetStatus,
        accessAssetFormCompletedDate: formAccessAssetCompletedDate || undefined,
        exitClearanceFormStatus: formExitClearanceStatus,
        exitClearanceCompletedDate: formExitClearanceCompletedDate || undefined,
        exitInterviewFormStatus: formExitInterviewStatus,
        exitInterviewCompletedDate: formExitInterviewCompletedDate || undefined,
        exitNotes: formExitNotes || undefined,
        closedDate: formClosedDate || undefined,
      };
      // If closed, match status
      if (formExitProcessStatus === "Closed" || formClosedDate) {
        updated.contractStatus = "Closed" as any;
      }
      onUpdateContract(updated);
    } else {
      const orig = editingRow.originalRecord as ProbationItem;
      const updated: ProbationItem = {
        ...orig,
        endReason: formEndReason,
        noticeDate: formNoticeDate || undefined,
        lastWorkingDate: formLastWorkingDate || undefined,
        exitDocumentsSentDate: formExitDocsSentDate || undefined,
        exitDocumentsReturnDeadline: formReturnDeadline || undefined,
        exitProcessStatus: formExitProcessStatus,
        accessAssetFormStatus: formAccessAssetStatus,
        accessAssetFormCompletedDate: formAccessAssetCompletedDate || undefined,
        exitClearanceFormStatus: formExitClearanceStatus,
        exitClearanceCompletedDate: formExitClearanceCompletedDate || undefined,
        exitInterviewFormStatus: formExitInterviewStatus,
        exitInterviewCompletedDate: formExitInterviewCompletedDate || undefined,
        exitNotes: formExitNotes || undefined,
        closedDate: formClosedDate || undefined,
      };
      // If closed, match status
      if (formExitProcessStatus === "Closed" || formClosedDate) {
        updated.probationStatus = "Closed" as any;
      }
      onUpdateProbation(updated);
    }

    setIsEditModalOpen(false);
    setEditingRow(null);
  };

  // Quick Action Handler
  const handleQuickAction = (row: ExitTrackerRow, actionType: string) => {
    const today = simulationDate || new Date().toISOString().slice(0, 10);
    let updatedFields: Partial<ContractItem & ProbationItem> = {};

    switch (actionType) {
      case "docs-sent": {
        let deadline = "";
        if (row.lastWorkingDate) {
          const lDate = new Date(row.lastWorkingDate);
          lDate.setDate(lDate.getDate() - 2);
          deadline = lDate.toISOString().slice(0, 10);
        } else {
          const tDate = new Date(today);
          tDate.setDate(tDate.getDate() + 3);
          deadline = tDate.toISOString().slice(0, 10);
        }
        updatedFields = {
          exitDocumentsSentDate: today,
          accessAssetFormSentDate: today,
          exitClearanceFormSentDate: today,
          exitInterviewFormSentDate: today,
          exitProcessStatus: "Exit Documents Sent",
          accessAssetFormStatus: "Pending",
          exitClearanceFormStatus: "Pending",
          exitInterviewFormStatus: "Sent",
          exitDocumentsReturnDeadline: deadline
        };
        break;
      }
      case "asset-done":
        updatedFields = {
          accessAssetFormCompletedDate: today,
          accessAssetFormStatus: "Completed",
          exitProcessStatus: "Access & Asset Form Completed"
        };
        break;
      case "clearance-done":
        updatedFields = {
          exitClearanceCompletedDate: today,
          exitClearanceFormStatus: "Completed",
          exitProcessStatus: "Exit Clearance Completed"
        };
        break;
      case "interview-done":
        updatedFields = {
          exitInterviewCompletedDate: today,
          exitInterviewFormStatus: "Completed",
          exitInterviewStatus: "Completed",
          exitProcessStatus: "Exit Interview Completed"
        };
        break;
      case "interview-declined":
        updatedFields = {
          exitInterviewCompletedDate: today,
          exitInterviewFormStatus: "Declined",
          exitInterviewStatus: "Declined",
          exitProcessStatus: "Exit Interview Completed"
        };
        break;
      case "mark-closed":
        updatedFields = {
          closedDate: today,
          exitProcessStatus: "Closed",
          contractStatus: row.sourceType === "Contract" ? "Closed" : undefined,
          probationStatus: row.sourceType === "Probation" ? "Closed" : undefined,
        } as any;
        break;
      default:
        return;
    }

    if (row.sourceType === "Contract") {
      onUpdateContract({
        ...row.originalRecord as ContractItem,
        ...updatedFields
      });
    } else {
      onUpdateProbation({
        ...row.originalRecord as ProbationItem,
        ...updatedFields
      });
    }
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    let headers = [
      "Employee Name",
      "Source Type",
      "Position",
      "Department",
      "Direct Manager",
      "HR PIC",
      "End Reason",
      "Notice Date",
      "Last Working Date",
      "Exit Documents Sent Date",
      "Exit Documents Return Deadline",
      "Exit Process Status",
      "Access & Asset Form Status",
      "Access & Asset Form Completed Date",
      "Exit Clearance Form Status",
      "Exit Clearance Completed Date",
      "Exit Interview Form Status",
      "Exit Interview Completed Date",
      "Exit Notes",
      "Closed Date"
    ];

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.map(h => `"${h}"`).join(",") + "\n";

    sortedRows.forEach(row => {
      let data = [
        row.employeeName,
        row.sourceType,
        row.position,
        row.department,
        row.directManager,
        row.hrPic,
        row.endReason,
        row.noticeDate || "",
        row.lastWorkingDate,
        row.exitDocumentsSentDate || "",
        row.exitDocumentsReturnDeadline || "",
        row.exitProcessStatus,
        row.accessAssetFormStatus,
        row.accessAssetFormCompletedDate || "",
        row.exitClearanceFormStatus,
        row.exitClearanceCompletedDate || "",
        row.exitInterviewFormStatus,
        row.exitInterviewCompletedDate || "",
        row.exitNotes || "",
        row.closedDate || ""
      ];
      csvContent += data.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mifi_hr_exit_tracker_${simulationDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get Priority styling
  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "Overdue":
        return "bg-rose-100 text-rose-800 border border-rose-200 animate-pulse font-bold";
      case "Critical":
        return "bg-amber-100 text-amber-800 border border-amber-200 font-bold";
      case "High":
        return "bg-orange-50 text-orange-700 border border-orange-100 font-semibold";
      case "Medium":
        return "bg-blue-50 text-blue-700 border border-blue-100 font-medium";
      case "Closed":
        return "bg-slate-100 text-slate-600 border border-slate-200";
      default:
        return "bg-slate-50 text-slate-500 border border-slate-100";
    }
  };

  const getFormStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-50 text-emerald-700 border border-emerald-150 font-semibold";
      case "Declined":
        return "bg-slate-100 text-slate-500 border border-slate-200";
      case "Pending":
      case "Sent":
        return "bg-amber-50 text-amber-700 border border-amber-150";
      default:
        return "bg-slate-50 text-slate-400 border border-slate-100";
    }
  };

  return (
    <div className="space-y-6" id="exit-tracker-view">
      
      {/* 1. Header Card */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 font-display">Offboarding & Exit Process Tracker</h1>
              <p className="text-xs text-slate-500">
                Derived offboarding pipeline tracking access closures, asset returns, exit clearance verify, and interview compliance.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5 self-start md:self-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-xs transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Export Exit CSV
          </button>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 font-mono bg-slate-100 px-3.5 py-2 rounded-lg border border-slate-200">
            Sim Date: {simulationDate}
          </div>
        </div>
      </div>

      {/* 2. Filters Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-700 uppercase tracking-wider font-mono">
            <Filter className="h-4 w-4 text-slate-400" />
            Operational Pipelines Filter
          </div>
          <button
            onClick={handleResetFilters}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold transition cursor-pointer"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Name / Position..."
              className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 focus:outline-hidden focus:bg-white focus:border-indigo-500 transition"
            />
          </div>

          {/* Source Type Filter */}
          <div>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value as any)}
              className="w-full text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-hidden focus:bg-white focus:border-indigo-500 transition cursor-pointer"
            >
              <option value="All">All Sources (Contract + Probation)</option>
              <option value="Contract">Contract Only</option>
              <option value="Probation">Probation Only</option>
            </select>
          </div>

          {/* Dept Filter */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-hidden focus:bg-white focus:border-indigo-500 transition cursor-pointer"
            >
              <option value="All Departments">All Departments</option>
              {departmentsList.filter(d => d !== "All Departments").map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Direct Manager Filter */}
          <div>
            <select
              value={selectedManager}
              onChange={(e) => setSelectedManager(e.target.value)}
              className="w-full text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-hidden focus:bg-white focus:border-indigo-500 transition cursor-pointer"
            >
              <option value="All Direct Managers">All Direct Managers</option>
              {managersList.filter(m => m !== "All Direct Managers").map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* HR PIC Filter */}
          <div>
            <select
              value={selectedPIC}
              onChange={(e) => setSelectedPIC(e.target.value)}
              className="w-full text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-hidden focus:bg-white focus:border-indigo-500 transition cursor-pointer"
            >
              <option value="All HR PICs">All HR PICs</option>
              {picsList.filter(p => p !== "All HR PICs").map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* End Reason Filter */}
          <div>
            <select
              value={selectedEndReason}
              onChange={(e) => setSelectedEndReason(e.target.value)}
              className="w-full text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-hidden focus:bg-white focus:border-indigo-500 transition cursor-pointer"
            >
              <option value="All Reasons">All Reasons</option>
              {endReasonsList.filter(r => r !== "All Reasons").map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Exit Process Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-hidden focus:bg-white focus:border-indigo-500 transition cursor-pointer"
            >
              {statusesList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Exit Priority Filter */}
          <div>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-hidden focus:bg-white focus:border-indigo-500 transition cursor-pointer"
            >
              {prioritiesList.map(p => (
                <option key={p} value={p}>Priority: {p}</option>
              ))}
            </select>
          </div>

          {/* Show Closed Toggle */}
          <div>
            <select
              value={showClosed}
              onChange={(e) => setShowClosed(e.target.value as any)}
              className="w-full text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-hidden focus:bg-white focus:border-indigo-500 transition cursor-pointer"
            >
              <option value="No">Hide Closed Exit Rows (Default)</option>
              <option value="Yes">Show Closed Exit Rows</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Exit Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {sortedRows.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No offboarding employees found</p>
            <p className="text-xs text-slate-500 max-w-lg mx-auto">
              No matching records from Contract / Probation matched your active filter guidelines.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                  <th className="py-3 px-4">Employee & Source</th>
                  <th className="py-3 px-4">Department & PIC</th>
                  <th className="py-3 px-4">Exit Status & Reason</th>
                  <th className="py-3 px-4">LWD / Return Deadline</th>
                  <th className="py-3 px-4">Forms Status</th>
                  <th className="py-3 px-4 text-center">Priority</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sortedRows.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition text-xs">
                    
                    {/* Employee & Source */}
                    <td className="py-4 px-4 space-y-1">
                      <div className="font-bold text-slate-900">{row.employeeName}</div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 font-medium">{row.position}</span>
                        <span className={`inline-flex px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                          row.sourceType === "Contract" 
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        }`}>
                          {row.sourceType}
                        </span>
                      </div>
                    </td>

                    {/* Department & PIC */}
                    <td className="py-4 px-4 space-y-0.5">
                      <div className="font-semibold text-slate-700">{row.department}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        PIC: {row.hrPic || "-"} • Mgr: {row.directManager}
                      </div>
                    </td>

                    {/* Exit Status & Reason */}
                    <td className="py-4 px-4 space-y-1">
                      <div className="font-bold text-slate-700">{row.exitProcessStatus}</div>
                      <div className="inline-flex items-center gap-1 text-[10px] text-rose-700 bg-rose-50/70 border border-rose-100 px-1.5 py-0.5 rounded font-medium">
                        Reason: {row.endReason}
                      </div>
                    </td>

                    {/* LWD / Return Deadline */}
                    <td className="py-4 px-4 space-y-1">
                      <div>
                        <span className="text-slate-400 font-medium">LWD:</span>{" "}
                        <span className="font-semibold text-slate-800 font-mono">{row.lastWorkingDate || "Not Set"}</span>
                      </div>
                      <div className="text-[10px]">
                        <span className="text-slate-400 font-medium">Deadline:</span>{" "}
                        <span className="text-slate-600 font-mono">{row.exitDocumentsReturnDeadline || "Not Set"}</span>
                      </div>
                    </td>

                    {/* Forms Status */}
                    <td className="py-4 px-4 space-y-1">
                      <div className="flex flex-col gap-1 text-[10px]">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500">Access & Asset:</span>
                          <span className={`px-1.5 py-0.2 rounded border text-[9px] ${getFormStatusBadgeClass(row.accessAssetFormStatus)}`}>
                            {row.accessAssetFormStatus}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500">Clearance:</span>
                          <span className={`px-1.5 py-0.2 rounded border text-[9px] ${getFormStatusBadgeClass(row.exitClearanceFormStatus)}`}>
                            {row.exitClearanceFormStatus}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500">Exit Interview:</span>
                          <span className={`px-1.5 py-0.2 rounded border text-[9px] ${getFormStatusBadgeClass(row.exitInterviewFormStatus)}`}>
                            {row.exitInterviewFormStatus}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Priority Badge */}
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getPriorityBadgeClass(row.priority)}`}>
                        {row.priority}
                      </span>
                    </td>

                    {/* Actions Menu */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col items-end gap-1.5">
                        
                        {/* Primary Buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(row)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-md border border-slate-200 transition cursor-pointer"
                            title="Edit Exit Process Details"
                          >
                            <Edit2 className="h-3 w-3" /> Edit
                          </button>
                          
                          <button
                            onClick={() => onNavigateToSource(row.sourceType, row.employeeName)}
                            className="flex items-center gap-1 px-2 py-1.5 text-indigo-600 hover:text-indigo-800 font-bold transition cursor-pointer"
                            title="View original record"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Quick actions line */}
                        <div className="flex flex-wrap gap-1 justify-end max-w-[280px]">
                          {row.exitProcessStatus === "Not Started" && (
                            <button
                              onClick={() => handleQuickAction(row, "docs-sent")}
                              className="px-1.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded text-[10px] border border-indigo-100 transition cursor-pointer"
                            >
                              Sent Docs
                            </button>
                          )}
                          {row.accessAssetFormStatus === "Pending" && (
                            <button
                              onClick={() => handleQuickAction(row, "asset-done")}
                              className="px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium rounded text-[10px] border border-emerald-100 transition cursor-pointer"
                            >
                              Done Asset
                            </button>
                          )}
                          {row.exitClearanceFormStatus === "Pending" && (
                            <button
                              onClick={() => handleQuickAction(row, "clearance-done")}
                              className="px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium rounded text-[10px] border border-emerald-100 transition cursor-pointer"
                            >
                              Done Clearance
                            </button>
                          )}
                          {["Pending", "Sent"].includes(row.exitInterviewFormStatus) && (
                            <>
                              <button
                                onClick={() => handleQuickAction(row, "interview-done")}
                                className="px-1.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded text-[10px] border border-indigo-100 transition cursor-pointer"
                              >
                                Interview Done
                              </button>
                              <button
                                onClick={() => handleQuickAction(row, "interview-declined")}
                                className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded text-[10px] border border-slate-200 transition cursor-pointer"
                              >
                                Decline
                              </button>
                            </>
                          )}
                          {row.exitProcessStatus !== "Closed" && (
                            <button
                              onClick={() => handleQuickAction(row, "mark-closed")}
                              className="px-1.5 py-0.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded text-[10px] border border-teal-100 transition cursor-pointer"
                            >
                              Mark Closed
                            </button>
                          )}
                        </div>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Edit Modal Component */}
      {isEditModalOpen && editingRow && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Edit Exit Process: {editingRow.employeeName}</h3>
                <p className="text-[11px] text-slate-500 font-medium">Source: {editingRow.sourceType} • ID: {editingRow.employeeId}</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Fields */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* End Reason */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">End Reason</label>
                  <input
                    type="text"
                    value={formEndReason}
                    onChange={(e) => setFormEndReason(e.target.value)}
                    placeholder="e.g. Resigned / Contract End"
                    className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:bg-white focus:border-indigo-500 transition"
                  />
                </div>

                {/* Notice Date */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Notice Date</label>
                  <input
                    type="date"
                    value={formNoticeDate}
                    onChange={(e) => setFormNoticeDate(e.target.value)}
                    className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:bg-white focus:border-indigo-500 transition"
                  />
                </div>

                {/* Last Working Date */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Last Working Date *</label>
                  <input
                    type="date"
                    value={formLastWorkingDate}
                    onChange={(e) => setFormLastWorkingDate(e.target.value)}
                    className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:bg-white focus:border-indigo-500 transition"
                  />
                </div>

                {/* Exit Documents Sent Date */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Exit Documents Sent Date</label>
                  <input
                    type="date"
                    value={formExitDocsSentDate}
                    onChange={(e) => setFormExitDocsSentDate(e.target.value)}
                    className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:bg-white focus:border-indigo-500 transition"
                  />
                </div>

                {/* Exit Documents Return Deadline */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Exit Documents Return Deadline</label>
                  <input
                    type="date"
                    value={formReturnDeadline}
                    onChange={(e) => setFormReturnDeadline(e.target.value)}
                    className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:bg-white focus:border-indigo-500 transition"
                  />
                </div>

                {/* Exit Process Status */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Exit Process Status</label>
                  <select
                    value={formExitProcessStatus}
                    onChange={(e) => setFormExitProcessStatus(e.target.value)}
                    className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:bg-white focus:border-indigo-500 transition cursor-pointer"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="Exit Documents Sent">Exit Documents Sent</option>
                    <option value="Access & Asset Form Completed">Access & Asset Form Completed</option>
                    <option value="Exit Clearance Completed">Exit Clearance Completed</option>
                    <option value="Exit Interview Completed">Exit Interview Completed</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                {/* Access & Asset Form Status */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Access & Asset Form Status</label>
                  <select
                    value={formAccessAssetStatus}
                    onChange={(e) => setFormAccessAssetStatus(e.target.value)}
                    className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:bg-white focus:border-indigo-500 transition cursor-pointer"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                {/* Access & Asset Form Completed Date */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Access & Asset Form Completed Date</label>
                  <input
                    type="date"
                    value={formAccessAssetCompletedDate}
                    onChange={(e) => setFormAccessAssetCompletedDate(e.target.value)}
                    className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:bg-white focus:border-indigo-500 transition"
                  />
                </div>

                {/* Exit Clearance Form Status */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Exit Clearance Form Status</label>
                  <select
                    value={formExitClearanceStatus}
                    onChange={(e) => setFormExitClearanceStatus(e.target.value)}
                    className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:bg-white focus:border-indigo-500 transition cursor-pointer"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                {/* Exit Clearance Completed Date */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Exit Clearance Completed Date</label>
                  <input
                    type="date"
                    value={formExitClearanceCompletedDate}
                    onChange={(e) => setFormExitClearanceCompletedDate(e.target.value)}
                    className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:bg-white focus:border-indigo-500 transition"
                  />
                </div>

                {/* Exit Interview Form Status */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Exit Interview Form Status</label>
                  <select
                    value={formExitInterviewStatus}
                    onChange={(e) => setFormExitInterviewStatus(e.target.value)}
                    className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:bg-white focus:border-indigo-500 transition cursor-pointer"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="Sent">Sent</option>
                    <option value="Declined">Declined</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                {/* Exit Interview Completed Date */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Exit Interview Completed Date</label>
                  <input
                    type="date"
                    value={formExitInterviewCompletedDate}
                    onChange={(e) => setFormExitInterviewCompletedDate(e.target.value)}
                    className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:bg-white focus:border-indigo-500 transition"
                  />
                </div>

                {/* Closed Date */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Closed Date</label>
                  <input
                    type="date"
                    value={formClosedDate}
                    onChange={(e) => setFormClosedDate(e.target.value)}
                    className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:bg-white focus:border-indigo-500 transition"
                  />
                </div>

              </div>

              {/* Exit Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Exit Notes</label>
                <textarea
                  value={formExitNotes}
                  onChange={(e) => setFormExitNotes(e.target.value)}
                  placeholder="Insert notes regarding asset returns, pending clearances, or handover notes..."
                  className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:bg-white focus:border-indigo-500 transition h-20 resize-none"
                />
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveExitProcess}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
              >
                Save Exit Process
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
