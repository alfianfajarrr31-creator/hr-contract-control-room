import { useState, useEffect } from "react";
import { 
  ContractItem, 
  ProbationItem, 
  ContractStatus, 
  ProbationStatus,
  computeContractSLA,
  computeProbationSLA,
  getTodayDateStr
} from "./types";
import { INITIAL_CONTRACTS, INITIAL_PROBATIONS } from "./seedData";
import { DashboardView } from "./components/DashboardView";
import { ContractTrackerView } from "./components/ContractTrackerView";
import { ProbationTrackerView } from "./components/ProbationTrackerView";
import { ContractForm } from "./components/ContractForm";
import { ProbationForm } from "./components/ProbationForm";
import { SettingsView } from "./components/SettingsView";
import { ImportExcelView } from "./components/ImportExcelView";
import { EmailCenterView } from "./components/EmailCenterView";
import { 
  LayoutDashboard, 
  FileText, 
  UserCheck, 
  Sliders, 
  Calendar, 
  RotateCcw, 
  AlertTriangle,
  Building,
  User,
  ShieldCheck,
  Download,
  FileSpreadsheet,
  Mail,
  Database
} from "lucide-react";

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "contracts" | "probation" | "settings" | "add-contract" | "edit-contract" | "add-probation" | "edit-probation" | "import-excel" | "email-center"
  >("dashboard");

  // Core Data States
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [probations, setProbations] = useState<ProbationItem[]>([]);
  
  // Simulation Date (defaulting dynamically to today's date)
  const [simulationDate, setSimulationDate] = useState<string>(getTodayDateStr());

  // Edit Item Holders
  const [editingContract, setEditingContract] = useState<ContractItem | null>(null);
  const [editingProbation, setEditingProbation] = useState<ProbationItem | null>(null);

  // Initialize flag for production / sample data mode
  const [isInitialized, setIsInitialized] = useState<boolean>(() => {
    const savedContracts = localStorage.getItem("hr_contract_control_contracts");
    const savedProbations = localStorage.getItem("hr_contract_control_probations");
    const hasInitializedFlag = localStorage.getItem("hr_contract_control_initialized") === "true";
    return savedContracts !== null || savedProbations !== null || hasInitializedFlag;
  });

  // Load Data on startup
  useEffect(() => {
    const savedContracts = localStorage.getItem("hr_contract_control_contracts");
    const savedProbations = localStorage.getItem("hr_contract_control_probations");
    const savedSimDate = localStorage.getItem("hr_contract_control_simdate");
    const hasInitializedFlag = localStorage.getItem("hr_contract_control_initialized") === "true";

    const simDate = savedSimDate || getTodayDateStr();
    setSimulationDate(simDate);

    let rawContracts: ContractItem[] = [];
    let rawProbations: ProbationItem[] = [];

    // Only load if initialized. Otherwise remain empty until user makes choice.
    if (savedContracts !== null || savedProbations !== null || hasInitializedFlag) {
      if (savedContracts) {
        try {
          const parsed = JSON.parse(savedContracts);
          if (Array.isArray(parsed)) {
            rawContracts = parsed.map((c: any) => {
              // Safe removal of old nominal salary fields for data privacy
              delete c.currentSalary;
              delete c.proposedSalary;
              delete c.finalSalary;
              return {
                ...c,
                compensationReviewNeeded: c.compensationReviewNeeded ?? false,
                negotiationStatus: c.negotiationStatus ?? c.salaryNegotiationStatus ?? "No Negotiation",
                negotiationNotes: c.negotiationNotes ?? "",
                payrollFollowUpNotes: c.payrollFollowUpNotes ?? "",
              };
            });
          }
        } catch (e) {
          rawContracts = [];
        }
      }

      if (savedProbations) {
        try {
          rawProbations = JSON.parse(savedProbations);
        } catch (e) {
          rawProbations = [];
        }
      }
    } else {
      rawContracts = [];
      rawProbations = [];
    }

    // Process SLAs based on the simulation date
    const updatedContracts = rawContracts.map(c => {
      const sla = computeContractSLA(c.contractEndDate, c.contractStatus, simDate);
      return {
        ...c,
        daysRemaining: sla.daysRemaining,
        priority: sla.priority,
      };
    });

    const updatedProbations = rawProbations.map(p => {
      const sla = computeProbationSLA(p.probationEndDate, p.finalDecision, simDate);
      return {
        ...p,
        daysRemaining: sla.daysRemaining,
        priority: sla.priority
      };
    });

    setContracts(updatedContracts);
    setProbations(updatedProbations);
  }, []);

  // Save data to localStorage whenever core data changes, but we'll also update priority/days based on date
  const syncWithStorage = (updatedC: ContractItem[], updatedP: ProbationItem[], currentSimDate: string) => {
    // Process SLAs before saving
    const finalC = updatedC.map(c => {
      const sla = computeContractSLA(c.contractEndDate, c.contractStatus, currentSimDate);
      return {
        ...c,
        daysRemaining: sla.daysRemaining,
        priority: sla.priority
      };
    });

    const finalP = updatedP.map(p => {
      const sla = computeProbationSLA(p.probationEndDate, p.finalDecision, currentSimDate);
      return {
        ...p,
        daysRemaining: sla.daysRemaining,
        priority: sla.priority
      };
    });

    setContracts(finalC);
    setProbations(finalP);
    localStorage.setItem("hr_contract_control_contracts", JSON.stringify(finalC));
    localStorage.setItem("hr_contract_control_probations", JSON.stringify(finalP));
    localStorage.setItem("hr_contract_control_simdate", currentSimDate);
  };

  // Handle Simulation Date Change
  const handleSimulationDateChange = (newDate: string) => {
    setSimulationDate(newDate);
    // Recompute all on change
    syncWithStorage(contracts, probations, newDate);
  };

  // Reset all to original seeds
  const handleResetToSeeds = () => {
    handleResetToSampleData();
  };

  // Clear only data marked as isSampleData: true
  const handleClearSampleData = () => {
    const remainingContracts = contracts.filter(c => c.isSampleData !== true);
    const remainingProbations = probations.filter(p => p.isSampleData !== true);
    
    const clearedContractsCount = contracts.length - remainingContracts.length;
    const clearedProbationsCount = probations.length - remainingProbations.length;
    
    setContracts(remainingContracts);
    setProbations(remainingProbations);
    localStorage.setItem("hr_contract_control_contracts", JSON.stringify(remainingContracts));
    localStorage.setItem("hr_contract_control_probations", JSON.stringify(remainingProbations));
    
    alert(`Successfully cleared ${clearedContractsCount} sample contracts and ${clearedProbationsCount} sample probations.`);
  };

  // Clear all data
  const handleClearAllData = () => {
    if (confirm("Are you sure? This will permanently delete all local data from this browser. Please export backup first.")) {
      setContracts([]);
      setProbations([]);
      localStorage.setItem("hr_contract_control_contracts", JSON.stringify([]));
      localStorage.setItem("hr_contract_control_probations", JSON.stringify([]));
      localStorage.setItem("hr_contract_control_initialized", "true");
      setIsInitialized(true);
      alert("All local data has been permanently cleared.");
    }
  };

  // Reset entirely to sample seeds
  const handleResetToSampleData = () => {
    if (confirm("Are you sure you want to reset to sample data? This will clear all existing data and restore the sample sandbox data.")) {
      const defaultDate = simulationDate || getTodayDateStr();
      
      const finalC = INITIAL_CONTRACTS.map(c => {
        const sla = computeContractSLA(c.contractEndDate, c.contractStatus, defaultDate);
        return { ...c, daysRemaining: sla.daysRemaining, priority: sla.priority, isSampleData: true };
      });

      const finalP = INITIAL_PROBATIONS.map(p => {
        const sla = computeProbationSLA(p.probationEndDate, p.finalDecision, defaultDate);
        return { ...p, daysRemaining: sla.daysRemaining, priority: sla.priority, isSampleData: true };
      });

      setContracts(finalC);
      setProbations(finalP);
      localStorage.setItem("hr_contract_control_contracts", JSON.stringify(finalC));
      localStorage.setItem("hr_contract_control_probations", JSON.stringify(finalP));
      localStorage.setItem("hr_contract_control_initialized", "true");
      setIsInitialized(true);
      alert("Successfully reset all data to sandbox sample records.");
    }
  };

  // Onboarding choices
  const handleLoadSampleData = () => {
    const defaultDate = simulationDate || getTodayDateStr();
    
    const finalC = INITIAL_CONTRACTS.map(c => {
      const sla = computeContractSLA(c.contractEndDate, c.contractStatus, defaultDate);
      return { ...c, daysRemaining: sla.daysRemaining, priority: sla.priority, isSampleData: true };
    });

    const finalP = INITIAL_PROBATIONS.map(p => {
      const sla = computeProbationSLA(p.probationEndDate, p.finalDecision, defaultDate);
      return { ...p, daysRemaining: sla.daysRemaining, priority: sla.priority, isSampleData: true };
    });

    setContracts(finalC);
    setProbations(finalP);
    localStorage.setItem("hr_contract_control_contracts", JSON.stringify(finalC));
    localStorage.setItem("hr_contract_control_probations", JSON.stringify(finalP));
    localStorage.setItem("hr_contract_control_initialized", "true");
    setIsInitialized(true);
    setActiveTab("dashboard");
  };

  const handleStartBlank = () => {
    setContracts([]);
    setProbations([]);
    localStorage.setItem("hr_contract_control_contracts", JSON.stringify([]));
    localStorage.setItem("hr_contract_control_probations", JSON.stringify([]));
    localStorage.setItem("hr_contract_control_initialized", "true");
    setIsInitialized(true);
    setActiveTab("dashboard");
  };

  const handleStartWithImport = () => {
    setContracts([]);
    setProbations([]);
    localStorage.setItem("hr_contract_control_contracts", JSON.stringify([]));
    localStorage.setItem("hr_contract_control_probations", JSON.stringify([]));
    localStorage.setItem("hr_contract_control_initialized", "true");
    setIsInitialized(true);
    setActiveTab("import-excel");
  };

  // CONTRACT CRUD
  const handleSaveContract = (savedItem: ContractItem) => {
    let updated: ContractItem[];
    const itemWithFlag = { ...savedItem };
    const exists = contracts.some(c => c.id === savedItem.id);
    if (exists) {
      updated = contracts.map(c => c.id === savedItem.id ? { ...itemWithFlag, isSampleData: c.isSampleData ?? false } : c);
    } else {
      updated = [{ ...itemWithFlag, isSampleData: false }, ...contracts];
    }
    syncWithStorage(updated, probations, simulationDate);
    setActiveTab("contracts");
    setEditingContract(null);
  };

  const handleDeleteContract = (id: string) => {
    const updated = contracts.filter(c => c.id !== id);
    syncWithStorage(updated, probations, simulationDate);
  };

  // PROBATION CRUD
  const handleSaveProbation = (savedItem: ProbationItem) => {
    let updated: ProbationItem[];
    const itemWithFlag = { ...savedItem };
    const exists = probations.some(p => p.id === savedItem.id);
    if (exists) {
      updated = probations.map(p => p.id === savedItem.id ? { ...itemWithFlag, isSampleData: p.isSampleData ?? false } : p);
    } else {
      updated = [{ ...itemWithFlag, isSampleData: false }, ...probations];
    }
    syncWithStorage(contracts, updated, simulationDate);
    setActiveTab("probation");
    setEditingProbation(null);
  };

  // PROBATION TO CONTRACT CONVERSION (ARC 3.3)
  const handleConvertProbationToContract = (newContract: ContractItem, updatedProbation: ProbationItem) => {
    const newContractWithFlag = { ...newContract, isSampleData: false };
    const updatedProbationWithFlag = { ...updatedProbation, isSampleData: updatedProbation.isSampleData ?? false };
    const updatedContracts = [newContractWithFlag, ...contracts];
    const updatedProbations = probations.map(p => p.id === updatedProbation.id ? updatedProbationWithFlag : p);
    syncWithStorage(updatedContracts, updatedProbations, simulationDate);
    setActiveTab("contracts");
  };

  const handleDeleteProbation = (id: string) => {
    const updated = probations.filter(p => p.id !== id);
    syncWithStorage(contracts, updated, simulationDate);
  };

  const handleImportComplete = (type: 'contract' | 'probation', finalItems: any[]) => {
    if (type === 'contract') {
      syncWithStorage(finalItems, probations, simulationDate);
      setActiveTab("contracts");
    } else {
      syncWithStorage(contracts, finalItems, simulationDate);
      setActiveTab("probation");
    }
  };

  // EXPORT CONTRACTS TO CSV
  const handleExportContracts = (items: ContractItem[]) => {
    const headers = [
      "Employee ID", "Employee Name", "Department", "Position", "Direct Manager",
      "Contract Type", "Contract Number", "Contract Start Date", "Contract End Date",
      "Days Remaining", "Compensation Review Needed", "Negotiation Status", "Negotiation Notes", "Payroll Follow-Up Notes",
      "User Recommendation", "Director Approval", "Head HR Review",
      "Contract Draft Date", "Contract Sent Date", "Signed Deadline", "Signed Received Date",
      "Contract Status", "Compensation Review Status", "HR PIC", "Priority", "Notes",
      "Created From", "Source Probation ID"
    ];

    const rows = items.map(c => [
      c.employeeId, c.employeeName, c.department, c.position, c.directManager,
      c.contractType, c.contractNumber, c.contractStartDate, c.contractEndDate,
      c.daysRemaining, c.compensationReviewNeeded ? "Yes" : "No", c.negotiationStatus || "No Negotiation", (c.negotiationNotes || "").replace(/[\n,]/g, " "), (c.payrollFollowUpNotes || "").replace(/[\n,]/g, " "),
      c.userRecommendation, c.directorApproval, c.headHRReview,
      c.contractDraftDate, c.contractSentDate, c.signedDeadline, c.signedReceivedDate,
      c.contractStatus, c.salaryNegotiationStatus, c.hrPic, c.priority, c.notes.replace(/[\n,]/g, " "),
      c.createdFrom || "", c.sourceProbationId || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(val => `"${val}"`).join(","))
    ].join("\n");

    triggerCSVDownload(csvContent, "contracts_control_list.csv");
  };

  // EXPORT PROBATIONS TO CSV
  const handleExportProbations = (items: ProbationItem[]) => {
    const headers = [
      "Employee ID", "Employee Name", "Department", "Position", "Direct Manager",
      "Probation Start Date", "Probation End Date", "Days Remaining", "Review Form Status",
      "User Recommendation", "Director Approval", "Final Decision", "New Employment Status",
      "HR PIC", "Probation Status", "Priority", "Notes", "Linked Contract ID"
    ];

    const rows = items.map(p => [
      p.employeeId, p.employeeName, p.department, p.position, p.directManager,
      p.probationStartDate, p.probationEndDate, p.daysRemaining, p.reviewFormStatus,
      p.userRecommendation, p.directorApproval, p.finalDecision, p.newEmploymentStatus,
      p.hrPic, p.probationStatus, p.priority, p.notes.replace(/[\n,]/g, " "),
      p.linkedContractId || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(val => `"${val}"`).join(","))
    ].join("\n");

    triggerCSVDownload(csvContent, "probations_control_list.csv");
  };

  const triggerCSVDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Notification / Badge numbers for Left Sidebar
  const urgentContractsCount = contracts.filter(c => c.priority === "Critical" || c.priority === "Overdue").length;
  const urgentProbationsCount = probations.filter(p => p.priority === "Critical" || p.priority === "Overdue").length;

  return (
    <div className="min-h-screen bg-slate-50 flex" id="app-layout">
      
      {/* Sidebar Layout */}
      <aside className="w-72 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800 shadow-xl" id="left-sidebar">
        <div>
          {/* Brand Logo and Title */}
          <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-display uppercase tracking-wider">Mifi HR Hub</h2>
              <span className="text-[10px] font-mono text-indigo-400 font-semibold tracking-widest uppercase">Contract Room</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <button
              id="sidebar-tab-dashboard"
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-indigo-600 text-white shadow-md font-semibold"
                  : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="h-4.5 w-4.5" />
                Dashboard
              </div>
              {(urgentContractsCount + urgentProbationsCount) > 0 && (
                <span className="inline-flex h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
              )}
            </button>

            <button
              id="sidebar-tab-contracts"
              onClick={() => setActiveTab("contracts")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === "contracts" || activeTab === "add-contract" || activeTab === "edit-contract"
                  ? "bg-slate-800 text-white font-semibold border-l-4 border-l-indigo-500"
                  : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="h-4.5 w-4.5 text-indigo-400" />
                Contracts Control
              </div>
              {urgentContractsCount > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white font-mono">
                  {urgentContractsCount}
                </span>
              )}
            </button>

            <button
              id="sidebar-tab-probation"
              onClick={() => setActiveTab("probation")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === "probation" || activeTab === "add-probation" || activeTab === "edit-probation"
                  ? "bg-slate-800 text-white font-semibold border-l-4 border-l-emerald-500"
                  : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <UserCheck className="h-4.5 w-4.5 text-emerald-400" />
                Probation Control
              </div>
              {urgentProbationsCount > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white font-mono">
                  {urgentProbationsCount}
                </span>
              )}
            </button>

            <button
              id="sidebar-tab-settings"
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === "settings"
                  ? "bg-slate-800 text-white font-semibold border-l-4 border-l-indigo-500"
                  : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <Sliders className="h-4.5 w-4.5 text-slate-400" />
                Master & Policy
              </div>
            </button>

            <button
              id="sidebar-tab-import-excel"
              onClick={() => setActiveTab("import-excel")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === "import-excel"
                  ? "bg-slate-800 text-white font-semibold border-l-4 border-l-indigo-500"
                  : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-4.5 w-4.5 text-indigo-400" />
                Import Excel
              </div>
            </button>

            <button
              id="sidebar-tab-email-center"
              onClick={() => setActiveTab("email-center")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === "email-center"
                  ? "bg-slate-800 text-white font-semibold border-l-4 border-l-indigo-500"
                  : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <Mail className="h-4.5 w-4.5 text-indigo-400" />
                Email Center
              </div>
            </button>
          </nav>
        </div>

        {/* Bottom Panel: Simulation Date Picker & Sandbox Controls */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-4">
          
          {/* Simulation Date Picker */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              <Calendar className="h-3.5 w-3.5 text-indigo-400" />
              SLA Reference Date
            </div>
            <input
              type="date"
              id="simulation-date-picker"
              value={simulationDate}
              onChange={(e) => handleSimulationDateChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 font-mono focus:ring-1 focus:ring-indigo-500 transition outline-none"
            />
            <p className="text-[10px] text-slate-500 leading-normal font-sans">
              All remaining days and SLA alerts calculate dynamically based on this simulated date.
            </p>
          </div>

          {/* Reset Sandbox Data */}
          <button
            onClick={handleResetToSeeds}
            id="reset-sandbox-btn"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500 hover:text-white rounded-lg border border-rose-500/20 transition cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Sandbox Data
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0" id="main-content-wrapper">
        
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shrink-0 shadow-xs" id="main-header">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-slate-900 font-display">HR Contract Control Room</span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              <ShieldCheck className="h-3 w-3" />
              Corporate MVP
            </span>
          </div>

          {/* Active User session widget info */}
          <div className="flex items-center gap-4 text-xs">
            <div className="hidden md:flex flex-col text-right">
              <span className="font-semibold text-slate-800">hrdjavamifi@gmail.com</span>
              <span className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-widest">HR Administrator</span>
            </div>
            <div className="h-9 w-9 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm">
              HR
            </div>
          </div>
        </header>

        {/* Dynamic Content Views */}
        <main className="flex-1 overflow-y-auto p-8" id="main-scroller">
          {!isInitialized ? (
            <div className="max-w-4xl mx-auto py-12 px-4 space-y-8 animate-fade-in" id="onboarding-view">
              <div className="text-center space-y-3">
                <div className="h-16 w-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                  <Database className="h-8 w-8" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 font-display">Welcome to HR Contract Control Room</h1>
                <p className="text-slate-500 max-w-lg mx-auto text-sm">
                  Initialize your workforce database. Start fresh with a blank template, load sandbox sample data, or import your existing Excel/CSV spreadsheet.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Option 1: Load Sample */}
                <div className="bg-white border border-indigo-100 hover:border-indigo-300 rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                      <Sliders className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 font-display">Load Sample Data</h3>
                    <p className="text-xs text-slate-500 leading-normal">
                      Populate with realistic sample contracts, evaluation SLAs, and test workflows. Best for exploring capabilities.
                    </p>
                  </div>
                  <button
                    onClick={handleLoadSampleData}
                    id="btn-onboarding-load-sample"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition"
                  >
                    Load Sample Data
                  </button>
                </div>

                {/* Option 2: Import Excel */}
                <div className="bg-white border border-emerald-100 hover:border-emerald-300 rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 font-display">Import Excel / CSV</h3>
                    <p className="text-xs text-slate-500 leading-normal">
                      Map, clean, and import your own employee PKWT/probation spreadsheet using our smart column-matching importer.
                    </p>
                  </div>
                  <button
                    onClick={handleStartWithImport}
                    id="btn-onboarding-import"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition"
                  >
                    Import Spreadsheet
                  </button>
                </div>

                {/* Option 3: Start Blank */}
                <div className="bg-white border border-slate-100 hover:border-slate-300 rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="h-10 w-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center">
                      <FileText className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 font-display">Start Blank</h3>
                    <p className="text-xs text-slate-500 leading-normal">
                      Start with a completely empty database. Manually input your personnel details and build your active trackers from scratch.
                    </p>
                  </div>
                  <button
                    onClick={handleStartBlank}
                    id="btn-onboarding-blank"
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition"
                  >
                    Start Blank
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {activeTab === "dashboard" && (
            <DashboardView
              contracts={contracts}
              probations={probations}
              onNavigateToContracts={() => setActiveTab("contracts")}
              onNavigateToProbation={() => setActiveTab("probation")}
              onEditContract={(c) => {
                setEditingContract(c);
                setActiveTab("edit-contract");
              }}
              onEditProbation={(p) => {
                setEditingProbation(p);
                setActiveTab("edit-probation");
              }}
            />
          )}

          {activeTab === "contracts" && (
            <ContractTrackerView
              contracts={contracts}
              onAddContract={() => {
                setEditingContract(null);
                setActiveTab("add-contract");
              }}
              onEditContract={(c) => {
                setEditingContract(c);
                setActiveTab("edit-contract");
              }}
              onDeleteContract={handleDeleteContract}
              onExportCSV={handleExportContracts}
            />
          )}

          {activeTab === "probation" && (
            <ProbationTrackerView
              probations={probations}
              contracts={contracts}
              onAddProbation={() => {
                setEditingProbation(null);
                setActiveTab("add-probation");
              }}
              onEditProbation={(p) => {
                setEditingProbation(p);
                setActiveTab("edit-probation");
              }}
              onDeleteProbation={handleDeleteProbation}
              onExportCSV={handleExportProbations}
              onConvertProbationToContract={handleConvertProbationToContract}
            />
          )}

          {activeTab === "settings" && (
            <SettingsView
              contracts={contracts}
              probations={probations}
              onClearSampleData={handleClearSampleData}
              onClearAllData={handleClearAllData}
              onResetToSampleData={handleResetToSampleData}
            />
          )}

          {activeTab === "add-contract" && (
            <ContractForm
              contractToEdit={null}
              onSave={handleSaveContract}
              onCancel={() => setActiveTab("contracts")}
            />
          )}

          {activeTab === "edit-contract" && (
            <ContractForm
              contractToEdit={editingContract}
              onSave={handleSaveContract}
              onCancel={() => setActiveTab("contracts")}
            />
          )}

          {activeTab === "add-probation" && (
            <ProbationForm
              probationToEdit={null}
              onSave={handleSaveProbation}
              onCancel={() => setActiveTab("probation")}
            />
          )}

          {activeTab === "edit-probation" && (
            <ProbationForm
              probationToEdit={editingProbation}
              onSave={handleSaveProbation}
              onCancel={() => setActiveTab("probation")}
            />
          )}

          {activeTab === "import-excel" && (
            <ImportExcelView
              existingContracts={contracts}
              existingProbations={probations}
              simulationDate={simulationDate}
              onImportComplete={handleImportComplete}
              onCancel={() => setActiveTab("dashboard")}
            />
          )}

          {activeTab === "email-center" && (
            <EmailCenterView
              contracts={contracts}
              probations={probations}
              simulationDate={simulationDate}
              onUpdateContracts={(updated) => syncWithStorage(updated, probations, simulationDate)}
              onUpdateProbations={(updated) => syncWithStorage(contracts, updated, simulationDate)}
            />
          )}
          </>
          )}
        </main>
      </div>

    </div>
  );
}
