import { 
  ContractStatus, 
  ProbationStatus, 
  UserRecommendation, 
  ApprovalStatus, 
  SalaryNegotiationStatus 
} from "../types";

export function parseExcelDate(val: any): string {
  if (val === undefined || val === null || val === '') return '';
  
  // If it's a number, check if it looks like an Excel serial date
  if (typeof val === 'number') {
    if (val > 10000 && val < 100000) {
      const date = new Date(Math.round((val - 25569) * 86400000));
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
  }

  const str = String(val).trim();
  if (!str) return '';

  // Handle DD/MM/YYYY or DD-MM-YYYY formats directly
  const dmyPattern = /^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})$/;
  const dmyMatch = str.match(dmyPattern);
  if (dmyMatch) {
    let day = parseInt(dmyMatch[1], 10);
    let month = parseInt(dmyMatch[2], 10);
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) year += 2000;
    
    // Swap if day/month is mixed up (e.g., month > 12)
    if (month > 12 && day <= 12) {
      const temp = month;
      month = day;
      day = temp;
    }
    const formattedMonth = String(month).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    return `${year}-${formattedMonth}-${formattedDay}`;
  }

  // Try normal Date parsing
  const timestamp = Date.parse(str);
  if (!isNaN(timestamp)) {
    const d = new Date(timestamp);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return str;
}

export function cleanCurrency(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  const str = String(val).trim();
  
  let cleanStr = str.replace(/[Rr]p\.?\s*/g, '').replace(/[\$\€\£\s]/g, '');
  
  if (cleanStr.includes(',') && cleanStr.includes('.')) {
    const commaIndex = cleanStr.lastIndexOf(',');
    const dotIndex = cleanStr.lastIndexOf('.');
    if (commaIndex > dotIndex) {
      cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
    } else {
      cleanStr = cleanStr.replace(/,/g, '');
    }
  } else if (cleanStr.includes(',')) {
    const parts = cleanStr.split(',');
    if (parts.length > 1 && parts[parts.length - 1].length === 3) {
      cleanStr = cleanStr.replace(/,/g, '');
    } else {
      cleanStr = cleanStr.replace(',', '.');
    }
  } else if (cleanStr.includes('.')) {
    const parts = cleanStr.split('.');
    if (parts.length > 1 && parts[parts.length - 1].length === 3) {
      cleanStr = cleanStr.replace(/\./g, '');
    }
  }

  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? 0 : parsed;
}

export function normalizeStatus(val: any, type: 'contract' | 'probation'): string {
  const str = String(val || '').trim();
  if (type === 'contract') {
    if (!str) return ContractStatus.Active;
    const valLower = str.toLowerCase();
    for (const key of Object.values(ContractStatus)) {
      if (key.toLowerCase() === valLower) {
        return key;
      }
    }
    if (valLower.includes('active')) return ContractStatus.Active;
    if (valLower.includes('need') && valLower.includes('review')) return ContractStatus.NeedReview;
    if (valLower.includes('user') && valLower.includes('review')) return ContractStatus.WaitingUserReview;
    if (valLower.includes('director') || valLower.includes('dir')) return ContractStatus.WaitingDirectorApproval;
    if (valLower.includes('salary') || valLower.includes('nego')) return ContractStatus.SalaryNegotiation;
    if (valLower.includes('draft')) return ContractStatus.ContractDrafting;
    if (valLower.includes('head hr') || valLower.includes('hr review')) return ContractStatus.WaitingHeadHRReview;
    if (valLower.includes('sent')) return ContractStatus.ContractSent;
    if (valLower.includes('signed') && valLower.includes('wait')) return ContractStatus.WaitingSignedContract;
    if (valLower.includes('signed') || valLower.includes('receive')) return ContractStatus.SignedReceived;
    if (valLower.includes('complete')) return ContractStatus.Completed;
    if (valLower.includes('not renew')) return ContractStatus.NotRenewed;
    if (valLower.includes('permanent') || valLower.includes('convert')) return ContractStatus.ConvertedToPermanent;
    
    return ContractStatus.Active;
  } else {
    if (!str) return ProbationStatus.ActiveProbation;
    const valLower = str.toLowerCase();
    for (const key of Object.values(ProbationStatus)) {
      if (key.toLowerCase() === valLower) {
        return key;
      }
    }
    if (valLower.includes('active')) return ProbationStatus.ActiveProbation;
    if (valLower.includes('need') && valLower.includes('review')) return ProbationStatus.NeedReview;
    if (valLower.includes('form')) return ProbationStatus.WaitingReviewForm;
    if (valLower.includes('recommend')) return ProbationStatus.WaitingUserRecommendation;
    if (valLower.includes('director') || valLower.includes('dir')) return ProbationStatus.WaitingDirectorApproval;
    if (valLower.includes('pass')) return ProbationStatus.PassedProbation;
    if (valLower.includes('fail')) return ProbationStatus.FailedProbation;
    if (valLower.includes('extend')) return ProbationStatus.ExtendedProbation;
    if (valLower.includes('contract')) return ProbationStatus.ConvertedToContract;
    if (valLower.includes('permanent')) return ProbationStatus.ConvertedToPermanent;

    return ProbationStatus.ActiveProbation;
  }
}

export function normalizeUserRecommendation(val: any): UserRecommendation {
  const str = String(val || '').trim().toLowerCase();
  if (!str) return UserRecommendation.None;
  if (str.includes('not extend')) return UserRecommendation.NotExtend;
  if (str.includes('extend probation')) return UserRecommendation.ExtendProbation;
  if (str.includes('extend')) return UserRecommendation.Extend;
  if (str.includes('permanent') || str.includes('converted')) return UserRecommendation.ConvertToPermanent;
  if (str.includes('hold')) return UserRecommendation.Hold;
  if (str.includes('pass')) return UserRecommendation.PassProbation;
  if (str.includes('fail')) return UserRecommendation.FailProbation;
  return UserRecommendation.None;
}

export function normalizeApprovalStatus(val: any): ApprovalStatus {
  const str = String(val || '').trim().toLowerCase();
  if (!str) return ApprovalStatus.None;
  if (str.includes('approve') || str.includes('setuju')) return ApprovalStatus.Approved;
  if (str.includes('reject') || str.includes('tolak')) return ApprovalStatus.Rejected;
  if (str.includes('pending') || str.includes('tunda')) return ApprovalStatus.Pending;
  if (str.includes('rev') || str.includes('perbaikan')) return ApprovalStatus.RevisionNeeded;
  return ApprovalStatus.None;
}

export function normalizeSalaryNegotiationStatus(val: any): SalaryNegotiationStatus {
  const str = String(val || '').trim().toLowerCase();
  if (!str) return SalaryNegotiationStatus.NoNegotiation;
  if (str.includes('no') || str.includes('tidak')) return SalaryNegotiationStatus.NoNegotiation;
  if (str.includes('employee') || str.includes('karyawan')) return SalaryNegotiationStatus.RequestedByEmployee;
  if (str.includes('company') || str.includes('perusahaan') || str.includes('management') || str.includes('direksi')) return SalaryNegotiationStatus.WaitingManagement;
  if (str.includes('review') || str.includes('kompensasi')) return SalaryNegotiationStatus.CompensationReviewNeeded;
  if (str.includes('discuss') || str.includes('diskusi') || str.includes('nego')) return SalaryNegotiationStatus.UnderDiscussion;
  if (str.includes('payroll')) return SalaryNegotiationStatus.WaitingPayroll;
  if (str.includes('approve') || str.includes('setuju') || str.includes('deal')) return SalaryNegotiationStatus.ApprovedByManagement;
  if (str.includes('reject') || str.includes('tolak')) return SalaryNegotiationStatus.RejectedByManagement;
  if (str.includes('resolved') || str.includes('selesai') || str.includes('clear')) return SalaryNegotiationStatus.Resolved;
  if (str.includes('cancel') || str.includes('batal')) return SalaryNegotiationStatus.Cancelled;
  return SalaryNegotiationStatus.NoNegotiation;
}

export function generateEmployeeId(existingIds: string[]): string {
  const prefix = "EMP-TEMP-";
  let count = 1;
  while (true) {
    const candidate = `${prefix}${String(count).padStart(3, '0')}`;
    if (!existingIds.includes(candidate)) {
      return candidate;
    }
    count++;
  }
}

export function autoMapColumns(
  excelHeaders: string[], 
  targetFields: { key: string; label: string; synonyms: string[] }[]
): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  targetFields.forEach(field => {
    const cleanKey = field.key.toLowerCase();
    const cleanLabel = field.label.toLowerCase();
    
    // Find matching excelHeader
    const matchedHeader = excelHeaders.find(header => {
      const cleanHeader = header.trim().toLowerCase();
      if (cleanHeader === cleanKey) return true;
      if (cleanHeader === cleanLabel) return true;
      return field.synonyms.some(synonym => {
        const cleanSyn = synonym.toLowerCase();
        return cleanHeader === cleanSyn || 
               cleanHeader.includes(cleanSyn) || 
               cleanSyn.includes(cleanHeader);
      });
    });
    
    if (matchedHeader) {
      mapping[field.key] = matchedHeader;
    }
  });
  
  return mapping;
}

export function detectHeaderRow(
  data: any[][], 
  targetFields: { key: string; label: string; synonyms: string[] }[]
): { headerRowIndex: number; headers: string[] } {
  const maxRowsToCheck = Math.min(data.length, 15);
  let bestRowIndex = 0;
  let highestScore = -1;
  let bestHeaders: string[] = [];

  for (let i = 0; i < maxRowsToCheck; i++) {
    const row = data[i];
    if (!row || !Array.isArray(row)) continue;
    
    let score = 0;
    const currentHeaders: string[] = [];

    row.forEach(cell => {
      const cellStr = String(cell ?? '').trim();
      if (!cellStr) return;
      currentHeaders.push(cellStr);
      
      const cleanCell = cellStr.toLowerCase();
      
      const matches = targetFields.some(field => {
        if (field.key.toLowerCase() === cleanCell) return true;
        if (field.label.toLowerCase() === cleanCell) return true;
        return field.synonyms.some(synonym => {
          const cleanSyn = synonym.toLowerCase();
          return cleanCell === cleanSyn || 
                 cleanCell.includes(cleanSyn) || 
                 cleanSyn.includes(cleanCell);
        });
      });
      
      if (matches) {
        score++;
      }
    });

    if (score > highestScore) {
      highestScore = score;
      bestRowIndex = i;
      bestHeaders = currentHeaders;
    }
  }

  if (highestScore <= 0 || bestHeaders.length === 0) {
    const fallbackHeaders = (data[0] || []).map(h => String(h ?? '').trim());
    return {
      headerRowIndex: 0,
      headers: fallbackHeaders.filter(h => h !== "")
    };
  }

  return {
    headerRowIndex: bestRowIndex,
    headers: bestHeaders.filter(h => h !== "")
  };
}

export function validateImportedRow(
  row: Record<string, any>, 
  type: 'contract' | 'probation'
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (type === 'contract') {
    if (!row.employeeName || String(row.employeeName).trim() === '') {
      errors.push("Employee Name is required");
    }
    if (!row.position || String(row.position).trim() === '') {
      errors.push("Position is required");
    }
    if (!row.contractEndDate || String(row.contractEndDate).trim() === '') {
      errors.push("Contract End Date is required");
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(row.contractEndDate)) {
        warnings.push(`Contract End Date '${row.contractEndDate}' format mismatch (expected YYYY-MM-DD)`);
      }
    }
    
    if (row.contractStartDate && !/^\d{4}-\d{2}-\d{2}$/.test(row.contractStartDate)) {
      warnings.push(`Contract Start Date '${row.contractStartDate}' format mismatch (expected YYYY-MM-DD)`);
    }
    // Salary nominal checks removed for privacy
  } else {
    if (!row.employeeName || String(row.employeeName).trim() === '') {
      errors.push("Employee Name is required");
    }
    if (!row.position || String(row.position).trim() === '') {
      errors.push("Position is required");
    }
    if (!row.probationEndDate || String(row.probationEndDate).trim() === '') {
      errors.push("Probation End Date is required");
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(row.probationEndDate)) {
        warnings.push(`Probation End Date '${row.probationEndDate}' format mismatch (expected YYYY-MM-DD)`);
      }
    }
    
    if (row.probationStartDate && !/^\d{4}-\d{2}-\d{2}$/.test(row.probationStartDate)) {
      warnings.push(`Probation Start Date '${row.probationStartDate}' format mismatch (expected YYYY-MM-DD)`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
