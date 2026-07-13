import { useState, useEffect } from "react";
import { 
  ContractItem, 
  ProbationItem, 
  ContractStatus, 
  ProbationStatus,
  PriorityType
} from "../types";
import { 
  EmailTemplateType, 
  getRelevantRecordsForEmailType, 
  generateEmailSubject, 
  generateEmailBody, 
  markEmailSent 
} from "../utils/emailHelper";
import { 
  Mail, 
  Check, 
  Copy, 
  Send, 
  Users, 
  Layers, 
  FileText, 
  Clock, 
  CheckSquare, 
  Square,
  AlertCircle,
  Calendar,
  Search,
  Filter,
  X
} from "lucide-react";
import { computeExitPriority, ExitTrackerRow } from "./ExitTrackerView";

interface EmailCenterViewProps {
  contracts: ContractItem[];
  probations: ProbationItem[];
  simulationDate: string;
  onUpdateContracts: (updated: ContractItem[]) => void;
  onUpdateProbations: (updated: ProbationItem[]) => void;
  accessAssetFormLink: string;
  exitClearanceFormLink: string;
  exitInterviewFormLink: string;
}

export function EmailCenterView({
  contracts,
  probations,
  simulationDate,
  onUpdateContracts,
  onUpdateProbations,
  accessAssetFormLink,
  exitClearanceFormLink,
  exitInterviewFormLink
}: EmailCenterViewProps) {
  // 1. Template State
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplateType>("user-review");
  
  // 2. Data Source State
  // Some templates support both sources, others are source-specific
  const [dataSource, setDataSource] = useState<"contract" | "probation" | "exit">("contract");

  // 3. Selection State
  const [selectedContractIds, setSelectedContractIds] = useState<string[]>([]);
  const [selectedProbationIds, setSelectedProbationIds] = useState<string[]>([]);
  
  // 4. Toast / Copy Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 5. Toggle State
  const [showRelevantOnly, setShowRelevantOnly] = useState<boolean>(true);

  // 6. Search & Filters State
  const [searchName, setSearchName] = useState<string>("");
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [selectedHrPic, setSelectedHrPic] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Template config for UI
  const templates: { key: EmailTemplateType; label: string; description: string; allowedSources: ("contract" | "probation" | "exit")[] }[] = [
    { 
      key: "user-review", 
      label: "User Review Request", 
      description: "Ask managers to provide final recommendation/status for upcoming end dates", 
      allowedSources: ["contract", "probation"] 
    },
    { 
      key: "director-approval", 
      label: "Director Approval Request", 
      description: "Submit manager recommendation to Director for final contract/probation sign-off", 
      allowedSources: ["contract", "probation"] 
    },
    { 
      key: "head-hr-review", 
      label: "Head HR Contract Review", 
      description: "Ask Head of HR to review drafted contracts before dispatching", 
      allowedSources: ["contract"] 
    },
    { 
      key: "contract-sent", 
      label: "Contract Sent to Employee", 
      description: "Send contract extension document to employee for verification and signing", 
      allowedSources: ["contract"] 
    },
    { 
      key: "signed-followup", 
      label: "Signed Contract Follow Up", 
      description: "Follow up with employees who haven't returned their signed contract", 
      allowedSources: ["contract"] 
    },
    { 
      key: "escalation", 
      label: "Critical / Overdue Escalation", 
      description: "Urgent escalation to stakeholders for cases that exceeded review thresholds", 
      allowedSources: ["contract", "probation"] 
    },
    { 
      key: "probation-request", 
      label: "Probation Review Form Request", 
      description: "Ask managers to fill out the probation performance evaluation form", 
      allowedSources: ["probation"] 
    },
    { 
      key: "probation-approval", 
      label: "Probation Approval Request", 
      description: "Submit manager review results to Director for probation approval", 
      allowedSources: ["probation"] 
    },
    { 
      key: "exit-documents-request", 
      label: "Exit: Documents & Forms Request (All Forms)", 
      description: "Send single email containing Access & Asset, Clearance, and Exit Interview forms altogether", 
      allowedSources: ["contract", "probation", "exit"] 
    },
    { 
      key: "exit-follow-up", 
      label: "Exit: Pending Forms Follow Up", 
      description: "Follow up with offboarding employees who have pending/incomplete forms", 
      allowedSources: ["contract", "probation", "exit"] 
    },
  ];

  // Adjust data source if the selected template doesn't allow the current one
  useEffect(() => {
    const templateConfig = templates.find(t => t.key === selectedTemplate);
    if (templateConfig) {
      if (!templateConfig.allowedSources.includes(dataSource)) {
        setDataSource(templateConfig.allowedSources[0]);
      }
    }
    // Clear selections when switching templates
    setSelectedContractIds([]);
    setSelectedProbationIds([]);
  }, [selectedTemplate]);

  // Clear selections when switching source
  useEffect(() => {
    setSelectedContractIds([]);
    setSelectedProbationIds([]);
  }, [dataSource]);

  // Synchronize selections with current contracts and probations props (prevent stale IDs)
  useEffect(() => {
    setSelectedContractIds(prev => prev.filter(id => contracts.some(c => c.id === id)));
  }, [contracts]);

  useEffect(() => {
    setSelectedProbationIds(prev => prev.filter(id => probations.some(p => p.id === id)));
  }, [probations]);

  // Helper to derive Exit records from contracts and probations
  const deriveExitRecords = (contractsList: ContractItem[], probationsList: ProbationItem[]): ExitTrackerRow[] => {
    const rows: ExitTrackerRow[] = [];

    contractsList.forEach(c => {
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

    probationsList.forEach(p => {
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

  // 1. Get filtered or full lists from utils/emailHelper
  const relevantRecords = getRelevantRecordsForEmailType(selectedTemplate, contracts, probations);

  const getBaseRecords = () => {
    if (showRelevantOnly) {
      if (dataSource === "contract") {
        return relevantRecords.contracts;
      } else if (dataSource === "probation") {
        return relevantRecords.probations;
      } else { // "exit"
        return deriveExitRecords(relevantRecords.contracts, relevantRecords.probations);
      }
    } else {
      if (dataSource === "contract") {
        return contracts;
      } else if (dataSource === "probation") {
        return probations;
      } else { // "exit"
        return deriveExitRecords(contracts, probations);
      }
    }
  };

  const baseRecords = getBaseRecords();

  // Dynamic unique filter options
  const uniqueDepts = Array.from(new Set([
    ...contracts.map(c => c.department),
    ...probations.map(p => p.department)
  ].filter(Boolean))).sort();

  const uniquePics = Array.from(new Set([
    ...contracts.map(c => c.hrPic),
    ...probations.map(p => p.hrPic)
  ].filter(Boolean))).sort();

  const uniqueStatuses = Array.from(new Set(
    (dataSource === "contract" 
      ? contracts.map(c => c.contractStatus) 
      : dataSource === "probation" 
        ? probations.map(p => p.probationStatus) 
        : deriveExitRecords(contracts, probations).map(e => e.exitProcessStatus)
    ).filter(Boolean)
  )).sort();

  // Apply search & filters
  const filteredRecords = baseRecords.filter(item => {
    // 1. Name search
    if (searchName && !item.employeeName.toLowerCase().includes(searchName.toLowerCase())) {
      return false;
    }
    // 2. Department filter
    if (selectedDept && item.department !== selectedDept) {
      return false;
    }
    // 3. HR PIC filter
    if (selectedHrPic && item.hrPic !== selectedHrPic) {
      return false;
    }
    // 4. Status filter
    if (selectedStatus) {
      const statusValue = dataSource === "contract"
        ? (item as ContractItem).contractStatus
        : dataSource === "probation"
          ? (item as ProbationItem).probationStatus
          : (item as ExitTrackerRow).exitProcessStatus;
      if (statusValue !== selectedStatus) {
        return false;
      }
    }
    return true;
  });

  const currentSourceRecords = filteredRecords;

  // Derived state to check if all currentSourceRecords are selected
  const allSelected = currentSourceRecords.length > 0 && currentSourceRecords.every(item => {
    if (dataSource === "exit") {
      const row = item as any;
      return row.sourceType === "Contract"
        ? selectedContractIds.includes(row.id)
        : selectedProbationIds.includes(row.id);
    } else if (dataSource === "contract") {
      return selectedContractIds.includes(item.id);
    } else {
      return selectedProbationIds.includes(item.id);
    }
  });

  // Handle Multi-selection Checkbox change
  const handleToggleRecord = (id: string, type: "Contract" | "Probation") => {
    if (type === "Contract") {
      setSelectedContractIds(prev => 
        prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
      );
    } else {
      setSelectedProbationIds(prev => 
        prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
      );
    }
  };

  const handleToggleSelectAll = () => {
    if (dataSource === "exit") {
      const shownIdsAndTypes = currentSourceRecords.map(item => ({ id: item.id, sourceType: (item as ExitTrackerRow).sourceType }));
      const allSelected = shownIdsAndTypes.length > 0 && shownIdsAndTypes.every(item => 
        item.sourceType === "Contract" 
          ? selectedContractIds.includes(item.id) 
          : selectedProbationIds.includes(item.id)
      );

      if (allSelected) {
        const shownContractIds = shownIdsAndTypes.filter(i => i.sourceType === "Contract").map(i => i.id);
        const shownProbationIds = shownIdsAndTypes.filter(i => i.sourceType === "Probation").map(i => i.id);
        setSelectedContractIds(prev => prev.filter(id => !shownContractIds.includes(id)));
        setSelectedProbationIds(prev => prev.filter(id => !shownProbationIds.includes(id)));
      } else {
        const shownContractIds = shownIdsAndTypes.filter(i => i.sourceType === "Contract").map(i => i.id);
        const shownProbationIds = shownIdsAndTypes.filter(i => i.sourceType === "Probation").map(i => i.id);
        setSelectedContractIds(prev => Array.from(new Set([...prev, ...shownContractIds])));
        setSelectedProbationIds(prev => Array.from(new Set([...prev, ...shownProbationIds])));
      }
    } else if (dataSource === "contract") {
      const shownIds = currentSourceRecords.map(c => c.id);
      const allSelected = shownIds.length > 0 && shownIds.every(id => selectedContractIds.includes(id));
      if (allSelected) {
        setSelectedContractIds(prev => prev.filter(id => !shownIds.includes(id)));
      } else {
        setSelectedContractIds(prev => Array.from(new Set([...prev, ...shownIds])));
      }
    } else {
      const shownIds = currentSourceRecords.map(p => p.id);
      const allSelected = shownIds.length > 0 && shownIds.every(id => selectedProbationIds.includes(id));
      if (allSelected) {
        setSelectedProbationIds(prev => prev.filter(id => !shownIds.includes(id)));
      } else {
        setSelectedProbationIds(prev => Array.from(new Set([...prev, ...shownIds])));
      }
    }
  };

  // Build temporary structured records based on currently selected items
  const selectedContractsList = contracts.filter(c => selectedContractIds.includes(c.id));
  const selectedProbationsList = probations.filter(p => selectedProbationIds.includes(p.id));

  // Date format helper (Month Year)
  const getFormattedMonthYear = () => {
    const d = new Date(simulationDate);
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  // Recipient and CC logic
  const getRecipientsSuggestion = (): string => {
    const emails: string[] = [];
    
    const isEmployeeDirectTemplate = 
      selectedTemplate === "contract-sent" || 
      selectedTemplate === "signed-followup" || 
      selectedTemplate === "exit-documents-request" || 
      selectedTemplate === "exit-follow-up";

    if (isEmployeeDirectTemplate) {
      selectedContractsList.forEach(c => {
        if (c.employeeName && c.employeeId) {
          emails.push(`${c.employeeName} <${c.employeeId.toLowerCase()}@javamifi.com>`);
        }
      });
      selectedProbationsList.forEach(p => {
        if (p.employeeName && p.employeeId) {
          emails.push(`${p.employeeName} <${p.employeeId.toLowerCase()}@javamifi.com>`);
        }
      });
    } else {
      const managers = new Set<string>();
      selectedContractsList.forEach(c => {
        if (c.directManager) managers.add(c.directManager);
      });
      selectedProbationsList.forEach(p => {
        if (p.directManager) managers.add(p.directManager);
      });
      managers.forEach(m => {
        emails.push(`${m} <manager@javamifi.com>`);
      });
    }

    if (emails.length === 0) {
      return dataSource === "exit" 
        ? "[Select exit records to see recipients]" 
        : (dataSource === "contract" ? "[Select contracts to see recipients]" : "[Select probations to see recipients]");
    }
    return emails.join("; ");
  };

  const getCcSuggestion = (): string => {
    if (selectedTemplate === "director-approval" || selectedTemplate === "probation-approval") {
      return "Head of HR <head.hr@javamifi.com>; HR Operations <hr.ops@javamifi.com>";
    }
    if (selectedTemplate === "head-hr-review") {
      return "HR Operations <hr.ops@javamifi.com>";
    }
    return "HR Generalist <hr.general@javamifi.com>";
  };

  // Generate Email Draft
  const subject = generateEmailSubject(
    selectedTemplate, 
    { contracts: selectedContractsList, probations: selectedProbationsList },
    getFormattedMonthYear()
  );

  const getActiveBodySource = (): "contract" | "probation" | "both" => {
    if (dataSource === "exit") {
      if (selectedContractsList.length > 0 && selectedProbationsList.length > 0) return "both";
      if (selectedContractsList.length > 0) return "contract";
      return "probation";
    }
    return dataSource;
  };

  const body = generateEmailBody(
    selectedTemplate,
    { contracts: selectedContractsList, probations: selectedProbationsList },
    getActiveBodySource(),
    getFormattedMonthYear(),
    {
      accessAsset: accessAssetFormLink,
      exitClearance: exitClearanceFormLink,
      exitInterview: exitInterviewFormLink
    }
  );

  // Copy functions
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleCopySubject = () => {
    navigator.clipboard.writeText(subject);
    showToast("Subject copied to clipboard!");
  };

  const handleCopyBody = () => {
    navigator.clipboard.writeText(body);
    showToast("Body copied to clipboard!");
  };

  const handleCopyFullEmail = () => {
    const fullText = `TO: ${getRecipientsSuggestion()}\nCC: ${getCcSuggestion()}\nSUBJECT: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(fullText);
    showToast("Full Email drafted text copied to clipboard!");
  };

  const hasSelectedRecords =
    dataSource === "exit"
      ? selectedContractIds.length + selectedProbationIds.length > 0
      : dataSource === "contract"
        ? selectedContractIds.length > 0
        : selectedProbationIds.length > 0;

  const isDraftEmpty = !hasSelectedRecords;

  // Mark as Email Sent handler
  const handleMarkAsSent = () => {
    const totalSelected = dataSource === "exit"
      ? (selectedContractsList.length + selectedProbationsList.length)
      : (dataSource === "contract" ? selectedContractIds.length : selectedProbationIds.length);

    if (totalSelected === 0) return;

    const isConfirmed = confirm(`Mark ${totalSelected} records as email sent for template "${templates.find(t => t.key === selectedTemplate)?.label}"?`);
    if (!isConfirmed) return;

    const { contracts: updatedC, probations: updatedP } = markEmailSent(
      selectedTemplate,
      selectedContractIds,
      selectedProbationIds,
      contracts,
      probations,
      simulationDate
    );

    onUpdateContracts(updatedC);
    onUpdateProbations(updatedP);

    // Reset selection
    setSelectedContractIds([]);
    setSelectedProbationIds([]);
    showToast("Successfully updated records with sent timestamp!");
  };

  // Render Priority Badge helper
  const renderPriorityBadge = (priority: PriorityType) => {
    let style = "bg-slate-100 text-slate-800 border-slate-200";
    if (priority === "High") style = "bg-amber-50 text-amber-800 border-amber-200";
    else if (priority === "Critical") style = "bg-rose-50 text-rose-800 border-rose-200 animate-pulse";
    else if (priority === "Overdue") style = "bg-rose-100 text-rose-900 border-rose-300 font-bold";

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${style}`}>
        {priority}
      </span>
    );
  };

  // Render status badge helper
  const renderStatusBadge = (status: string) => {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 font-sans">
        {status}
      </span>
    );
  };

  // Helper to retrieve last email sent date for active template
  const getLastSentDate = (item: any): string | undefined => {
    const isExitSource = dataSource === "exit";
    const targetItem = isExitSource ? item.originalRecord : item;
    const targetSource = isExitSource ? (item.sourceType === "Contract" ? "contract" : "probation") : dataSource;

    switch (selectedTemplate) {
      case "user-review":
        return targetSource === "contract" ? targetItem.userReviewEmailSentDate : targetItem.probationReviewEmailSentDate;
      case "director-approval":
        return targetSource === "contract" ? targetItem.directorApprovalEmailSentDate : targetItem.probationApprovalEmailSentDate;
      case "head-hr-review":
        return targetItem.headHrReviewEmailSentDate;
      case "contract-sent":
        return targetItem.employeeContractEmailSentDate;
      case "signed-followup":
        return targetItem.signedFollowUpEmailSentDate;
      case "escalation":
        return targetItem.escalationEmailSentDate;
      case "probation-request":
        return targetItem.probationReviewEmailSentDate;
      case "probation-approval":
        return targetItem.probationApprovalEmailSentDate;
      case "exit-documents-request":
        return targetItem.exitDocumentsSentDate;
      case "exit-follow-up":
        return undefined; // Follow-up logs can be tracked via exitNotes or handled manually
      default:
        return undefined;
    }
  };


  return (
    <div className="space-y-6" id="email-center-view">
      {/* Toast Feedback Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-slate-800 transition transform duration-300">
          <Check className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header section with description */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 font-display">Communication Email Center</h1>
              <p className="text-xs text-slate-500">Draft communication letters, review relevant target records, copy subject & body, and update tracking status easily.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 font-mono bg-slate-100 px-3.5 py-1.5 rounded-lg border border-slate-200 self-start md:self-auto">
          <Calendar className="h-3.5 w-3.5 text-indigo-500" />
          Ref Date: {simulationDate}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COMPONENT: CONFIGURATORS & TABLES (8 Columns) */}
        <div className="xl:col-span-7 space-y-6">
          
          {/* Card 1: Select Email Template */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <Layers className="h-4.5 w-4.5 text-slate-500" />
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">1. Choose Communication Letter Template</h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {templates
                .filter(t => !["exit-asset", "exit-clearance", "exit-interview"].includes(t.key))
                .map(t => {
                  const isSelected = selectedTemplate === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setSelectedTemplate(t.key)}
                    className={`flex flex-col text-left p-3.5 rounded-xl border transition group cursor-pointer ${
                      isSelected 
                        ? "bg-indigo-500/5 border-indigo-500 text-slate-900 shadow-xs" 
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <span className={`text-xs font-bold tracking-tight ${isSelected ? "text-indigo-600" : "text-slate-800"}`}>
                      {t.label}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {t.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 2: Select Data Source & Filtered Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-slate-500" />
                <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">2. Filter Records & Multi-Select Candidates</h2>
              </div>

              {/* Source Switcher - Only visible if current template allows multiple sources */}
              {(templates.find(t => t.key === selectedTemplate)?.allowedSources.length || 0) > 1 && (
                <div className="flex bg-slate-200 p-0.5 rounded-lg border border-slate-300">
                  {templates.find(t => t.key === selectedTemplate)?.allowedSources.map(source => {
                    const isSelected = dataSource === source;
                    const label = source === "contract" ? "Contract Data" : source === "probation" ? "Probation Data" : "Exit Tracker";
                    return (
                      <button
                        key={source}
                        onClick={() => setDataSource(source)}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                          isSelected
                            ? source === "contract" 
                              ? "bg-white text-indigo-700 shadow-sm"
                              : source === "probation"
                                ? "bg-white text-emerald-700 shadow-sm"
                                : "bg-white text-rose-700 shadow-sm"
                            : "text-slate-600 hover:text-slate-800"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Custom Control Panel: Toggle and Search/Filters */}
            <div className="p-4 bg-slate-50/50 border-b border-slate-200 space-y-4">
              {/* Toggle section */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">Show Relevant Records Only</span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowRelevantOnly(!showRelevantOnly);
                        // Reset selection when toggling
                        setSelectedContractIds([]);
                        setSelectedProbationIds([]);
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        showRelevantOnly ? "bg-indigo-600" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          showRelevantOnly ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Relevant mode filters records based on the selected email template. Turn it off to select records manually.
                  </p>
                </div>
                <div className="text-xs font-semibold text-slate-500 shrink-0 font-mono bg-slate-100/80 px-2.5 py-1 rounded border border-slate-200 self-start sm:self-auto">
                  Showing <span className="text-indigo-600 font-bold">{currentSourceRecords.length}</span> of <span className="font-bold">{baseRecords.length}</span> records
                </div>
              </div>

              {/* Search & Filters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-200/60">
                {/* Search Term */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <Search className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="text"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="Search name..."
                    className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 font-sans transition"
                  />
                  {searchName && (
                    <button
                      onClick={() => setSearchName("")}
                      className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Dept Filter */}
                <div>
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 transition"
                  >
                    <option value="">All Departments</option>
                    {uniqueDepts.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {/* HR PIC Filter */}
                <div>
                  <select
                    value={selectedHrPic}
                    onChange={(e) => setSelectedHrPic(e.target.value)}
                    className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 transition"
                  >
                    <option value="">All HR PICs</option>
                    {uniquePics.map(pic => (
                      <option key={pic} value={pic}>{pic}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 transition"
                  >
                    <option value="">All Statuses</option>
                    {uniqueStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* List Table container */}
            <div className="p-0">
              {currentSourceRecords.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <AlertCircle className="h-8 w-8 text-slate-400 mx-auto animate-pulse" />
                  <p className="text-xs font-bold text-slate-600">No records match your filters</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-normal">
                    Turn off &ldquo;Show Relevant Records Only&rdquo; or clear filters to select candidates manually.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                          <th className="py-3 px-4 w-12 text-center">
                            <button
                              onClick={handleToggleSelectAll}
                              className="text-slate-500 hover:text-indigo-600 transition"
                              title="Toggle select all"
                            >
                              {allSelected ? (
                                <CheckSquare className="h-4.5 w-4.5 text-indigo-600 mx-auto" />
                              ) : (
                                <Square className="h-4.5 w-4.5 mx-auto" />
                              )}
                            </button>
                          </th>
                          <th className="py-3 px-4">Employee</th>
                          <th className="py-3 px-4">Dept / Manager</th>
                          <th className="py-3 px-4 text-center">Days left</th>
                          <th className="py-3 px-4">Status & Priority</th>
                          <th className="py-3 px-4">Last Sent</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
                        {currentSourceRecords.map(item => {
                          const isChecked = dataSource === "exit"
                            ? ((item as any).sourceType === "Contract" ? selectedContractIds.includes(item.id) : selectedProbationIds.includes(item.id))
                            : (dataSource === "contract" ? selectedContractIds.includes(item.id) : selectedProbationIds.includes(item.id));
                          
                          const lastSent = getLastSentDate(item);
                          const daysRemaining = dataSource === "exit"
                            ? ((item as any).originalRecord ? (item as any).originalRecord.daysRemaining : 0)
                            : (item as any).daysRemaining;

                          return (
                            <tr 
                              key={item.id}
                              className={`text-xs hover:bg-slate-50/50 transition ${isChecked ? "bg-indigo-50/10" : ""}`}
                            >
                              <td className="py-3 px-4 text-center">
                                <button
                                  onClick={() => handleToggleRecord(item.id, dataSource === "exit" ? (item as any).sourceType : (dataSource === "contract" ? "Contract" : "Probation"))}
                                  className="text-slate-400 hover:text-indigo-600 transition"
                                >
                                  {isChecked ? (
                                    <CheckSquare className="h-4.5 w-4.5 text-indigo-600 mx-auto" />
                                  ) : (
                                    <Square className="h-4.5 w-4.5 mx-auto" />
                                  )}
                                </button>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-800">{item.employeeName}</div>
                                <div className="text-[10px] font-mono text-slate-400">{item.position}</div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-medium text-slate-700">{item.department}</div>
                                <div className="text-[10px] text-slate-400">Mgr: {item.directManager}</div>
                              </td>
                              <td className="py-3 px-4 text-center font-mono">
                                <span className={`font-semibold ${daysRemaining <= 10 ? "text-rose-600 font-bold" : "text-slate-600"}`}>
                                  {daysRemaining}d
                                </span>
                              </td>
                              <td className="py-3 px-4 space-y-1">
                                <div>{renderStatusBadge(
                                  dataSource === "exit" 
                                    ? (item as ExitTrackerRow).exitProcessStatus 
                                    : (dataSource === "contract" ? (item as ContractItem).contractStatus : (item as ProbationItem).probationStatus)
                                )}</div>
                                <div>{renderPriorityBadge(item.priority as any)}</div>
                              </td>
                              <td className="py-3 px-4">
                                {lastSent ? (
                                  <div className="space-y-0.5">
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                      <Check className="h-2 w-2" /> Sent
                                    </span>
                                    <div className="text-[9px] text-slate-400 font-mono">{lastSent}</div>
                                  </div>
                                ) : (
                                  <span className="text-[10px] font-mono text-slate-400 italic">Never</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Footer summarizing chosen count */}
                  <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 font-sans">
                    <div>
                      Selected: <span className="font-bold text-indigo-600 font-mono">
                        {dataSource === "exit"
                          ? (currentSourceRecords.filter(item => 
                              (item as any).sourceType === "Contract" 
                                ? selectedContractIds.includes(item.id) 
                                : selectedProbationIds.includes(item.id)
                            ).length)
                          : (dataSource === "contract" ? selectedContractIds.length : selectedProbationIds.length)
                        }
                      </span> / {currentSourceRecords.length} records shown
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COMPONENT: EMAIL PREVIEW PANEL (5 Columns) */}
        <div className="xl:col-span-5 space-y-6">
          <div className="bg-slate-900 text-slate-100 rounded-xl border border-slate-800 shadow-lg overflow-hidden sticky top-6">
            
            {/* Header */}
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="h-4.5 w-4.5 text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">3. Letter Draft Preview</h3>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-800 text-indigo-300 border border-indigo-900/50 uppercase font-mono">
                Manual Copy-Paste
              </span>
            </div>

            {/* Recipients, CC, Subject metadata fields */}
            <div className="p-6 space-y-4 border-b border-slate-800 bg-slate-950/50">
              
              {/* TO Field */}
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">To (Recipients):</label>
                <div className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono break-all line-clamp-2">
                  {getRecipientsSuggestion()}
                </div>
              </div>

              {/* CC Field */}
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">CC:</label>
                <div className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono break-all line-clamp-1">
                  {getCcSuggestion()}
                </div>
              </div>

              {/* Subject Field */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">Subject:</label>
                  <button
                    onClick={handleCopySubject}
                    disabled={!hasSelectedRecords}
                    className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  >
                    <Copy className="h-3 w-3" /> Copy Subject
                  </button>
                </div>
                <div className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-slate-100 font-sans break-words">
                  {subject}
                </div>
              </div>

            </div>

            {/* Body content preview */}
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">Email Body:</label>
                <button
                  onClick={handleCopyBody}
                  disabled={!hasSelectedRecords}
                  className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  <Copy className="h-3 w-3" /> Copy Body
                </button>
              </div>

              {/* Text Area Body content */}
              <div className="relative">
                <textarea
                  readOnly
                  value={body}
                  placeholder="Select employees on the left to populate the draft data table..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-4 text-xs text-slate-300 font-mono leading-relaxed h-[350px] resize-none focus:outline-none"
                />
                {!hasSelectedRecords && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col justify-center items-center p-6 text-center space-y-3">
                    <Mail className="h-8 w-8 text-slate-600 animate-bounce" />
                    <div>
                      <p className="text-xs font-bold text-slate-400">Draft is currently empty</p>
                      <p className="text-[10px] text-slate-500 max-w-xs mt-1">Please select one or more candidate rows from the candidate table on the left to auto-compile details into the draft.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Operational Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={handleCopyFullEmail}
                  disabled={!hasSelectedRecords}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white font-semibold rounded-xl text-xs transition border border-indigo-500/10 shadow-md disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy Full Email (TO/CC/Subject/Body)
                </button>

                <button
                  onClick={handleMarkAsSent}
                  disabled={!hasSelectedRecords}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 text-emerald-400 font-semibold rounded-xl text-xs transition border border-slate-700 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" />
                  Mark selected as Email Sent
                </button>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
