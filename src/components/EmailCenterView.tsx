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
  Calendar
} from "lucide-react";

interface EmailCenterViewProps {
  contracts: ContractItem[];
  probations: ProbationItem[];
  simulationDate: string;
  onUpdateContracts: (updated: ContractItem[]) => void;
  onUpdateProbations: (updated: ProbationItem[]) => void;
}

export function EmailCenterView({
  contracts,
  probations,
  simulationDate,
  onUpdateContracts,
  onUpdateProbations
}: EmailCenterViewProps) {
  // 1. Template State
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplateType>("user-review");
  
  // 2. Data Source State
  // Some templates support both sources, others are source-specific
  const [dataSource, setDataSource] = useState<"contract" | "probation">("contract");

  // 3. Selection State
  const [selectedContractIds, setSelectedContractIds] = useState<string[]>([]);
  const [selectedProbationIds, setSelectedProbationIds] = useState<string[]>([]);
  
  // 4. Toast / Copy Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Template config for UI
  const templates: { key: EmailTemplateType; label: string; description: string; allowedSources: ("contract" | "probation")[] }[] = [
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

  // Extract relevant records
  const relevantRecords = getRelevantRecordsForEmailType(selectedTemplate, contracts, probations);
  
  // Records of the chosen source
  const currentSourceRecords = dataSource === "contract" ? relevantRecords.contracts : relevantRecords.probations;

  // Handle Multi-selection Checkbox change
  const handleToggleRecord = (id: string) => {
    if (dataSource === "contract") {
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
    if (dataSource === "contract") {
      if (selectedContractIds.length === currentSourceRecords.length) {
        setSelectedContractIds([]);
      } else {
        setSelectedContractIds(currentSourceRecords.map(c => c.id));
      }
    } else {
      if (selectedProbationIds.length === currentSourceRecords.length) {
        setSelectedProbationIds([]);
      } else {
        setSelectedProbationIds(currentSourceRecords.map(p => p.id));
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
    if (dataSource === "contract") {
      if (selectedContractsList.length === 0) return "[Select contracts to see recipients]";
      if (selectedTemplate === "contract-sent" || selectedTemplate === "signed-followup") {
        return selectedContractsList.map(c => `${c.employeeName} <${c.employeeId.toLowerCase()}@javamifi.com>`).join("; ");
      }
      return Array.from(new Set(selectedContractsList.map(c => c.directManager))).map(m => `${m} <manager@javamifi.com>`).join("; ");
    } else {
      if (selectedProbationsList.length === 0) return "[Select probations to see recipients]";
      return Array.from(new Set(selectedProbationsList.map(p => p.directManager))).map(m => `${m} <manager@javamifi.com>`).join("; ");
    }
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

  const body = generateEmailBody(
    selectedTemplate,
    { contracts: selectedContractsList, probations: selectedProbationsList },
    dataSource,
    getFormattedMonthYear()
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

  // Mark as Email Sent handler
  const handleMarkAsSent = () => {
    const isConfirmed = confirm(`Mark ${dataSource === "contract" ? selectedContractIds.length : selectedProbationIds.length} records as email sent for template "${templates.find(t => t.key === selectedTemplate)?.label}"?`);
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
      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
        {status}
      </span>
    );
  };

  // Helper to retrieve last email sent date for active template
  const getLastSentDate = (item: any): string | undefined => {
    switch (selectedTemplate) {
      case "user-review":
        return dataSource === "contract" ? item.userReviewEmailSentDate : item.probationReviewEmailSentDate;
      case "director-approval":
        return dataSource === "contract" ? item.directorApprovalEmailSentDate : item.probationApprovalEmailSentDate;
      case "head-hr-review":
        return item.headHrReviewEmailSentDate;
      case "contract-sent":
        return item.employeeContractEmailSentDate;
      case "signed-followup":
        return item.signedFollowUpEmailSentDate;
      case "escalation":
        return item.escalationEmailSentDate;
      case "probation-request":
        return item.probationReviewEmailSentDate;
      case "probation-approval":
        return item.probationApprovalEmailSentDate;
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
              {templates.map(t => {
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

              {/* Source Switcher - Only visible if current template allows both */}
              {templates.find(t => t.key === selectedTemplate)?.allowedSources.length === 2 && (
                <div className="flex bg-slate-200 p-0.5 rounded-lg border border-slate-300">
                  <button
                    onClick={() => setDataSource("contract")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                      dataSource === "contract"
                        ? "bg-white text-indigo-700 shadow-sm"
                        : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    Contract Data
                  </button>
                  <button
                    onClick={() => setDataSource("probation")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                      dataSource === "probation"
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    Probation Data
                  </button>
                </div>
              )}
            </div>

            {/* List Table container */}
            <div className="p-0">
              {currentSourceRecords.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <AlertCircle className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">No matching target records</p>
                  <p className="text-[11px] text-slate-400">All currently registered {dataSource} items are outside the target list rules for this template.</p>
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
                              {((dataSource === "contract" && selectedContractIds.length === currentSourceRecords.length) ||
                                (dataSource === "probation" && selectedProbationIds.length === currentSourceRecords.length)) ? (
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
                          const isChecked = dataSource === "contract" 
                            ? selectedContractIds.includes(item.id) 
                            : selectedProbationIds.includes(item.id);
                          
                          const lastSent = getLastSentDate(item);

                          return (
                            <tr 
                              key={item.id}
                              className={`text-xs hover:bg-slate-50/50 transition ${isChecked ? "bg-indigo-500/2" : ""}`}
                            >
                              <td className="py-3 px-4 text-center">
                                <button
                                  onClick={() => handleToggleRecord(item.id)}
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
                              <td className="py-3 px-4 text-center">
                                <span className={`font-mono font-semibold ${item.daysRemaining <= 10 ? "text-rose-600 font-bold" : "text-slate-600"}`}>
                                  {item.daysRemaining}d
                                </span>
                              </td>
                              <td className="py-3 px-4 space-y-1">
                                <div>{renderStatusBadge(dataSource === "contract" ? (item as ContractItem).contractStatus : (item as ProbationItem).probationStatus)}</div>
                                <div>{renderPriorityBadge(item.priority)}</div>
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
                  <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
                    <div>
                      Selected: <span className="font-bold text-indigo-600 font-mono">
                        {dataSource === "contract" ? selectedContractIds.length : selectedProbationIds.length}
                      </span> / {currentSourceRecords.length} records available
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
                    disabled={dataSource === "contract" ? selectedContractIds.length === 0 : selectedProbationIds.length === 0}
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
                  disabled={dataSource === "contract" ? selectedContractIds.length === 0 : selectedProbationIds.length === 0}
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
                {(dataSource === "contract" ? selectedContractIds.length === 0 : selectedProbationIds.length === 0) && (
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
                  disabled={dataSource === "contract" ? selectedContractIds.length === 0 : selectedProbationIds.length === 0}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white font-semibold rounded-xl text-xs transition border border-indigo-500/10 shadow-md disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy Full Email (TO/CC/Subject/Body)
                </button>

                <button
                  onClick={handleMarkAsSent}
                  disabled={dataSource === "contract" ? selectedContractIds.length === 0 : selectedProbationIds.length === 0}
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
