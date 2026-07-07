import React, { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { 
  ContractItem, 
  ProbationItem, 
  ContractStatus, 
  ProbationStatus,
  UserRecommendation,
  ApprovalStatus,
  SalaryNegotiationStatus
} from "../types";
import { 
  parseExcelDate, 
  cleanCurrency, 
  normalizeStatus, 
  normalizeUserRecommendation,
  normalizeApprovalStatus,
  normalizeSalaryNegotiationStatus,
  generateEmployeeId, 
  autoMapColumns, 
  detectHeaderRow,
  validateImportedRow 
} from "../utils/excelHelper";
import { 
  Upload, 
  FileSpreadsheet, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Download, 
  RefreshCw, 
  Check, 
  Database,
  ArrowLeft,
  Info
} from "lucide-react";

interface ImportExcelViewProps {
  existingContracts: ContractItem[];
  existingProbations: ProbationItem[];
  simulationDate: string;
  onImportComplete: (type: 'contract' | 'probation', newItems: any[]) => void;
  onCancel: () => void;
}

const CONTRACT_FIELDS = [
  { key: "employeeId", label: "Employee ID", required: false, synonyms: ["id", "employee id", "nip", "no induk", "nik", "id karyawan"] },
  { key: "employeeName", label: "Employee Name", required: true, synonyms: ["nama", "employee name", "karyawan", "nama karyawan", "name"] },
  { key: "department", label: "Department", required: false, synonyms: ["departemen", "department", "divisi", "division", "dept"] },
  { key: "position", label: "Position", required: true, synonyms: ["jabatan", "position", "posisi", "role"] },
  { key: "directManager", label: "Direct Manager", required: false, synonyms: ["direct manager", "manager", "atasan", "atasan langsung"] },
  { key: "contractType", label: "Contract Type", required: false, synonyms: ["contract type", "tipe kontrak", "jenis kontrak", "pkwt"] },
  { key: "contractNumber", label: "Contract Number", required: false, synonyms: ["contract number", "no kontrak", "nomor kontrak"] },
  { key: "contractStartDate", label: "Contract Start Date", required: false, synonyms: ["contract start date", "tgl mulai", "start date", "tanggal kontrak", "tanggal mulai"] },
  { key: "contractEndDate", label: "Contract End Date", required: true, synonyms: ["contract end date", "expired", "end date", "tanggal akhir", "berakhir", "tanggal selesai"] },
  { key: "compensationReviewNeeded", label: "Compensation Review Needed", required: false, synonyms: ["compensation review needed", "review compensation", "butuh review kompensasi", "perlu review kompensasi"] },
  { key: "negotiationStatus", label: "Negotiation Status", required: false, synonyms: ["negotiation status", "status negosiasi", "status nego"] },
  { key: "negotiationNotes", label: "Negotiation Notes", required: false, synonyms: ["negotiation notes", "catatan negosiasi", "catatan nego"] },
  { key: "payrollFollowUpNotes", label: "Payroll/Management Follow-Up Notes", required: false, synonyms: ["payroll follow up notes", "catatan payroll", "follow up payroll"] },
  { key: "userRecommendation", label: "User Recommendation", required: false, synonyms: ["user recommendation", "rekomendasi user", "rekomendasi"] },
  { key: "directorApproval", label: "Director Approval", required: false, synonyms: ["director approval", "persetujuan direktur", "approval direktur"] },
  { key: "headHRReview", label: "Head HR Review", required: false, synonyms: ["head hr review", "review hr", "head hr"] },
  { key: "contractDraftDate", label: "Contract Draft Date", required: false, synonyms: ["contract draft date", "tgl draft", "tanggal draft"] },
  { key: "contractSentDate", label: "Contract Sent Date", required: false, synonyms: ["contract sent date", "tgl kirim", "tanggal kirim"] },
  { key: "signedDeadline", label: "Signed Deadline", required: false, synonyms: ["signed deadline", "deadline tanda tangan", "deadline ttd"] },
  { key: "signedReceivedDate", label: "Signed Received Date", required: false, synonyms: ["signed received date", "tgl ttd diterima", "tanggal ttd"] },
  { key: "contractStatus", label: "Contract Status", required: false, synonyms: ["contract status", "status kontrak", "status"] },
  { key: "salaryNegotiationStatus", label: "Compensation Review Status", required: false, synonyms: ["salary negotiation status", "status nego", "nego gaji"] },
  { key: "hrPic", label: "HR PIC", required: false, synonyms: ["hr pic", "pic hr", "pic", "admin hr"] },
  { key: "notes", label: "Notes", required: false, synonyms: ["notes", "keterangan", "catatan", "keterangan tambahan"] },
  { key: "endReason", label: "End Reason", required: false, synonyms: ["end reason", "alasan keluar", "alasan berhenti", "alasan resign"] },
  { key: "noticeDate", label: "Notice Date", required: false, synonyms: ["notice date", "tanggal notice", "tgl notice"] },
  { key: "lastWorkingDate", label: "Last Working Date", required: false, synonyms: ["last working date", "lwd", "hari terakhir", "tanggal terakhir kerja", "tgl lwd"] },
  { key: "exitProcessStatus", label: "Exit Process Status", required: false, synonyms: ["exit process status", "status exit", "status offboarding"] },
  { key: "accessAssetFormSentDate", label: "Access & Asset Form Sent Date", required: false, synonyms: ["access asset form sent date", "tgl kirim form asset", "form asset sent"] },
  { key: "accessAssetFormCompletedDate", label: "Access & Asset Form Completed Date", required: false, synonyms: ["access asset form completed date", "tgl selesai form asset", "form asset completed"] },
  { key: "assetReturnRequired", label: "Asset Return Required", required: false, synonyms: ["asset return required", "butuh pengembalian asset", "asset return"] },
  { key: "assetReturnStatus", label: "Asset Return Status", required: false, synonyms: ["asset return status", "status pengembalian asset", "asset status"] },
  { key: "accessClosureStatus", label: "Access Closure Status", required: false, synonyms: ["access closure status", "status penutupan akses", "akses status"] },
  { key: "exitClearanceFormSentDate", label: "Exit Clearance Form Sent Date", required: false, synonyms: ["exit clearance form sent date", "tgl kirim form clearance", "form clearance sent"] },
  { key: "exitClearanceCompletedDate", label: "Exit Clearance Completed Date", required: false, synonyms: ["exit clearance completed date", "tgl selesai form clearance", "form clearance completed"] },
  { key: "exitInterviewFormSentDate", label: "Exit Interview Form Sent Date", required: false, synonyms: ["exit interview form sent date", "tgl kirim form interview", "form interview sent"] },
  { key: "exitInterviewStatus", label: "Exit Interview Status", required: false, synonyms: ["exit interview status", "status interview", "interview status"] },
  { key: "exitInterviewCompletedDate", label: "Exit Interview Completed Date", required: false, synonyms: ["exit interview completed date", "tgl selesai form interview", "form interview completed"] },
  { key: "exitNotes", label: "Exit Notes", required: false, synonyms: ["exit notes", "catatan keluar", "catatan offboarding", "catatan exit"] },
  { key: "closedDate", label: "Closed Date", required: false, synonyms: ["closed date", "tanggal ditutup", "tanggal closed", "tgl closed"] }
];

const PROBATION_FIELDS = [
  { key: "employeeId", label: "Employee ID", required: false, synonyms: ["id", "employee id", "nip", "no induk", "nik", "id karyawan"] },
  { key: "employeeName", label: "Employee Name", required: true, synonyms: ["nama", "employee name", "karyawan", "nama karyawan", "name"] },
  { key: "department", label: "Department", required: false, synonyms: ["departemen", "department", "divisi", "division", "dept"] },
  { key: "position", label: "Position", required: true, synonyms: ["jabatan", "position", "posisi", "role"] },
  { key: "directManager", label: "Direct Manager", required: false, synonyms: ["direct manager", "manager", "atasan", "atasan langsung"] },
  { key: "probationStartDate", label: "Probation Start Date", required: false, synonyms: ["probation start date", "tgl mulai", "start date", "tanggal mulai"] },
  { key: "probationEndDate", label: "Probation End Date", required: true, synonyms: ["probation end date", "expired", "end date", "tanggal akhir", "berakhir", "tanggal selesai"] },
  { key: "reviewFormStatus", label: "Review Form Status", required: false, synonyms: ["review form status", "status form", "status review"] },
  { key: "userRecommendation", label: "User Recommendation", required: false, synonyms: ["user recommendation", "rekomendasi user", "rekomendasi"] },
  { key: "directorApproval", label: "Director Approval", required: false, synonyms: ["director approval", "persetujuan direktur", "approval direktur"] },
  { key: "finalDecision", label: "Final Decision", required: false, synonyms: ["final decision", "keputusan akhir", "keputusan"] },
  { key: "newEmploymentStatus", label: "New Employment Status", required: false, synonyms: ["new employment status", "status baru", "status karyawan baru"] },
  { key: "hrPic", label: "HR PIC", required: false, synonyms: ["hr pic", "pic hr", "pic", "admin hr"] },
  { key: "notes", label: "Notes", required: false, synonyms: ["notes", "keterangan", "catatan", "keterangan tambahan"] },
  { key: "endReason", label: "End Reason", required: false, synonyms: ["end reason", "alasan keluar", "alasan berhenti", "alasan resign"] },
  { key: "noticeDate", label: "Notice Date", required: false, synonyms: ["notice date", "tanggal notice", "tgl notice"] },
  { key: "lastWorkingDate", label: "Last Working Date", required: false, synonyms: ["last working date", "lwd", "hari terakhir", "tanggal terakhir kerja", "tgl lwd"] },
  { key: "exitProcessStatus", label: "Exit Process Status", required: false, synonyms: ["exit process status", "status exit", "status offboarding"] },
  { key: "accessAssetFormSentDate", label: "Access & Asset Form Sent Date", required: false, synonyms: ["access asset form sent date", "tgl kirim form asset", "form asset sent"] },
  { key: "accessAssetFormCompletedDate", label: "Access & Asset Form Completed Date", required: false, synonyms: ["access asset form completed date", "tgl selesai form asset", "form asset completed"] },
  { key: "assetReturnRequired", label: "Asset Return Required", required: false, synonyms: ["asset return required", "butuh pengembalian asset", "asset return"] },
  { key: "assetReturnStatus", label: "Asset Return Status", required: false, synonyms: ["asset return status", "status pengembalian asset", "asset status"] },
  { key: "accessClosureStatus", label: "Access Closure Status", required: false, synonyms: ["access closure status", "status penutupan akses", "akses status"] },
  { key: "exitClearanceFormSentDate", label: "Exit Clearance Form Sent Date", required: false, synonyms: ["exit clearance form sent date", "tgl kirim form clearance", "form clearance sent"] },
  { key: "exitClearanceCompletedDate", label: "Exit Clearance Completed Date", required: false, synonyms: ["exit clearance completed date", "tgl selesai form clearance", "form clearance completed"] },
  { key: "exitInterviewFormSentDate", label: "Exit Interview Form Sent Date", required: false, synonyms: ["exit interview form sent date", "tgl kirim form interview", "form interview sent"] },
  { key: "exitInterviewStatus", label: "Exit Interview Status", required: false, synonyms: ["exit interview status", "status interview", "interview status"] },
  { key: "exitInterviewCompletedDate", label: "Exit Interview Completed Date", required: false, synonyms: ["exit interview completed date", "tgl selesai form interview", "form interview completed"] },
  { key: "exitNotes", label: "Exit Notes", required: false, synonyms: ["exit notes", "catatan keluar", "catatan offboarding", "catatan exit"] },
  { key: "closedDate", label: "Closed Date", required: false, synonyms: ["closed date", "tanggal ditutup", "tanggal closed", "tgl closed"] }
];

export const ImportExcelView: React.FC<ImportExcelViewProps> = ({
  existingContracts,
  existingProbations,
  simulationDate,
  onImportComplete,
  onCancel,
}) => {
  // Stepper state: 'upload' | 'mapping' | 'review'
  const [step, setStep] = useState<'upload' | 'mapping' | 'review'>('upload');
  const [importType, setImportType] = useState<'contract' | 'probation'>('contract');

  // File parsing states
  const [file, setFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [rawRows, setRawRows] = useState<any[][]>([]); // Full 2D array of cells
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [headerRowIndex, setHeaderRowIndex] = useState<number>(0);
  
  // Mapping configuration: targetFieldKey -> excelHeader
  const [mapping, setMapping] = useState<Record<string, string>>({});
  
  // Cleaned and validated results
  const [processedRows, setProcessedRows] = useState<any[]>([]);
  type DuplicateMode = 'skip' | 'replace' | 'update' | 'new';
  const [duplicateMode, setDuplicateMode] = useState<DuplicateMode>('skip');
  
  // Drag & drop highlight
  const [dragOver, setDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeFields = importType === 'contract' ? CONTRACT_FIELDS : PROBATION_FIELDS;

  const hasSalaryColumns = excelHeaders.some(h => {
    const hl = h.toLowerCase();
    return hl.includes("salary") || hl.includes("gaji") || hl.includes("nominal");
  });

  // Handle file drop/select
  const handleFile = (selectedFile: File) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        setWorkbook(wb);
        setSheetNames(wb.SheetNames);
        
        // Select first sheet by default
        const firstSheet = wb.SheetNames[0];
        setSelectedSheet(firstSheet);
        parseSheet(wb, firstSheet);
      } catch (err) {
        alert("Error parsing file. Please make sure it is a valid Excel (.xlsx) or CSV file.");
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const parseSheet = (wb: XLSX.WorkBook, sheetName: string, targetType?: 'contract' | 'probation') => {
    const ws = wb.Sheets[sheetName];
    // Read raw 2D array of cells so we can preview and do exact parsing
    const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: "" });
    
    if (data.length === 0) {
      alert("Selected sheet is empty.");
      return;
    }

    setRawRows(data);
    
    const fields = (targetType || importType) === 'contract' ? CONTRACT_FIELDS : PROBATION_FIELDS;
    const { headerRowIndex: detectedIndex, headers } = detectHeaderRow(data, fields);
    
    setHeaderRowIndex(detectedIndex);
    setExcelHeaders(headers);

    // Initial Auto mapping suggestion
    const initialMapping = autoMapColumns(headers, fields);
    setMapping(initialMapping);
  };

  // Trigger when sheet changes
  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    if (workbook) {
      parseSheet(workbook, sheetName);
    }
  };

  // Trigger when import type changes
  const handleImportTypeChange = (type: 'contract' | 'probation') => {
    setImportType(type);
    const fields = type === 'contract' ? CONTRACT_FIELDS : PROBATION_FIELDS;
    // Re-detect header row and re-map columns
    if (rawRows.length > 0) {
      const { headerRowIndex: detectedIndex, headers } = detectHeaderRow(rawRows, fields);
      setHeaderRowIndex(detectedIndex);
      setExcelHeaders(headers);
      const newMapping = autoMapColumns(headers, fields);
      setMapping(newMapping);
    }
  };

  // Handle individual mapping dropdown change
  const handleMapChange = (fieldKey: string, excelHeader: string) => {
    setMapping(prev => ({
      ...prev,
      [fieldKey]: excelHeader
    }));
  };

  // Run the data cleaning & processing on the rows
  const processAndCleanData = () => {
    if (rawRows.length <= headerRowIndex) {
      alert("No data rows found to process.");
      return;
    }

    const headersRow = rawRows[headerRowIndex].map(h => String(h ?? '').trim());
    const dataRows = rawRows.slice(headerRowIndex + 1);

    const existingIds = importType === 'contract' 
      ? existingContracts.map(c => c.employeeId)
      : existingProbations.map(p => p.employeeId);

    // Track newly generated IDs to prevent internal duplication
    const generatedTempIds: string[] = [...existingIds];

    const results = dataRows.map((rowArr, rowIndex) => {
      // Build a row object based on mapping
      const rawRowObj: Record<string, any> = {};
      
      activeFields.forEach(field => {
        const mappedHeader = mapping[field.key];
        if (mappedHeader) {
          const colIndex = headersRow.indexOf(mappedHeader);
          if (colIndex !== -1 && rowArr[colIndex] !== undefined) {
            rawRowObj[field.key] = rowArr[colIndex];
          }
        }
      });

      // 1. Data Cleaning
      const employeeName = String(rawRowObj.employeeName || '').trim().replace(/\s+/g, ' ');
      const department = String(rawRowObj.department || '').trim() || "Unassigned";
      const position = String(rawRowObj.position || '').trim();
      const directManager = String(rawRowObj.directManager || '').trim() || "Unassigned";
      
      let employeeId = String(rawRowObj.employeeId || '').trim();
      if (!employeeId) {
        employeeId = generateEmployeeId(generatedTempIds);
        generatedTempIds.push(employeeId);
      }

      const notes = String(rawRowObj.notes || '').trim();
      const hrPic = String(rawRowObj.hrPic || '').trim() || "HR Team";

      let cleanedItem: any = {};

      if (importType === 'contract') {
        const contractType = String(rawRowObj.contractType || '').trim() || "PKWT I";
        const contractNumber = String(rawRowObj.contractNumber || '').trim() || "-";
        
        const contractStartDate = parseExcelDate(rawRowObj.contractStartDate);
        const contractEndDate = parseExcelDate(rawRowObj.contractEndDate);
        
        const rawReviewNeeded = rawRowObj.compensationReviewNeeded;
        const compensationReviewNeeded = rawReviewNeeded === true || 
          (typeof rawReviewNeeded === 'string' && ['true', 'yes', 'y', '1', 'perlu', 'ya', 'needed'].includes(rawReviewNeeded.trim().toLowerCase())) ||
          false;

        const negotiationStatus = rawRowObj.negotiationStatus 
          ? normalizeSalaryNegotiationStatus(rawRowObj.negotiationStatus) 
          : SalaryNegotiationStatus.NoNegotiation;

        const negotiationNotes = String(rawRowObj.negotiationNotes || '').trim();
        const payrollFollowUpNotes = String(rawRowObj.payrollFollowUpNotes || '').trim();

        const contractStatus = normalizeStatus(rawRowObj.contractStatus, 'contract') as ContractStatus;
        const userRecommendation = normalizeUserRecommendation(rawRowObj.userRecommendation);
        const directorApproval = normalizeApprovalStatus(rawRowObj.directorApproval);
        const headHRReview = normalizeApprovalStatus(rawRowObj.headHRReview);
        const salaryNegotiationStatus = negotiationStatus;

        const contractDraftDate = parseExcelDate(rawRowObj.contractDraftDate);
        const contractSentDate = parseExcelDate(rawRowObj.contractSentDate);
        const signedDeadline = parseExcelDate(rawRowObj.signedDeadline);
        const signedReceivedDate = parseExcelDate(rawRowObj.signedReceivedDate);

        cleanedItem = {
          id: employeeId,
          employeeId,
          employeeName,
          department,
          position,
          directManager,
          contractType,
          contractNumber,
          contractStartDate,
          contractEndDate,
          compensationReviewNeeded,
          negotiationStatus,
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
          priority: "Low", // Computed in App.tsx syncWithStorage
          daysRemaining: 0, // Computed in App.tsx syncWithStorage
          isSampleData: false
        } as ContractItem;
      } else {
        const probationStartDate = parseExcelDate(rawRowObj.probationStartDate);
        const probationEndDate = parseExcelDate(rawRowObj.probationEndDate);
        const reviewFormStatus = String(rawRowObj.reviewFormStatus || '').trim() || "Pending";
        
        const userRecommendation = normalizeUserRecommendation(rawRowObj.userRecommendation);
        const directorApproval = normalizeApprovalStatus(rawRowObj.directorApproval);
        const finalDecision = String(rawRowObj.finalDecision || '').trim();
        const newEmploymentStatus = String(rawRowObj.newEmploymentStatus || '').trim();
        const probationStatus = normalizeStatus(rawRowObj.probationStatus, 'probation') as ProbationStatus;

        cleanedItem = {
          id: employeeId,
          employeeId,
          employeeName,
          department,
          position,
          directManager,
          probationStartDate,
          probationEndDate,
          reviewFormStatus,
          userRecommendation,
          directorApproval,
          finalDecision,
          newEmploymentStatus,
          hrPic,
          probationStatus,
          notes,
          priority: "Low", // Computed in App.tsx syncWithStorage
          daysRemaining: 0, // Computed in App.tsx syncWithStorage
          isSampleData: false
        } as ProbationItem;
      }

      // 2. Validate Row
      const validation = validateImportedRow(cleanedItem, importType);

      // 3. Check for Duplicate
      let isDuplicate = false;
      if (importType === 'contract') {
        isDuplicate = existingContracts.some(
          c => c.employeeName.toLowerCase() === cleanedItem.employeeName.toLowerCase() && 
               c.contractEndDate === cleanedItem.contractEndDate
        );
      } else {
        isDuplicate = existingProbations.some(
          p => p.employeeName.toLowerCase() === cleanedItem.employeeName.toLowerCase() && 
               p.probationEndDate === cleanedItem.probationEndDate
        );
      }

      return {
        rowIndex: headerRowIndex + rowIndex + 2,
        raw: rawRowObj,
        cleaned: cleanedItem,
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
        isDuplicate
      };
    });

    setProcessedRows(results);
    setStep('review');
  };

  // Download logic for erroneous rows
  const handleDownloadErrorCSV = () => {
    const errorRows = processedRows.filter(r => !r.isValid || r.errors.length > 0);
    if (errorRows.length === 0) {
      alert("No error rows to download.");
      return;
    }

    const headers = ["Row in Excel", "Errors", "Employee Name", "Position", "End Date", "Department"];
    const csvContent = [
      headers.join(","),
      ...errorRows.map(r => {
        const errorMsg = r.errors.join("; ");
        const name = r.cleaned.employeeName || "";
        const pos = r.cleaned.position || "";
        const endDate = importType === 'contract' ? (r.cleaned.contractEndDate || "") : (r.cleaned.probationEndDate || "");
        const dept = r.cleaned.department || "";
        return [
          r.rowIndex,
          `"${errorMsg.replace(/"/g, '""')}"`,
          `"${name.replace(/"/g, '""')}"`,
          `"${pos.replace(/"/g, '""')}"`,
          `"${endDate}"`,
          `"${dept.replace(/"/g, '""')}"`
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `import_errors_${importType}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to update Contract fields if present in raw Excel row
  const updateContractFields = (existing: ContractItem, raw: any, cleaned: ContractItem): ContractItem => {
    const updated = { ...existing };
    const hasRawValue = (key: string) => {
      const val = raw[key];
      if (val === undefined || val === null) return false;
      if (typeof val === 'string' && val.trim() === '') return false;
      return true;
    };

    if (hasRawValue('employeeId')) updated.employeeId = cleaned.employeeId;
    if (hasRawValue('employeeName')) updated.employeeName = cleaned.employeeName;
    if (hasRawValue('department')) updated.department = cleaned.department;
    if (hasRawValue('position')) updated.position = cleaned.position;
    if (hasRawValue('directManager')) updated.directManager = cleaned.directManager;
    if (hasRawValue('contractType')) updated.contractType = cleaned.contractType;
    if (hasRawValue('contractNumber')) updated.contractNumber = cleaned.contractNumber;
    if (hasRawValue('contractStartDate')) updated.contractStartDate = cleaned.contractStartDate;
    if (hasRawValue('contractEndDate')) updated.contractEndDate = cleaned.contractEndDate;
    
    if (hasRawValue('contractStatus')) updated.contractStatus = cleaned.contractStatus;
    if (hasRawValue('userRecommendation')) updated.userRecommendation = cleaned.userRecommendation;
    if (hasRawValue('directorApproval')) updated.directorApproval = cleaned.directorApproval;
    if (hasRawValue('headHRReview')) updated.headHRReview = cleaned.headHRReview;
    
    if (hasRawValue('contractDraftDate')) updated.contractDraftDate = cleaned.contractDraftDate;
    if (hasRawValue('contractSentDate')) updated.contractSentDate = cleaned.contractSentDate;
    if (hasRawValue('signedDeadline')) updated.signedDeadline = cleaned.signedDeadline;
    if (hasRawValue('signedReceivedDate')) updated.signedReceivedDate = cleaned.signedReceivedDate;
    
    if (hasRawValue('compensationReviewNeeded')) {
      updated.compensationReviewNeeded = cleaned.compensationReviewNeeded;
    }
    if (hasRawValue('negotiationStatus')) {
      updated.negotiationStatus = cleaned.negotiationStatus;
      updated.salaryNegotiationStatus = cleaned.salaryNegotiationStatus;
    }
    if (hasRawValue('negotiationNotes')) updated.negotiationNotes = cleaned.negotiationNotes;
    if (hasRawValue('payrollFollowUpNotes')) updated.payrollFollowUpNotes = cleaned.payrollFollowUpNotes;
    
    if (hasRawValue('hrPic')) updated.hrPic = cleaned.hrPic;
    if (hasRawValue('notes')) updated.notes = cleaned.notes;

    // Exit tracking fields (ARC 3.8)
    if (hasRawValue('endReason')) updated.endReason = cleaned.endReason;
    if (hasRawValue('noticeDate')) updated.noticeDate = cleaned.noticeDate;
    if (hasRawValue('lastWorkingDate')) updated.lastWorkingDate = cleaned.lastWorkingDate;
    if (hasRawValue('exitProcessStatus')) updated.exitProcessStatus = cleaned.exitProcessStatus;
    if (hasRawValue('accessAssetFormSentDate')) updated.accessAssetFormSentDate = cleaned.accessAssetFormSentDate;
    if (hasRawValue('accessAssetFormCompletedDate')) updated.accessAssetFormCompletedDate = cleaned.accessAssetFormCompletedDate;
    if (hasRawValue('assetReturnRequired')) updated.assetReturnRequired = cleaned.assetReturnRequired;
    if (hasRawValue('assetReturnStatus')) updated.assetReturnStatus = cleaned.assetReturnStatus;
    if (hasRawValue('accessClosureStatus')) updated.accessClosureStatus = cleaned.accessClosureStatus;
    if (hasRawValue('exitClearanceFormSentDate')) updated.exitClearanceFormSentDate = cleaned.exitClearanceFormSentDate;
    if (hasRawValue('exitClearanceCompletedDate')) updated.exitClearanceCompletedDate = cleaned.exitClearanceCompletedDate;
    if (hasRawValue('exitInterviewFormSentDate')) updated.exitInterviewFormSentDate = cleaned.exitInterviewFormSentDate;
    if (hasRawValue('exitInterviewStatus')) {
      updated.exitInterviewStatus = cleaned.exitInterviewStatus;
      updated.exitInterviewFormStatus = cleaned.exitInterviewFormStatus;
    }
    if (hasRawValue('exitInterviewCompletedDate')) updated.exitInterviewCompletedDate = cleaned.exitInterviewCompletedDate;
    if (hasRawValue('exitNotes')) updated.exitNotes = cleaned.exitNotes;
    if (hasRawValue('closedDate')) updated.closedDate = cleaned.closedDate;

    updated.isSampleData = false;
    return updated;
  };

  // Helper to update Probation fields if present in raw Excel row
  const updateProbationFields = (existing: ProbationItem, raw: any, cleaned: ProbationItem): ProbationItem => {
    const updated = { ...existing };
    const hasRawValue = (key: string) => {
      const val = raw[key];
      if (val === undefined || val === null) return false;
      if (typeof val === 'string' && val.trim() === '') return false;
      return true;
    };

    if (hasRawValue('employeeId')) updated.employeeId = cleaned.employeeId;
    if (hasRawValue('employeeName')) updated.employeeName = cleaned.employeeName;
    if (hasRawValue('department')) updated.department = cleaned.department;
    if (hasRawValue('position')) updated.position = cleaned.position;
    if (hasRawValue('directManager')) updated.directManager = cleaned.directManager;
    if (hasRawValue('probationStartDate')) updated.probationStartDate = cleaned.probationStartDate;
    if (hasRawValue('probationEndDate')) updated.probationEndDate = cleaned.probationEndDate;
    
    if (hasRawValue('reviewFormStatus')) updated.reviewFormStatus = cleaned.reviewFormStatus;
    if (hasRawValue('userRecommendation')) updated.userRecommendation = cleaned.userRecommendation;
    if (hasRawValue('directorApproval')) updated.directorApproval = cleaned.directorApproval;
    if (hasRawValue('finalDecision')) updated.finalDecision = cleaned.finalDecision;
    if (hasRawValue('newEmploymentStatus')) updated.newEmploymentStatus = cleaned.newEmploymentStatus;
    if (hasRawValue('probationStatus')) updated.probationStatus = cleaned.probationStatus;
    
    if (hasRawValue('hrPic')) updated.hrPic = cleaned.hrPic;
    if (hasRawValue('notes')) updated.notes = cleaned.notes;

    // Exit tracking fields (ARC 3.8)
    if (hasRawValue('endReason')) updated.endReason = cleaned.endReason;
    if (hasRawValue('noticeDate')) updated.noticeDate = cleaned.noticeDate;
    if (hasRawValue('lastWorkingDate')) updated.lastWorkingDate = cleaned.lastWorkingDate;
    if (hasRawValue('exitProcessStatus')) updated.exitProcessStatus = cleaned.exitProcessStatus;
    if (hasRawValue('accessAssetFormSentDate')) updated.accessAssetFormSentDate = cleaned.accessAssetFormSentDate;
    if (hasRawValue('accessAssetFormCompletedDate')) updated.accessAssetFormCompletedDate = cleaned.accessAssetFormCompletedDate;
    if (hasRawValue('assetReturnRequired')) updated.assetReturnRequired = cleaned.assetReturnRequired;
    if (hasRawValue('assetReturnStatus')) updated.assetReturnStatus = cleaned.assetReturnStatus;
    if (hasRawValue('accessClosureStatus')) updated.accessClosureStatus = cleaned.accessClosureStatus;
    if (hasRawValue('exitClearanceFormSentDate')) updated.exitClearanceFormSentDate = cleaned.exitClearanceFormSentDate;
    if (hasRawValue('exitClearanceCompletedDate')) updated.exitClearanceCompletedDate = cleaned.exitClearanceCompletedDate;
    if (hasRawValue('exitInterviewFormSentDate')) updated.exitInterviewFormSentDate = cleaned.exitInterviewFormSentDate;
    if (hasRawValue('exitInterviewStatus')) {
      updated.exitInterviewStatus = cleaned.exitInterviewStatus;
      updated.exitInterviewFormStatus = cleaned.exitInterviewFormStatus;
    }
    if (hasRawValue('exitInterviewCompletedDate')) updated.exitInterviewCompletedDate = cleaned.exitInterviewCompletedDate;
    if (hasRawValue('exitNotes')) updated.exitNotes = cleaned.exitNotes;
    if (hasRawValue('closedDate')) updated.closedDate = cleaned.closedDate;

    updated.isSampleData = false;
    return updated;
  };

  // Perform Final Save/Import
  const handleFinalImport = () => {
    const validRowsToProcess = processedRows.filter(r => r.isValid);
    if (validRowsToProcess.length === 0) {
      alert("There are no valid rows to import.");
      return;
    }

    let finalItems: any[] = [];
    let addedCount = 0;
    let updatedCount = 0;
    let replacedCount = 0;
    let skippedCount = 0;

    if (importType === 'contract') {
      const workingList = [...existingContracts];

      validRowsToProcess.forEach(row => {
        if (row.isDuplicate) {
          if (duplicateMode === 'skip') {
            skippedCount++;
          } else if (duplicateMode === 'replace') {
            replacedCount++;
            const idx = workingList.findIndex(
              c => c.employeeName.toLowerCase() === row.cleaned.employeeName.toLowerCase() && 
                   c.contractEndDate === row.cleaned.contractEndDate
            );
            if (idx !== -1) {
              const existingItem = workingList[idx];
              workingList[idx] = {
                ...row.cleaned,
                id: existingItem.id,
                employeeId: existingItem.employeeId
              };
            } else {
              workingList.unshift(row.cleaned);
              addedCount++;
            }
          } else if (duplicateMode === 'update') {
            updatedCount++;
            const idx = workingList.findIndex(
              c => c.employeeName.toLowerCase() === row.cleaned.employeeName.toLowerCase() && 
                   c.contractEndDate === row.cleaned.contractEndDate
            );
            if (idx !== -1) {
              workingList[idx] = updateContractFields(workingList[idx], row.raw, row.cleaned);
            } else {
              workingList.unshift(row.cleaned);
              addedCount++;
            }
          } else if (duplicateMode === 'new') {
            addedCount++;
            workingList.unshift(row.cleaned);
          }
        } else {
          addedCount++;
          workingList.unshift(row.cleaned);
        }
      });

      finalItems = workingList;
    } else {
      const workingList = [...existingProbations];

      validRowsToProcess.forEach(row => {
        if (row.isDuplicate) {
          if (duplicateMode === 'skip') {
            skippedCount++;
          } else if (duplicateMode === 'replace') {
            replacedCount++;
            const idx = workingList.findIndex(
              p => p.employeeName.toLowerCase() === row.cleaned.employeeName.toLowerCase() && 
                   p.probationEndDate === row.cleaned.probationEndDate
            );
            if (idx !== -1) {
              const existingItem = workingList[idx];
              workingList[idx] = {
                ...row.cleaned,
                id: existingItem.id,
                employeeId: existingItem.employeeId
              };
            } else {
              workingList.unshift(row.cleaned);
              addedCount++;
            }
          } else if (duplicateMode === 'update') {
            updatedCount++;
            const idx = workingList.findIndex(
              p => p.employeeName.toLowerCase() === row.cleaned.employeeName.toLowerCase() && 
                   p.probationEndDate === row.cleaned.probationEndDate
            );
            if (idx !== -1) {
              workingList[idx] = updateProbationFields(workingList[idx], row.raw, row.cleaned);
            } else {
              workingList.unshift(row.cleaned);
              addedCount++;
            }
          } else if (duplicateMode === 'new') {
            addedCount++;
            workingList.unshift(row.cleaned);
          }
        } else {
          addedCount++;
          workingList.unshift(row.cleaned);
        }
      });

      finalItems = workingList;
    }

    onImportComplete(importType, finalItems);
    alert(`Import selesai. ${addedCount} data baru ditambahkan, ${updatedCount} data diperbarui, ${replacedCount} data diganti, ${skippedCount} data dilewati.`);
  };

  const totalRows = processedRows.length;
  const duplicateRows = processedRows.filter(r => r.isValid && r.isDuplicate).length;
  const newRows = processedRows.filter(r => r.isValid && !r.isDuplicate).length;
  const warningRows = processedRows.filter(r => r.isValid && r.warnings.length > 0).length;
  const errorRows = processedRows.filter(r => !r.isValid).length;
  const importableRowsCount = duplicateMode === 'skip' ? newRows : (newRows + duplicateRows);

  return (
    <div className="space-y-6 animate-fade-in" id="import-excel-view">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-5 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display flex items-center gap-2">
            <FileSpreadsheet className="h-8 w-8 text-indigo-600" />
            Smart Excel & CSV Importer
          </h1>
          <p className="text-slate-500 mt-1">
            Seamlessly upload, map columns, clean data, and import contract or probation rosters.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
      </div>

      {/* Stepper Wizard Indicator */}
      <div className="bg-white border border-slate-150 rounded-xl p-4 flex items-center justify-center gap-4 shadow-xs md:gap-8 overflow-x-auto">
        <div className={`flex items-center gap-2 text-sm font-semibold ${step === 'upload' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs border ${step === 'upload' ? 'bg-indigo-50 border-indigo-600' : 'border-slate-200'}`}>1</span>
          File Upload
        </div>
        <ArrowRight className="h-4 w-4 text-slate-300 shrink-0" />
        <div className={`flex items-center gap-2 text-sm font-semibold ${step === 'mapping' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs border ${step === 'mapping' ? 'bg-indigo-50 border-indigo-600' : 'border-slate-200'}`}>2</span>
          Column Mapping
        </div>
        <ArrowRight className="h-4 w-4 text-slate-300 shrink-0" />
        <div className={`flex items-center gap-2 text-sm font-semibold ${step === 'review' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs border ${step === 'review' ? 'bg-indigo-50 border-indigo-600' : 'border-slate-200'}`}>3</span>
          Review & Import
        </div>
      </div>

      {/* STEP 1: UPLOAD FILE */}
      {step === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div 
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFile(e.dataTransfer.files[0]);
                }
              }}
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition flex flex-col items-center justify-center min-h-[300px] cursor-pointer bg-white ${
                dragOver ? "border-indigo-500 bg-indigo-50/40" : "border-slate-200 hover:border-indigo-400"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => e.target.files && handleFile(e.target.files[0])}
              />
              <div className="h-14 w-14 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-xs">
                <Upload className="h-7 w-7" />
              </div>
              <p className="font-semibold text-slate-850 text-lg">
                Drag & drop your Excel or CSV file here
              </p>
              <p className="text-slate-400 text-sm mt-1">
                Supports .xlsx, .xls, and .csv files
              </p>
              <button 
                type="button" 
                className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md cursor-pointer transition flex items-center gap-2"
              >
                Choose Local File
              </button>
            </div>

            {/* File info and Sheet picker */}
            {file && (
              <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm space-y-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-850 font-display">{file.name}</h4>
                    <p className="text-xs text-slate-400 font-mono">{(file.size / 1024).toFixed(1)} KB • {excelHeaders.length} Columns detected</p>
                  </div>
                </div>

                {sheetNames.length > 1 && (
                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Select Sheet to Import</label>
                      <p className="text-xs text-slate-400">This Excel file has multiple sheets.</p>
                    </div>
                    <select
                      value={selectedSheet}
                      onChange={(e) => handleSheetChange(e.target.value)}
                      className="border border-slate-200 rounded-lg text-sm px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 bg-white font-medium text-slate-800"
                    >
                      {sheetNames.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Import Type selector */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Select Application Target</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => handleImportTypeChange('contract')}
                      className={`p-4 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer ${
                        importType === 'contract'
                          ? 'border-indigo-600 bg-indigo-50/20 text-indigo-950'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span className={`h-4 w-4 rounded-full border flex items-center justify-center ${importType === 'contract' ? 'border-indigo-600' : 'border-slate-300'}`}>
                        {importType === 'contract' && <span className="h-2 w-2 rounded-full bg-indigo-600"></span>}
                      </span>
                      <div>
                        <h5 className="text-xs font-bold font-display uppercase tracking-wider">Contract Control</h5>
                        <p className="text-[10px] text-slate-400">Import temporary PKWT personnel and salaries.</p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleImportTypeChange('probation')}
                      className={`p-4 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer ${
                        importType === 'probation'
                          ? 'border-emerald-600 bg-emerald-50/20 text-emerald-950'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span className={`h-4 w-4 rounded-full border flex items-center justify-center ${importType === 'probation' ? 'border-emerald-600' : 'border-slate-300'}`}>
                        {importType === 'probation' && <span className="h-2 w-2 rounded-full bg-emerald-600"></span>}
                      </span>
                      <div>
                        <h5 className="text-xs font-bold font-display uppercase tracking-wider">Probation Control</h5>
                        <p className="text-[10px] text-slate-400">Import trial-period employees and evaluation details.</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Next Button */}
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => setStep('mapping')}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md flex items-center gap-2 transition cursor-pointer"
                  >
                    Proceed to Mapping
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick tips panel */}
          <div className="space-y-6">
            <div className="bg-slate-900 text-slate-200 rounded-2xl p-6 border border-slate-800 shadow-md">
              <h3 className="font-bold text-white font-display text-base flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
                <Info className="h-4.5 w-4.5 text-indigo-400" />
                Preparation Guidelines
              </h3>
              <ul className="space-y-3.5 text-xs text-slate-400 leading-relaxed list-disc list-inside">
                <li>Make sure the first row of your sheet contains the column names.</li>
                <li>We'll auto-suggest mappings for common terms like <strong className="text-indigo-300">"Nama", "Jabatan", "Expired"</strong>.</li>
                <li>The system will automatically recognize Excel date formats and normalize them.</li>
                <li>Missing Employee IDs will be dynamically auto-generated.</li>
                <li>Salary/Gaji columns are detected only to warn the user, then ignored for data privacy. Nominal compensation data must be handled outside this system by Payroll/Management.</li>
                <li><strong>Required Fields</strong>:
                  <div className="mt-1.5 pl-4 font-mono font-bold text-slate-300 space-y-0.5">
                    <div>• Employee Name</div>
                    <div>• Position</div>
                    <div>• End Date</div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: COLUMN MAPPING */}
      {step === 'mapping' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs">
            <div className="border-b border-slate-100 pb-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
                  <Database className="h-5 w-5 text-indigo-600" />
                  Map Columns
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Link your spreadsheet headers to the required and optional database fields in {importType === 'contract' ? 'Contracts' : 'Probations'}.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-medium transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={processAndCleanData}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md flex items-center gap-1.5 transition cursor-pointer"
                >
                  Analyze & Clean Data
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {hasSalaryColumns && (
              <div className="mb-4 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl flex items-start gap-3 shadow-xs" id="salary-ignored-warning">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">Salary/Payroll Columns Ignored</h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    For employee data privacy and role boundary protection, salary nominal columns (e.g. "Salary", "Gaji", "Nominal gaji") are automatically ignored and will not be imported.
                  </p>
                </div>
              </div>
            )}

            {/* Excel columns preview bubble list */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-6 space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Excel Columns Detected:</span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {excelHeaders.map(header => (
                  <span key={header} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white text-slate-700 border border-slate-200">
                    {header}
                  </span>
                ))}
              </div>
            </div>

            {/* Mapping Table */}
            <div className="overflow-x-auto border border-slate-150 rounded-xl">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-150">
                    <th className="px-6 py-3">Database Field</th>
                    <th className="px-6 py-3">Requirements</th>
                    <th className="px-6 py-3">Map to Spreadsheet Column</th>
                    <th className="px-6 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeFields.map(field => {
                    const isMapped = !!mapping[field.key];
                    return (
                      <tr key={field.key} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-850">{field.label}</div>
                          <div className="text-[11px] text-slate-400 font-mono font-medium">{field.key}</div>
                        </td>
                        <td className="px-6 py-4">
                          {field.required ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100 uppercase tracking-wider">
                              Required
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Optional</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={mapping[field.key] || ""}
                            onChange={(e) => handleMapChange(field.key, e.target.value)}
                            className="border border-slate-200 rounded-lg text-xs px-3 py-1.5 w-full max-w-md focus:ring-1 focus:ring-indigo-500 bg-white"
                          >
                            <option value="">[ Don't Import / Skip ]</option>
                            {excelHeaders.map(header => (
                              <option key={header} value={header}>
                                {header}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isMapped ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                              Mapped
                            </span>
                          ) : field.required ? (
                            <span className="inline-flex items-center gap-1 text-rose-600 text-xs font-semibold">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Missing
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">Ignored</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mapping Controls in Footer */}
            <div className="pt-6 mt-6 border-t border-slate-100 flex justify-between items-center">
              <button
                onClick={() => {
                  const resetMap = autoMapColumns(excelHeaders, activeFields);
                  setMapping(resetMap);
                }}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset Auto-Mapping
              </button>
              
              <button
                onClick={processAndCleanData}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md flex items-center gap-2 transition cursor-pointer"
              >
                Proceed to Preview & Clean
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW & CLEAN */}
      {step === 'review' && (
        <div className="space-y-6">
          {/* STATS CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 animate-fade-in">
            <div className="bg-white border border-slate-150 p-4 rounded-xl shadow-xs">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Rows</div>
              <div className="text-2xl font-bold text-slate-800 mt-1 font-mono">{processedRows.filter(r => r.isValid && !r.isDuplicate).length}</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Unique valid records</p>
            </div>
            
            <div className="bg-white border border-indigo-150 p-4 rounded-xl shadow-xs">
              <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Duplicates Found</div>
              <div className="text-2xl font-bold text-indigo-700 mt-1 font-mono">{processedRows.filter(r => r.isValid && r.isDuplicate).length}</div>
              <p className="text-[10px] text-indigo-400 mt-0.5">Matching name & end date</p>
            </div>

            <div className={`p-4 rounded-xl shadow-xs border ${duplicateMode === 'skip' ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-slate-150 opacity-60'}`}>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rows to Skip</div>
              <div className="text-2xl font-bold text-slate-800 mt-1 font-mono">
                {duplicateMode === 'skip' ? processedRows.filter(r => r.isValid && r.isDuplicate).length : 0}
              </div>
              <p className="text-[10px] text-slate-450 mt-0.5">Will be bypassed</p>
            </div>

            <div className={`p-4 rounded-xl shadow-xs border ${duplicateMode === 'replace' ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-slate-150 opacity-60'}`}>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rows to Replace</div>
              <div className="text-2xl font-bold text-slate-800 mt-1 font-mono">
                {duplicateMode === 'replace' ? processedRows.filter(r => r.isValid && r.isDuplicate).length : 0}
              </div>
              <p className="text-[10px] text-slate-450 mt-0.5">Overwrite existing</p>
            </div>

            <div className={`p-4 rounded-xl shadow-xs border ${duplicateMode === 'update' ? 'bg-teal-50/50 border-teal-200' : 'bg-white border-slate-150 opacity-60'}`}>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rows to Update</div>
              <div className="text-2xl font-bold text-slate-800 mt-1 font-mono">
                {duplicateMode === 'update' ? processedRows.filter(r => r.isValid && r.isDuplicate).length : 0}
              </div>
              <p className="text-[10px] text-slate-450 mt-0.5">Update filled fields</p>
            </div>

            <div className="bg-white border border-rose-150 p-4 rounded-xl shadow-xs">
              <div className="text-xs font-bold text-rose-600 uppercase tracking-wider">Invalid Rows</div>
              <div className="text-2xl font-bold text-rose-700 mt-1 font-mono">{processedRows.filter(r => !r.isValid).length}</div>
              <p className="text-[10px] text-rose-400 mt-0.5">Contains errors</p>
            </div>
          </div>

          {/* CONTROL BAR WITH DUPLICATE MODE OPTIONS */}
          <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Duplicate Handling Mode</span>
                <p className="text-xs text-slate-500">Choose how the system handles records with the same Employee Name and End Date.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { mode: 'skip', label: 'Skip duplicate', desc: 'Skip rows already present' },
                  { mode: 'replace', label: 'Replace existing', desc: 'Fully replace matched records' },
                  { mode: 'update', label: 'Update existing fields only', desc: 'Update fields filled in Excel' },
                  { mode: 'new', label: 'Import as new record', desc: 'Import anyway as separate record' }
                ].map(opt => (
                  <button
                    key={opt.mode}
                    onClick={() => setDuplicateMode(opt.mode as DuplicateMode)}
                    className={`px-4 py-2 text-left rounded-xl border text-xs font-semibold cursor-pointer transition ${
                      duplicateMode === opt.mode
                        ? 'border-indigo-600 bg-indigo-50/25 text-indigo-950 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>{opt.label}</div>
                    <div className="text-[10px] font-normal text-slate-400 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Info className="h-4 w-4 text-indigo-500 shrink-0" />
                <span>
                  {duplicateMode === 'skip' && "Duplicates will be bypassed. No modifications will be made to existing data."}
                  {duplicateMode === 'replace' && "Existing matches will be completely overwritten while keeping original IDs."}
                  {duplicateMode === 'update' && "Only non-empty Excel columns will update matching records. Your manual edits in the app are safe."}
                  {duplicateMode === 'new' && "Duplicates will be imported as fresh records, potentially resulting in duplicates."}
                </span>
              </div>

              <div className="flex gap-2 shrink-0 justify-end">
                <button
                  onClick={() => setStep('mapping')}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-medium transition cursor-pointer"
                >
                  Back to Mapping
                </button>

                {errorRows > 0 && (
                  <button
                    onClick={handleDownloadErrorCSV}
                    className="px-4 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-sm font-medium transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="h-4 w-4" />
                    Download Errors ({errorRows})
                  </button>
                )}

                <button
                  onClick={handleFinalImport}
                  disabled={processedRows.filter(r => r.isValid).length === 0}
                  className={`px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-sm font-semibold shadow-md flex items-center gap-1.5 transition cursor-pointer ${
                    processedRows.filter(r => r.isValid).length === 0 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <Check className="h-4 w-4" />
                  Confirm Import ({importableRowsCount})
                </button>
              </div>
            </div>
          </div>

          {/* PREVIEW TABLE */}
          <div className="bg-white border border-slate-150 rounded-xl p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-display">Cleaned & Normalized Roster (20 Row Limit)</h3>
              <p className="text-xs text-slate-500 mt-0.5">This shows how your raw data is transformed. Only rows with green status will be imported.</p>
            </div>

            <div className="overflow-x-auto border border-slate-150 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-150">
                    <th className="px-4 py-3 text-center">Row</th>
                    <th className="px-4 py-3">Status / Alert</th>
                    <th className="px-4 py-3">Employee ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Position & Dept</th>
                    {importType === 'contract' ? (
                      <>
                        <th className="px-4 py-3">Contract Span</th>
                        <th className="px-4 py-3">Compensation & Nego</th>
                        <th className="px-4 py-3">Contract Status</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-3">Probation Span</th>
                        <th className="px-4 py-3">Review Status</th>
                        <th className="px-4 py-3">Final Decision</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processedRows.slice(0, 20).map((row, index) => {
                    const { rowIndex, cleaned, isValid, errors, warnings, isDuplicate } = row;
                    let badgeColor = "bg-emerald-50 text-emerald-800 border-emerald-200";
                    let badgeLabel = "Ready";

                    if (!isValid) {
                      badgeColor = "bg-rose-50 text-rose-800 border-rose-200";
                      badgeLabel = "Invalid";
                    } else if (isDuplicate) {
                      if (duplicateMode === 'skip') {
                        badgeColor = "bg-slate-100 text-slate-500 border-slate-250";
                        badgeLabel = "Duplicate (Skip)";
                      } else if (duplicateMode === 'replace') {
                        badgeColor = "bg-indigo-50 text-indigo-700 border-indigo-200";
                        badgeLabel = "Duplicate (Replace)";
                      } else if (duplicateMode === 'update') {
                        badgeColor = "bg-teal-50 text-teal-700 border-teal-200";
                        badgeLabel = "Duplicate (Update)";
                      } else {
                        badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                        badgeLabel = "Duplicate (As New)";
                      }
                    } else if (warnings.length > 0) {
                      badgeColor = "bg-amber-50 text-amber-800 border-amber-200";
                      badgeLabel = "Warning";
                    }

                    const isDimmed = isValid && isDuplicate && duplicateMode === 'skip';

                    return (
                      <tr key={index} className={`hover:bg-slate-50/50 transition ${!isValid ? "bg-rose-50/10" : isDimmed ? "bg-slate-50/40 opacity-50 line-through text-slate-400" : ""}`}>
                        <td className="px-4 py-4 text-center font-mono font-bold text-slate-400">
                          {rowIndex}
                        </td>
                        <td className="px-4 py-4 space-y-1 max-w-[200px]">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                            {badgeLabel}
                          </span>
                          {errors.map((e: string) => (
                            <div key={e} className="text-[10px] text-rose-600 font-semibold leading-tight">• {e}</div>
                          ))}
                          {warnings.map((w: string) => (
                            <div key={w} className="text-[10px] text-amber-600 font-semibold leading-tight">• {w}</div>
                          ))}
                        </td>
                        <td className="px-4 py-4 font-mono font-medium text-slate-800">
                          {cleaned.employeeId}
                        </td>
                        <td className="px-4 py-4 font-bold text-slate-850">
                          {cleaned.employeeName || <span className="text-rose-400 italic">[Blank Name]</span>}
                        </td>
                        <td className="px-4 py-4 space-y-0.5">
                          <div className="font-semibold text-slate-800">{cleaned.position || <span className="text-rose-400 italic">[Blank Position]</span>}</div>
                          <div className="text-[10px] text-slate-400">{cleaned.department || "-"}</div>
                        </td>
                        {importType === 'contract' ? (
                          <>
                            <td className="px-4 py-4 space-y-0.5 font-mono text-[11px]">
                              <div>Start: {cleaned.contractStartDate || "-"}</div>
                              <div className="font-bold text-indigo-700">End: {cleaned.contractEndDate || <span className="text-rose-400 italic">[Blank]</span>}</div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col gap-1">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold w-max ${
                                  cleaned.compensationReviewNeeded 
                                    ? "bg-amber-50 text-amber-700 border border-amber-200" 
                                    : "bg-slate-50 text-slate-500"
                                }`}>
                                  {cleaned.compensationReviewNeeded ? "Review Needed" : "No Review"}
                                </span>
                                {cleaned.negotiationStatus && cleaned.negotiationStatus !== "No Negotiation" && (
                                  <span className="text-[10px] text-indigo-600 font-medium">{cleaned.negotiationStatus}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {cleaned.contractStatus}
                              </span>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-4 space-y-0.5 font-mono text-[11px]">
                              <div>Start: {cleaned.probationStartDate || "-"}</div>
                              <div className="font-bold text-emerald-700">End: {cleaned.probationEndDate || <span className="text-rose-400 italic">[Blank]</span>}</div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                                {cleaned.reviewFormStatus}
                              </span>
                            </td>
                            <td className="px-4 py-4 font-semibold text-slate-800">
                              {cleaned.finalDecision || "-"}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalRows > 20 && (
              <p className="text-xs text-slate-400 text-center font-mono">
                Showing first 20 rows of {totalRows} detected records...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
