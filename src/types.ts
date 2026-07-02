export enum ContractStatus {
  Active = "Active",
  NeedReview = "Need Review",
  WaitingUserReview = "Waiting User Review",
  WaitingDirectorApproval = "Waiting Director Approval",
  SalaryNegotiation = "Compensation Review",
  ContractDrafting = "Contract Drafting",
  WaitingHeadHRReview = "Waiting Head HR Review",
  ContractSent = "Contract Sent",
  WaitingSignedContract = "Waiting Signed Contract",
  SignedReceived = "Signed Received",
  Completed = "Completed",
  NotRenewed = "Not Renewed",
  ConvertedToPermanent = "Converted to Permanent",
  EmployeeDeclined = "Employee Declined",
  Critical = "Critical",
  Overdue = "Overdue"
}

export enum ProbationStatus {
  ActiveProbation = "Active Probation",
  NeedReview = "Need Review",
  WaitingReviewForm = "Waiting Review Form",
  WaitingUserRecommendation = "Waiting User Recommendation",
  WaitingDirectorApproval = "Waiting Director Approval",
  PassedProbation = "Passed Probation",
  FailedProbation = "Failed Probation",
  ExtendedProbation = "Extended Probation",
  ConvertedToContract = "Converted to Contract",
  ConvertedToPermanent = "Converted to Permanent",
  Critical = "Critical",
  Overdue = "Overdue"
}

export enum UserRecommendation {
  Extend = "Extend",
  NotExtend = "Not Extend",
  ConvertToPermanent = "Convert to Permanent",
  Hold = "Hold",
  PassProbation = "Pass Probation",
  FailProbation = "Fail Probation",
  ExtendProbation = "Extend Probation",
  None = "None"
}

export enum ApprovalStatus {
  Pending = "Pending",
  Approved = "Approved",
  Rejected = "Rejected",
  RevisionNeeded = "Revision Needed",
  None = "None"
}

export enum SalaryNegotiationStatus {
  NoNegotiation = "No Negotiation",
  CompensationReviewNeeded = "Compensation Review Needed",
  RequestedByEmployee = "Requested by Employee",
  UnderDiscussion = "Under Discussion",
  WaitingPayroll = "Waiting Payroll",
  WaitingManagement = "Waiting Management",
  ApprovedByManagement = "Approved by Management",
  RejectedByManagement = "Rejected by Management",
  Resolved = "Resolved",
  Cancelled = "Cancelled"
}

export type PriorityType = "Low" | "Medium" | "High" | "Critical" | "Overdue";

export interface ContractItem {
  id: string; // Employee ID or generated UUID
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  directManager: string;
  contractType: string; // e.g. "PKWT I", "PKWT II", etc.
  contractNumber: string;
  contractStartDate: string;
  contractEndDate: string;
  daysRemaining: number; // Auto calculated
  compensationReviewNeeded?: boolean;
  negotiationStatus?: string;
  negotiationNotes?: string;
  payrollFollowUpNotes?: string;
  userRecommendation: UserRecommendation;
  directorApproval: ApprovalStatus;
  headHRReview: ApprovalStatus;
  contractDraftDate: string;
  contractSentDate: string;
  signedDeadline: string;
  signedReceivedDate: string;
  contractStatus: ContractStatus;
  salaryNegotiationStatus: SalaryNegotiationStatus;
  hrPic: string;
  notes: string;
  priority: PriorityType; // Auto calculated
  // ARC 3 Optional Email Sent Dates
  userReviewEmailSentDate?: string;
  directorApprovalEmailSentDate?: string;
  headHrReviewEmailSentDate?: string;
  employeeContractEmailSentDate?: string;
  signedFollowUpEmailSentDate?: string;
  escalationEmailSentDate?: string;
  sourceProbationId?: string;
  createdFrom?: string;
  isSampleData?: boolean;
}

export interface ProbationItem {
  id: string; // Employee ID or generated UUID
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  directManager: string;
  probationStartDate: string;
  probationEndDate: string;
  daysRemaining: number; // Auto calculated
  reviewFormStatus: string; // e.g. "Sent to User", "Completed", "Pending"
  userRecommendation: UserRecommendation;
  directorApproval: ApprovalStatus;
  finalDecision: string; // Passed / Failed / Extended / etc.
  newEmploymentStatus: string; // "Permanent Employee", "Contract Extended", "Terminated"
  hrPic: string;
  notes: string;
  probationStatus: ProbationStatus; // Added to map status
  priority: PriorityType; // Auto calculated
  // ARC 3 Optional Email Sent Dates
  probationReviewEmailSentDate?: string;
  probationApprovalEmailSentDate?: string;
  escalationEmailSentDate?: string;
  linkedContractId?: string;
  isSampleData?: boolean;
}

// Master / Helper functions for auto calculating Priority and Days Remaining
export function getTodayDateStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateDaysBetween(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  
  // Set times to midnight to avoid hour differences
  start.setHours(0,0,0,0);
  end.setHours(0,0,0,0);
  
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export interface CalculatedSLAResult {
  daysRemaining: number;
  priority: PriorityType;
  suggestedStatus?: string;
}

export function computeContractSLA(endDateStr: string, currentStatus: ContractStatus, referenceDateStr: string = getTodayDateStr()): CalculatedSLAResult {
  const daysRemaining = calculateDaysBetween(referenceDateStr, endDateStr);
  
  // Check if already completed/not renewed/converted
  const isCompleted = [
    ContractStatus.Completed,
    ContractStatus.NotRenewed,
    ContractStatus.ConvertedToPermanent
  ].includes(currentStatus);

  if (daysRemaining < 0) {
    if (isCompleted) {
      return { daysRemaining, priority: "Low" };
    }
    return { daysRemaining, priority: "Overdue" };
  }

  if (isCompleted) {
    return { daysRemaining, priority: "Low" };
  }

  if (daysRemaining > 60) {
    return { daysRemaining, priority: "Low" };
  } else if (daysRemaining >= 46 && daysRemaining <= 60) {
    return { daysRemaining, priority: "Medium", suggestedStatus: ContractStatus.NeedReview };
  } else if (daysRemaining >= 31 && daysRemaining <= 45) {
    return { daysRemaining, priority: "Medium", suggestedStatus: ContractStatus.WaitingUserReview };
  } else if (daysRemaining >= 22 && daysRemaining <= 30) {
    return { daysRemaining, priority: "High", suggestedStatus: ContractStatus.WaitingDirectorApproval };
  } else if (daysRemaining >= 15 && daysRemaining <= 21) {
    return { daysRemaining, priority: "High", suggestedStatus: ContractStatus.ContractDrafting };
  } else if (daysRemaining >= 11 && daysRemaining <= 14) {
    return { daysRemaining, priority: "High", suggestedStatus: ContractStatus.WaitingHeadHRReview };
  } else if (daysRemaining >= 8 && daysRemaining <= 10) {
    return { daysRemaining, priority: "High", suggestedStatus: ContractStatus.ContractSent };
  } else if (daysRemaining >= 4 && daysRemaining <= 7) {
    return { daysRemaining, priority: "High", suggestedStatus: ContractStatus.WaitingSignedContract };
  } else {
    // 0 to 3 days
    return { daysRemaining, priority: "Critical", suggestedStatus: ContractStatus.Critical };
  }
}

export function computeProbationSLA(endDateStr: string, currentDecision: string, referenceDateStr: string = getTodayDateStr()): CalculatedSLAResult {
  const daysRemaining = calculateDaysBetween(referenceDateStr, endDateStr);
  const hasDecision = currentDecision && currentDecision.trim().length > 0 && currentDecision !== "-";

  if (daysRemaining < 0) {
    if (hasDecision) {
      return { daysRemaining, priority: "Low" };
    }
    return { daysRemaining, priority: "Overdue" };
  }

  if (hasDecision) {
    return { daysRemaining, priority: "Low" };
  }

  if (daysRemaining > 45) {
    return { daysRemaining, priority: "Low" };
  } else if (daysRemaining >= 31 && daysRemaining <= 45) {
    return { daysRemaining, priority: "Medium", suggestedStatus: "Need Review" };
  } else if (daysRemaining >= 21 && daysRemaining <= 30) {
    return { daysRemaining, priority: "Medium", suggestedStatus: "Waiting Review Form" };
  } else if (daysRemaining >= 14 && daysRemaining <= 20) {
    return { daysRemaining, priority: "High", suggestedStatus: "Waiting User Recommendation" };
  } else if (daysRemaining >= 7 && daysRemaining <= 13) {
    return { daysRemaining, priority: "High", suggestedStatus: "Waiting Director Approval" };
  } else {
    // 0 to 6 days
    return { daysRemaining, priority: "Critical", suggestedStatus: "Critical" };
  }
}

// ARC 3.5 Auto-Generate Contract Sequence Helpers
export function extractNumericContractNumber(contractNumber: string | null | undefined): number | null {
  if (!contractNumber) return null;
  const trimmed = contractNumber.trim();
  if (!trimmed) return null;
  
  // Ambil hanya nomor yang murni numerik atau angka jelas
  if (/^\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  }
  return null;
}

export function detectContractNumberPadding(contractNumbers: string[]): number {
  if (contractNumbers.length === 0) return 3;
  const lengths = contractNumbers.map(cn => cn.length);
  const counts: Record<number, number> = {};
  let maxCount = 0;
  let majorityLength = 3;
  for (const len of lengths) {
    counts[len] = (counts[len] || 0) + 1;
    if (counts[len] > maxCount) {
      maxCount = counts[len];
      majorityLength = len;
    }
  }
  return majorityLength;
}

export function isContractNumberExists(contracts: ContractItem[], contractNumber: string): boolean {
  if (!contractNumber) return false;
  const target = contractNumber.trim().toLowerCase();
  return contracts.some(c => c.contractNumber && c.contractNumber.trim().toLowerCase() === target);
}

export function getNextContractSequence(contracts: ContractItem[]): string {
  // Filter all contractNumber from Contract Tracker that are purely numeric
  const validNumericStrings = contracts
    .map(c => c.contractNumber)
    .filter((cn): cn is string => !!cn)
    .map(cn => cn.trim())
    .filter(cn => /^\d+$/.test(cn));

  // Detect majority padding length (e.g. 3 for "001")
  const padding = detectContractNumberPadding(validNumericStrings);

  let nextVal = 1;
  if (validNumericStrings.length > 0) {
    const numericValues = validNumericStrings.map(cn => parseInt(cn, 10));
    const maxVal = Math.max(...numericValues);
    nextVal = maxVal + 1;
  }

  // Ensure nextVal produces a unique contractNumber by raising it if it already exists
  let candidate = String(nextVal).padStart(padding, "0");
  while (isContractNumberExists(contracts, candidate)) {
    nextVal++;
    candidate = String(nextVal).padStart(padding, "0");
  }

  return candidate;
}
