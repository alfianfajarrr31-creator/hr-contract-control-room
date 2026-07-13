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
import { INITIAL_CONTRACTS, INITIAL_PROBATIONS, HR_PICS as DEFAULT_HR_PICS } from "./seedData";
import { DashboardView } from "./components/DashboardView";
import { ContractTrackerView } from "./components/ContractTrackerView";
import { ProbationTrackerView } from "./components/ProbationTrackerView";
import { ContractForm } from "./components/ContractForm";
import { ProbationForm } from "./components/ProbationForm";
import { SettingsView } from "./components/SettingsView";
import { ImportExcelView } from "./components/ImportExcelView";
import { EmailCenterView } from "./components/EmailCenterView";
import { ExitTrackerView } from "./components/ExitTrackerView";
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
  Database,
  LogOut
} from "lucide-react";

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "contracts" | "probation" | "settings" | "add-contract" | "edit-contract" | "add-probation" | "edit-probation" | "import-excel" | "email-center" | "exit-tracker"
  >("dashboard");

  // Core Data States
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [probations, setProbations] = useState<ProbationItem[]>([]);
  
  // HR PIC Master List State
  const [hrPics, setHrPics] = useState<string[]>([]);

  // Department and Direct Manager Master List States (ARC 3.7)
  const [departments, setDepartments] = useState<string[]>([]);
  const [directManagers, setDirectManagers] = useState<string[]>([]);
  
  // Simulation Mode state (defaulting to false unless explicitly enabled)
  const [simulationModeEnabled, setSimulationModeEnabled] = useState<boolean>(() => {
    return localStorage.getItem("hr_contract_control_simmode_enabled") === "true";
  });

  // Simulation Date (defaulting dynamically to today's date)
  const [simulationDate, setSimulationDate] = useState<string>(getTodayDateStr());

  // Exit Form Links (ARC 3.8)
  const [accessAssetFormLink, setAccessAssetFormLink] = useState<string>(
    () => localStorage.getItem("hrcc_access_asset_form_link") || ""
  );
  const [exitClearanceFormLink, setExitClearanceFormLink] = useState<string>(
    () => localStorage.getItem("hrcc_exit_clearance_form_link") || ""
  );
  const [exitInterviewFormLink, setExitInterviewFormLink] = useState<string>(
    () => localStorage.getItem("hrcc_exit_interview_form_link") || ""
  );

  const handleUpdateExitLinks = (accessAsset: string, exitClearance: string, exitInterview: string) => {
    setAccessAssetFormLink(accessAsset);
    setExitClearanceFormLink(exitClearance);
    setExitInterviewFormLink(exitInterview);
    localStorage.setItem("hrcc_access_asset_form_link", accessAsset);
    localStorage.setItem("hrcc_exit_clearance_form_link", exitClearance);
    localStorage.setItem("hrcc_exit_interview_form_link", exitInterview);
  };

  // Edit Item Holders
  const [editingContract, setEditingContract] = useState<ContractItem | null>(null);
  const [editingProbation, setEditingProbation] = useState<ProbationItem | null>(null);
  const [navigationSearchTerm, setNavigationSearchTerm] = useState<string>("");

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
    const savedSimMode = localStorage.getItem("hr_contract_control_simmode_enabled");
    const hasInitializedFlag = localStorage.getItem("hr_contract_control_initialized") === "true";

    const simMode = savedSimMode === "true";
    setSimulationModeEnabled(simMode);

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

    // Process SLAs based on the simulation date (conditional on Simulation Mode being active)
    const refDate = simMode ? simDate : getTodayDateStr();

    const updatedContracts = rawContracts.map(c => {
      const sla = computeContractSLA(c.contractEndDate, c.contractStatus, refDate);
      return {
        ...c,
        daysRemaining: sla.daysRemaining,
        priority: sla.priority,
      };
    });

    const updatedProbations = rawProbations.map(p => {
      const sla = computeProbationSLA(p.probationEndDate, p.finalDecision, refDate);
      return {
        ...p,
        daysRemaining: sla.daysRemaining,
        priority: sla.priority
      };
    });

    setContracts(updatedContracts);
    setProbations(updatedProbations);

    // Load HR PIC list
    const savedPicsStr = localStorage.getItem("hrcc_hr_pic_list");
    let initialPics: string[] = [];
    if (savedPicsStr) {
      try {
        initialPics = JSON.parse(savedPicsStr);
      } catch (e) {
        initialPics = [];
      }
    }

    if (!initialPics || initialPics.length === 0) {
      const collected = new Set<string>();
      
      // Default list should contain: "HR Team", "Alfian", "Head HR", and existing defaults
      const defaultPics = ["HR Team", "Alfian", "Head HR", "Siti Rahma", "Rian Hidayat", "Ahmad Fauzi"];
      defaultPics.forEach(pic => collected.add(pic.trim()));

      // Merge from existing contracts and probations
      updatedContracts.forEach(c => { if (c.hrPic) collected.add(c.hrPic.trim()); });
      updatedProbations.forEach(p => { if (p.hrPic) collected.add(p.hrPic.trim()); });

      initialPics = Array.from(collected).filter(p => p && p.toLowerCase() !== "all hr pics");
      localStorage.setItem("hrcc_hr_pic_list", JSON.stringify(initialPics));
    }
    setHrPics(initialPics);

    // Load Department list (ARC 3.7)
    const savedDeptStr = localStorage.getItem("hrcc_department_list");
    let initialDepts: string[] = [];
    if (savedDeptStr) {
      try {
        initialDepts = JSON.parse(savedDeptStr);
      } catch (e) {
        initialDepts = [];
      }
    }

    if (!initialDepts || initialDepts.length === 0) {
      const collected = new Set<string>();
      const defaultDepts = ["HR", "Finance", "Operations", "Sales", "Marketing", "IT", "Customer Service", "Warehouse", "Airport", "General Affairs"];
      defaultDepts.forEach(d => collected.add(d.trim()));

      // Merge from existing contracts and probations
      updatedContracts.forEach(c => { if (c.department) collected.add(c.department.trim()); });
      updatedProbations.forEach(p => { if (p.department) collected.add(p.department.trim()); });

      initialDepts = Array.from(collected).filter(d => d && d.toLowerCase() !== "all departments");
      localStorage.setItem("hrcc_department_list", JSON.stringify(initialDepts));
    }
    setDepartments(initialDepts);

    // Load Direct Manager list (ARC 3.7)
    const savedMgrStr = localStorage.getItem("hrcc_direct_manager_list");
    let initialMgrs: string[] = [];
    if (savedMgrStr) {
      try {
        initialMgrs = JSON.parse(savedMgrStr);
      } catch (e) {
        initialMgrs = [];
      }
    }

    if (!initialMgrs || initialMgrs.length === 0) {
      const collected = new Set<string>();
      const defaultMgrs = ["Management", "Head HR", "Direct Manager", "User", "Department Head"];
      defaultMgrs.forEach(m => collected.add(m.trim()));

      // Merge from existing contracts and probations
      updatedContracts.forEach(c => { if (c.directManager) collected.add(c.directManager.trim()); });
      updatedProbations.forEach(p => { if (p.directManager) collected.add(p.directManager.trim()); });

      initialMgrs = Array.from(collected).filter(m => m && m.toLowerCase() !== "all direct managers");
      localStorage.setItem("hrcc_direct_manager_list", JSON.stringify(initialMgrs));
    }
    setDirectManagers(initialMgrs);
  }, []);

  // Save data to localStorage whenever core data changes, but we'll also update priority/days based on date
  const syncWithStorage = (
    updatedC: ContractItem[],
    updatedP: ProbationItem[],
    currentSimDate: string,
    currentSimMode: boolean = simulationModeEnabled
  ) => {
    const refDate = currentSimMode ? currentSimDate : getTodayDateStr();

    // Process SLAs before saving
    const finalC = updatedC.map(c => {
      const sla = computeContractSLA(c.contractEndDate, c.contractStatus, refDate);
      return {
        ...c,
        daysRemaining: sla.daysRemaining,
        priority: sla.priority
      };
    });

    const finalP = updatedP.map(p => {
      const sla = computeProbationSLA(p.probationEndDate, p.finalDecision, refDate);
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
    localStorage.setItem("hr_contract_control_simmode_enabled", currentSimMode ? "true" : "false");

    // Auto-scan for any new HR PICs that aren't currently in hrPics and add them!
    const uniqueNewPics = new Set<string>();
    finalC.forEach(c => { if (c.hrPic) uniqueNewPics.add(c.hrPic.trim()); });
    finalP.forEach(p => { if (p.hrPic) uniqueNewPics.add(p.hrPic.trim()); });

    setHrPics(prev => {
      let changed = false;
      const nextPics = [...prev];
      uniqueNewPics.forEach(pic => {
        if (pic && pic.toLowerCase() !== "all hr pics" && !nextPics.some(p => p.trim().toLowerCase() === pic.toLowerCase())) {
          nextPics.push(pic);
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem("hrcc_hr_pic_list", JSON.stringify(nextPics));
        return nextPics;
      }
      return prev;
    });

    // Auto-scan for any new Departments that aren't currently in departments and add them! (ARC 3.7)
    const uniqueNewDepts = new Set<string>();
    finalC.forEach(c => { if (c.department) uniqueNewDepts.add(c.department.trim()); });
    finalP.forEach(p => { if (p.department) uniqueNewDepts.add(p.department.trim()); });

    setDepartments(prev => {
      let changed = false;
      const nextDepts = [...prev];
      uniqueNewDepts.forEach(dept => {
        if (dept && dept.toLowerCase() !== "all departments" && !nextDepts.some(d => d.trim().toLowerCase() === dept.toLowerCase())) {
          nextDepts.push(dept);
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem("hrcc_department_list", JSON.stringify(nextDepts));
        return nextDepts;
      }
      return prev;
    });

    // Auto-scan for any new Direct Managers that aren't currently in directManagers and add them! (ARC 3.7)
    const uniqueNewMgrs = new Set<string>();
    finalC.forEach(c => { if (c.directManager) uniqueNewMgrs.add(c.directManager.trim()); });
    finalP.forEach(p => { if (p.directManager) uniqueNewMgrs.add(p.directManager.trim()); });

    setDirectManagers(prev => {
      let changed = false;
      const nextMgrs = [...prev];
      uniqueNewMgrs.forEach(mgr => {
        if (mgr && mgr.toLowerCase() !== "all direct managers" && !nextMgrs.some(m => m.trim().toLowerCase() === mgr.toLowerCase())) {
          nextMgrs.push(mgr);
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem("hrcc_direct_manager_list", JSON.stringify(nextMgrs));
        return nextMgrs;
      }
      return prev;
    });
  };

  // Handle Simulation Date Change
  const handleSimulationDateChange = (newDate: string) => {
    setSimulationDate(newDate);
    // Recompute all on change
    syncWithStorage(contracts, probations, newDate, simulationModeEnabled);
  };

  // HR PIC Management Handlers
  const handleAddHrPic = (name: string): string | null => {
    const trimmed = name.trim();
    if (!trimmed) {
      return "Nama HR PIC tidak boleh kosong.";
    }
    if (trimmed.toLowerCase() === "all hr pics") {
      return "Nama 'All HR PICs' dicadangkan untuk filter sistem.";
    }
    const isDuplicate = hrPics.some(p => p.trim().toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) {
      return "Nama HR PIC sudah terdaftar di master list (tidak boleh duplikat).";
    }

    const updated = [...hrPics, trimmed];
    setHrPics(updated);
    localStorage.setItem("hrcc_hr_pic_list", JSON.stringify(updated));
    return null;
  };

  const handleEditHrPic = (oldName: string, newName: string): string | null => {
    const trimmedOld = oldName.trim();
    const trimmedNew = newName.trim();
    if (!trimmedNew) {
      return "Nama baru tidak boleh kosong.";
    }
    if (trimmedNew.toLowerCase() === "all hr pics") {
      return "Nama 'All HR PICs' dicadangkan untuk filter sistem.";
    }
    if (trimmedOld.toLowerCase() === trimmedNew.toLowerCase()) {
      return null; // No change needed
    }
    const isDuplicate = hrPics.some(p => p.trim().toLowerCase() === trimmedNew.toLowerCase() && p.trim().toLowerCase() !== trimmedOld.toLowerCase());
    if (isDuplicate) {
      return "Nama HR PIC baru sudah terdaftar di master list.";
    }

    // 1. Update in master list
    const updatedPics = hrPics.map(pic => pic.trim().toLowerCase() === trimmedOld.toLowerCase() ? trimmedNew : pic);
    setHrPics(updatedPics);
    localStorage.setItem("hrcc_hr_pic_list", JSON.stringify(updatedPics));

    // 2. Update in contracts and probations
    const updatedC = contracts.map(c => {
      if (c.hrPic && c.hrPic.trim().toLowerCase() === trimmedOld.toLowerCase()) {
        return { ...c, hrPic: trimmedNew };
      }
      return c;
    });

    const updatedP = probations.map(p => {
      if (p.hrPic && p.hrPic.trim().toLowerCase() === trimmedOld.toLowerCase()) {
        return { ...p, hrPic: trimmedNew };
      }
      return p;
    });

    syncWithStorage(updatedC, updatedP, simulationDate);
    return null;
  };

  const handleDeleteHrPic = (name: string) => {
    const trimmed = name.trim();
    const updatedPics = hrPics.filter(pic => pic.trim().toLowerCase() !== trimmed.toLowerCase());
    setHrPics(updatedPics);
    localStorage.setItem("hrcc_hr_pic_list", JSON.stringify(updatedPics));
  };

  // Department Management Handlers (ARC 3.7)
  const handleAddDepartment = (name: string): string | null => {
    const trimmed = name.trim();
    if (!trimmed) {
      return "Nama Department tidak boleh kosong.";
    }
    if (trimmed.toLowerCase() === "all departments") {
      return "Nama 'All Departments' dicadangkan untuk filter sistem.";
    }
    const isDuplicate = departments.some(d => d.trim().toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) {
      return "Department sudah terdaftar di master list (tidak boleh duplikat).";
    }

    const updated = [...departments, trimmed];
    setDepartments(updated);
    localStorage.setItem("hrcc_department_list", JSON.stringify(updated));
    return null;
  };

  const handleEditDepartment = (oldName: string, newName: string): string | null => {
    const trimmedOld = oldName.trim();
    const trimmedNew = newName.trim();
    if (!trimmedNew) {
      return "Nama Department baru tidak boleh kosong.";
    }
    if (trimmedNew.toLowerCase() === "all departments") {
      return "Nama 'All Departments' dicadangkan untuk filter sistem.";
    }
    if (trimmedOld.toLowerCase() === trimmedNew.toLowerCase()) {
      return null; // No change needed
    }
    const isDuplicate = departments.some(d => d.trim().toLowerCase() === trimmedNew.toLowerCase() && d.trim().toLowerCase() !== trimmedOld.toLowerCase());
    if (isDuplicate) {
      return "Nama Department baru sudah terdaftar di master list.";
    }

    // 1. Update in master list
    const updatedDepts = departments.map(d => d.trim().toLowerCase() === trimmedOld.toLowerCase() ? trimmedNew : d);
    setDepartments(updatedDepts);
    localStorage.setItem("hrcc_department_list", JSON.stringify(updatedDepts));

    // 2. Cascade update in contracts and probations
    const updatedC = contracts.map(c => {
      if (c.department && c.department.trim().toLowerCase() === trimmedOld.toLowerCase()) {
        return { ...c, department: trimmedNew };
      }
      return c;
    });

    const updatedP = probations.map(p => {
      if (p.department && p.department.trim().toLowerCase() === trimmedOld.toLowerCase()) {
        return { ...p, department: trimmedNew };
      }
      return p;
    });

    syncWithStorage(updatedC, updatedP, simulationDate);
    return null;
  };

  const handleDeleteDepartment = (name: string) => {
    const trimmed = name.trim();
    const updatedDepts = departments.filter(d => d.trim().toLowerCase() !== trimmed.toLowerCase());
    setDepartments(updatedDepts);
    localStorage.setItem("hrcc_department_list", JSON.stringify(updatedDepts));
  };

  // Direct Manager Management Handlers (ARC 3.7)
  const handleAddDirectManager = (name: string): string | null => {
    const trimmed = name.trim();
    if (!trimmed) {
      return "Nama Direct Manager tidak boleh kosong.";
    }
    if (trimmed.toLowerCase() === "all direct managers") {
      return "Nama 'All Direct Managers' dicadangkan untuk filter sistem.";
    }
    const isDuplicate = directManagers.some(m => m.trim().toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) {
      return "Direct Manager sudah terdaftar di master list (tidak boleh duplikat).";
    }

    const updated = [...directManagers, trimmed];
    setDirectManagers(updated);
    localStorage.setItem("hrcc_direct_manager_list", JSON.stringify(updated));
    return null;
  };

  const handleEditDirectManager = (oldName: string, newName: string): string | null => {
    const trimmedOld = oldName.trim();
    const trimmedNew = newName.trim();
    if (!trimmedNew) {
      return "Nama Direct Manager baru tidak boleh kosong.";
    }
    if (trimmedNew.toLowerCase() === "all direct managers") {
      return "Nama 'All Direct Managers' dicadangkan untuk filter sistem.";
    }
    if (trimmedOld.toLowerCase() === trimmedNew.toLowerCase()) {
      return null; // No change needed
    }
    const isDuplicate = directManagers.some(m => m.trim().toLowerCase() === trimmedNew.toLowerCase() && m.trim().toLowerCase() !== trimmedOld.toLowerCase());
    if (isDuplicate) {
      return "Nama Direct Manager baru sudah terdaftar di master list.";
    }

    // 1. Update in master list
    const updatedMgrs = directManagers.map(m => m.trim().toLowerCase() === trimmedOld.toLowerCase() ? trimmedNew : m);
    setDirectManagers(updatedMgrs);
    localStorage.setItem("hrcc_direct_manager_list", JSON.stringify(updatedMgrs));

    // 2. Cascade update in contracts and probations
    const updatedC = contracts.map(c => {
      if (c.directManager && c.directManager.trim().toLowerCase() === trimmedOld.toLowerCase()) {
        return { ...c, directManager: trimmedNew };
      }
      return c;
    });

    const updatedP = probations.map(p => {
      if (p.directManager && p.directManager.trim().toLowerCase() === trimmedOld.toLowerCase()) {
        return { ...p, directManager: trimmedNew };
      }
      return p;
    });

    syncWithStorage(updatedC, updatedP, simulationDate);
    return null;
  };

  const handleDeleteDirectManager = (name: string) => {
    const trimmed = name.trim();
    const updatedMgrs = directManagers.filter(m => m.trim().toLowerCase() !== trimmed.toLowerCase());
    setDirectManagers(updatedMgrs);
    localStorage.setItem("hrcc_direct_manager_list", JSON.stringify(updatedMgrs));
  };

  const handleUpdateContractInline = (updatedC: ContractItem) => {
    const nextContracts = contracts.map(c => c.id === updatedC.id ? updatedC : c);
    syncWithStorage(nextContracts, probations, simulationDate);
  };

  const handleUpdateProbationInline = (updatedP: ProbationItem) => {
    const nextProbations = probations.map(p => p.id === updatedP.id ? updatedP : p);
    syncWithStorage(contracts, nextProbations, simulationDate);
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
      "Created From", "Source Probation ID",
      "End Reason", "Notice Date", "Last Working Date", "Exit Process Status",
      "Access/Asset Form Sent Date", "Access/Asset Form Completed Date", "Asset Return Required", "Asset Return Status", "Access Closure Status",
      "Exit Clearance Form Sent Date", "Exit Clearance Completed Date", "Exit Interview Form Sent Date", "Exit Interview Status", "Exit Interview Completed Date",
      "Exit Notes", "Closed Date"
    ];

    const rows = items.map(c => [
      c.employeeId, c.employeeName, c.department, c.position, c.directManager,
      c.contractType, c.contractNumber, c.contractStartDate, c.contractEndDate,
      c.daysRemaining, c.compensationReviewNeeded ? "Yes" : "No", c.negotiationStatus || "No Negotiation", (c.negotiationNotes || "").replace(/[\n,]/g, " "), (c.payrollFollowUpNotes || "").replace(/[\n,]/g, " "),
      c.userRecommendation, c.directorApproval, c.headHRReview,
      c.contractDraftDate, c.contractSentDate, c.signedDeadline, c.signedReceivedDate,
      c.contractStatus, c.salaryNegotiationStatus, c.hrPic, c.priority, c.notes.replace(/[\n,]/g, " "),
      c.createdFrom || "", c.sourceProbationId || "",
      c.endReason || "", c.noticeDate || "", c.lastWorkingDate || "", c.exitProcessStatus || "",
      c.accessAssetFormSentDate || "", c.accessAssetFormCompletedDate || "", c.assetReturnRequired || "", c.assetReturnStatus || "", c.accessClosureStatus || "",
      c.exitClearanceFormSentDate || "", c.exitClearanceCompletedDate || "", c.exitInterviewFormSentDate || "", c.exitInterviewStatus || "", c.exitInterviewCompletedDate || "",
      (c.exitNotes || "").replace(/[\n,]/g, " "), c.closedDate || ""
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
      "HR PIC", "Probation Status", "Priority", "Notes", "Linked Contract ID",
      "End Reason", "Notice Date", "Last Working Date", "Exit Process Status",
      "Access/Asset Form Sent Date", "Access/Asset Form Completed Date", "Asset Return Required", "Asset Return Status", "Access Closure Status",
      "Exit Clearance Form Sent Date", "Exit Clearance Completed Date", "Exit Interview Form Sent Date", "Exit Interview Status", "Exit Interview Completed Date",
      "Exit Notes", "Closed Date"
    ];

    const rows = items.map(p => [
      p.employeeId, p.employeeName, p.department, p.position, p.directManager,
      p.probationStartDate, p.probationEndDate, p.daysRemaining, p.reviewFormStatus,
      p.userRecommendation, p.directorApproval, p.finalDecision, p.newEmploymentStatus,
      p.hrPic, p.probationStatus, p.priority, p.notes.replace(/[\n,]/g, " "),
      p.linkedContractId || "",
      p.endReason || "", p.noticeDate || "", p.lastWorkingDate || "", p.exitProcessStatus || "",
      p.accessAssetFormSentDate || "", p.accessAssetFormCompletedDate || "", p.assetReturnRequired || "", p.assetReturnStatus || "", p.accessClosureStatus || "",
      p.exitClearanceFormSentDate || "", p.exitClearanceCompletedDate || "", p.exitInterviewFormSentDate || "", p.exitInterviewStatus || "", p.exitInterviewCompletedDate || "",
      (p.exitNotes || "").replace(/[\n,]/g, " "), p.closedDate || ""
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

  const isContractExit = (c: ContractItem) => {
    return c.contractStatus === "Resigned" ||
      c.contractStatus === "Not Renewed" ||
      c.contractStatus === "Employee Declined" ||
      c.contractStatus === "End Process" ||
      c.contractStatus === "Exit Process" ||
      c.contractStatus === "Closed" ||
      (c.endReason !== undefined && c.endReason.trim() !== "") ||
      (c.exitProcessStatus !== undefined && c.exitProcessStatus.trim() !== "" && c.exitProcessStatus !== "Not Started");
  };

  const isProbationExit = (p: ProbationItem) => {
    return p.probationStatus === "Resigned" ||
      p.probationStatus === "Not Continued" ||
      p.probationStatus === "Failed Probation" ||
      p.probationStatus === "End Process" ||
      p.probationStatus === "Exit Process" ||
      p.probationStatus === "Closed" ||
      (p.endReason !== undefined && p.endReason.trim() !== "") ||
      (p.exitProcessStatus !== undefined && p.exitProcessStatus.trim() !== "" && p.exitProcessStatus !== "Not Started");
  };

  const activeExitCount = [
    ...contracts.filter(isContractExit),
    ...probations.filter(isProbationExit)
  ].filter(row => row.exitProcessStatus !== "Closed" && row.closedDate === undefined).length;

  const effectiveToday = simulationModeEnabled ? simulationDate : getTodayDateStr();

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
              id="sidebar-tab-exit-tracker"
              onClick={() => setActiveTab("exit-tracker")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === "exit-tracker"
                  ? "bg-slate-800 text-white font-semibold border-l-4 border-l-rose-500"
                  : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <LogOut className="h-4.5 w-4.5 text-rose-400" />
                Exit Tracker
              </div>
              {activeExitCount > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white font-mono">
                  {activeExitCount}
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
          
          {/* Simulation Mode Toggle and controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Simulation Mode</span>
              <button
                onClick={() => {
                  const nextVal = !simulationModeEnabled;
                  setSimulationModeEnabled(nextVal);
                  localStorage.setItem("hr_contract_control_simmode_enabled", nextVal ? "true" : "false");
                  syncWithStorage(contracts, probations, simulationDate, nextVal);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase transition border cursor-pointer ${
                  simulationModeEnabled
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                    : "bg-slate-800 text-slate-500 border-slate-700/50"
                }`}
              >
                {simulationModeEnabled ? "Active" : "Disabled"}
              </button>
            </div>

            {simulationModeEnabled ? (
              <div className="space-y-2 animate-fade-in">
                <input
                  type="date"
                  id="simulation-date-picker"
                  value={simulationDate}
                  onChange={(e) => handleSimulationDateChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 font-mono focus:ring-1 focus:ring-indigo-500 transition outline-none"
                />
                <button
                  onClick={() => {
                    const todayStr = getTodayDateStr();
                    handleSimulationDateChange(todayStr);
                  }}
                  className="w-full py-1 bg-slate-800 hover:bg-slate-750 text-[10px] font-semibold text-slate-300 rounded border border-slate-700/50 transition cursor-pointer"
                >
                  Set to Today ({getTodayDateStr()})
                </button>
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 leading-normal font-sans">
                Currently using today's real-time date <strong className="font-mono">{getTodayDateStr()}</strong> for all calculations.
              </p>
            )}
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

        {/* Simulation Mode Active Banner */}
        {simulationModeEnabled && (
          <div className="bg-amber-50 border-b border-amber-200 px-8 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-amber-800 text-xs font-medium animate-fade-in" id="simulation-mode-banner">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span>
                <strong>Simulation Mode Active:</strong> Currently calculating all SLAs using reference date <span className="font-mono bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-bold">{simulationDate}</span> instead of today's real date.
              </span>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                onClick={() => {
                  const todayStr = getTodayDateStr();
                  handleSimulationDateChange(todayStr);
                }}
                className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-semibold transition cursor-pointer border border-amber-300"
              >
                Use Today ({getTodayDateStr()})
              </button>
              <button
                onClick={() => {
                  setSimulationModeEnabled(false);
                  localStorage.setItem("hr_contract_control_simmode_enabled", "false");
                  syncWithStorage(contracts, probations, simulationDate, false);
                }}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold transition cursor-pointer"
              >
                Disable Simulation Mode
              </button>
            </div>
          </div>
        )}

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
              simulationDate={effectiveToday}
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
              simulationDate={effectiveToday}
              hrPics={hrPics}
              departments={departments}
              directManagers={directManagers}
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
              onUpdateContract={handleUpdateContractInline}
              onViewExitProcess={(employeeName) => {
                setNavigationSearchTerm(employeeName);
                setActiveTab("exit-tracker");
              }}
              initialSearchTerm={navigationSearchTerm}
              onClearInitialSearch={() => setNavigationSearchTerm("")}
            />
          )}

          {activeTab === "probation" && (
            <ProbationTrackerView
              probations={probations}
              contracts={contracts}
              simulationDate={effectiveToday}
              hrPics={hrPics}
              departments={departments}
              directManagers={directManagers}
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
              onUpdateProbation={handleUpdateProbationInline}
              onViewExitProcess={(employeeName) => {
                setNavigationSearchTerm(employeeName);
                setActiveTab("exit-tracker");
              }}
              initialSearchTerm={navigationSearchTerm}
              onClearInitialSearch={() => setNavigationSearchTerm("")}
            />
          )}

          {activeTab === "settings" && (
            <SettingsView
              contracts={contracts}
              probations={probations}
              hrPics={hrPics}
              onAddHrPic={handleAddHrPic}
              onEditHrPic={handleEditHrPic}
              onDeleteHrPic={handleDeleteHrPic}
              departments={departments}
              onAddDepartment={handleAddDepartment}
              onEditDepartment={handleEditDepartment}
              onDeleteDepartment={handleDeleteDepartment}
              directManagers={directManagers}
              onAddDirectManager={handleAddDirectManager}
              onEditDirectManager={handleEditDirectManager}
              onDeleteDirectManager={handleDeleteDirectManager}
              onClearSampleData={handleClearSampleData}
              onClearAllData={handleClearAllData}
              onResetToSampleData={handleResetToSampleData}
              accessAssetFormLink={accessAssetFormLink}
              exitClearanceFormLink={exitClearanceFormLink}
              exitInterviewFormLink={exitInterviewFormLink}
              onUpdateExitLinks={handleUpdateExitLinks}
            />
          )}

          {activeTab === "add-contract" && (
            <ContractForm
              contractToEdit={null}
              existingContracts={contracts}
              hrPics={hrPics}
              departments={departments}
              directManagers={directManagers}
              onSave={handleSaveContract}
              onCancel={() => setActiveTab("contracts")}
            />
          )}

          {activeTab === "edit-contract" && (
            <ContractForm
              contractToEdit={editingContract}
              existingContracts={contracts}
              hrPics={hrPics}
              departments={departments}
              directManagers={directManagers}
              onSave={handleSaveContract}
              onCancel={() => setActiveTab("contracts")}
            />
          )}

          {activeTab === "add-probation" && (
            <ProbationForm
              probationToEdit={null}
              hrPics={hrPics}
              departments={departments}
              directManagers={directManagers}
              onSave={handleSaveProbation}
              onCancel={() => setActiveTab("probation")}
            />
          )}

          {activeTab === "edit-probation" && (
            <ProbationForm
              probationToEdit={editingProbation}
              hrPics={hrPics}
              departments={departments}
              directManagers={directManagers}
              onSave={handleSaveProbation}
              onCancel={() => setActiveTab("probation")}
            />
          )}

          {activeTab === "import-excel" && (
            <ImportExcelView
              existingContracts={contracts}
              existingProbations={probations}
              simulationDate={effectiveToday}
              onImportComplete={handleImportComplete}
              onCancel={() => setActiveTab("dashboard")}
            />
          )}

          {activeTab === "email-center" && (
            <EmailCenterView
              contracts={contracts}
              probations={probations}
              simulationDate={effectiveToday}
              onUpdateContracts={(updated) => syncWithStorage(updated, probations, simulationDate, simulationModeEnabled)}
              onUpdateProbations={(updated) => syncWithStorage(contracts, updated, simulationDate, simulationModeEnabled)}
              accessAssetFormLink={accessAssetFormLink}
              exitClearanceFormLink={exitClearanceFormLink}
              exitInterviewFormLink={exitInterviewFormLink}
            />
          )}

          {activeTab === "exit-tracker" && (
            <ExitTrackerView
              contracts={contracts}
              probations={probations}
              simulationDate={effectiveToday}
              onUpdateContract={handleUpdateContractInline}
              onUpdateProbation={handleUpdateProbationInline}
              onNavigateToSource={(sourceType, employeeName) => {
                setNavigationSearchTerm(employeeName);
                if (sourceType === "Contract") {
                  setActiveTab("contracts");
                } else {
                  setActiveTab("probation");
                }
              }}
              initialSearchTerm={navigationSearchTerm}
              onClearInitialSearch={() => setNavigationSearchTerm("")}
            />
          )}
          </>
          )}
        </main>
      </div>

    </div>
  );
}
