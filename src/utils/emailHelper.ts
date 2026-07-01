import { 
  ContractItem, 
  ProbationItem, 
  ContractStatus, 
  ProbationStatus, 
  UserRecommendation, 
  ApprovalStatus 
} from "../types";

export type EmailTemplateType = 
  | "user-review"
  | "director-approval"
  | "head-hr-review"
  | "contract-sent"
  | "signed-followup"
  | "escalation"
  | "probation-request"
  | "probation-approval";

export interface EmailDraft {
  subject: string;
  body: string;
  recipients: string;
  cc: string;
}

// 1. Get relevant records based on template type
export function getRelevantRecordsForEmailType(
  type: EmailTemplateType,
  contracts: ContractItem[],
  probations: ProbationItem[]
): { contracts: ContractItem[]; probations: ProbationItem[] } {
  switch (type) {
    case "user-review":
      return {
        contracts: contracts.filter(c => 
          c.contractStatus === ContractStatus.NeedReview || 
          c.contractStatus === ContractStatus.WaitingUserReview
        ),
        probations: probations.filter(p => 
          p.probationStatus === ProbationStatus.NeedReview || 
          p.probationStatus === ProbationStatus.WaitingReviewForm
        )
      };

    case "director-approval":
      return {
        contracts: contracts.filter(c => 
          c.userRecommendation !== UserRecommendation.None && 
          c.directorApproval === ApprovalStatus.Pending
        ),
        probations: probations.filter(p => 
          p.userRecommendation !== UserRecommendation.None && 
          p.directorApproval === ApprovalStatus.Pending
        )
      };

    case "head-hr-review":
      return {
        contracts: contracts.filter(c => 
          c.contractStatus === ContractStatus.ContractDrafting || 
          c.contractStatus === ContractStatus.WaitingHeadHRReview
        ),
        probations: []
      };

    case "contract-sent":
      return {
        contracts: contracts.filter(c => 
          c.contractStatus === ContractStatus.WaitingHeadHRReview || 
          c.contractStatus === ContractStatus.ContractSent
        ),
        probations: []
      };

    case "signed-followup":
      return {
        contracts: contracts.filter(c => 
          (c.contractStatus === ContractStatus.ContractSent || 
           c.contractStatus === ContractStatus.WaitingSignedContract) && 
          (!c.signedReceivedDate || c.signedReceivedDate.trim() === "")
        ),
        probations: []
      };

    case "escalation":
      return {
        contracts: contracts.filter(c => 
          c.priority === "Critical" || c.priority === "Overdue"
        ),
        probations: probations.filter(p => 
          p.priority === "Critical" || p.priority === "Overdue"
        )
      };

    case "probation-request":
      return {
        contracts: [],
        probations: probations.filter(p => 
          p.probationStatus === ProbationStatus.NeedReview || 
          p.probationStatus === ProbationStatus.WaitingReviewForm
        )
      };

    case "probation-approval":
      return {
        contracts: [],
        probations: probations.filter(p => 
          p.userRecommendation !== UserRecommendation.None && 
          p.directorApproval === ApprovalStatus.Pending
        )
      };

    default:
      return { contracts: [], probations: [] };
  }
}

// 2. Format lists into clean text table or bullet points
export function formatContractListForEmail(contracts: ContractItem[]): string {
  if (contracts.length === 0) return "[No Contract Data Selected]";
  
  let result = "--------------------------------------------------------------------------------------------------\n";
  result += "Nama Karyawan    | Jabatan          | Departemen   | Manager      | Expired Date | Sisa Hari | Rekomendasi\n";
  result += "--------------------------------------------------------------------------------------------------\n";
  
  contracts.forEach(c => {
    const name = c.employeeName.padEnd(16).substring(0, 16);
    const pos = c.position.padEnd(16).substring(0, 16);
    const dept = c.department.padEnd(12).substring(0, 12);
    const manager = c.directManager.padEnd(12).substring(0, 12);
    const exp = c.contractEndDate.padEnd(12);
    const days = String(c.daysRemaining).padStart(4) + " Hari ";
    const rec = c.userRecommendation;
    
    result += `${name} | ${pos} | ${dept} | ${manager} | ${exp} | ${days} | ${rec}\n`;
  });
  result += "--------------------------------------------------------------------------------------------------";
  return result;
}

export function formatProbationListForEmail(probations: ProbationItem[]): string {
  if (probations.length === 0) return "[No Probation Data Selected]";
  
  let result = "--------------------------------------------------------------------------------------------------\n";
  result += "Nama Karyawan    | Jabatan          | Departemen   | Manager      | Expired Date | Sisa Hari | Keputusan Final\n";
  result += "--------------------------------------------------------------------------------------------------\n";
  
  probations.forEach(p => {
    const name = p.employeeName.padEnd(16).substring(0, 16);
    const pos = p.position.padEnd(16).substring(0, 16);
    const dept = p.department.padEnd(12).substring(0, 12);
    const manager = p.directManager.padEnd(12).substring(0, 12);
    const exp = p.probationEndDate.padEnd(12);
    const days = String(p.daysRemaining).padStart(4) + " Hari ";
    const dec = p.finalDecision || "-";
    
    result += `${name} | ${pos} | ${dept} | ${manager} | ${exp} | ${days} | ${dec}\n`;
  });
  result += "--------------------------------------------------------------------------------------------------";
  return result;
}

// 3. Generate Subject based on template
export function generateEmailSubject(
  type: EmailTemplateType, 
  records: { contracts: ContractItem[]; probations: ProbationItem[] },
  currentMonthYear: string
): string {
  switch (type) {
    case "user-review":
      return `Reminder Review Kontrak & Probation - ${currentMonthYear}`;
    
    case "director-approval":
      return `Approval Perpanjangan Kontrak / Kelulusan Probation - ${currentMonthYear}`;
    
    case "head-hr-review": {
      const names = records.contracts.slice(0, 2).map(c => c.employeeName).join(", ");
      const suffix = records.contracts.length > 2 ? " & Batch" : "";
      return `Review Draft Kontrak Karyawan - [${names || "Draft"}${suffix}]`;
    }
    
    case "contract-sent": {
      const name = records.contracts[0]?.employeeName || "[Nama Karyawan]";
      return `Dokumen Perpanjangan Kontrak Kerja - ${name}`;
    }
    
    case "signed-followup": {
      const name = records.contracts[0]?.employeeName || "[Nama Karyawan]";
      return `Follow Up Pengembalian Kontrak Kerja Signed - ${name}`;
    }
    
    case "escalation":
      return `Urgent - Kontrak/Probation Mendekati atau Melewati Deadline`;
    
    case "probation-request":
      return `Permintaan Review Probation Karyawan - ${currentMonthYear}`;
    
    case "probation-approval": {
      const names = records.probations.slice(0, 2).map(p => p.employeeName).join(", ");
      const suffix = records.probations.length > 2 ? " & Batch" : "";
      return `Approval Kelulusan Probation - [${names || "Draft"}${suffix}]`;
    }
    
    default:
      return "Notification HR - Contract & Probation Control Room";
  }
}

// 4. Generate Body based on template
export function generateEmailBody(
  type: EmailTemplateType,
  records: { contracts: ContractItem[]; probations: ProbationItem[] },
  source: "contract" | "probation" | "both",
  currentMonthYear: string
): string {
  const contractList = records.contracts.length > 0 ? formatContractListForEmail(records.contracts) : "";
  const probationList = records.probations.length > 0 ? formatProbationListForEmail(records.probations) : "";
  
  // Combine lists cleanly
  const dataList = [contractList, probationList].filter(l => l && l !== "[No Contract Data Selected]" && l !== "[No Probation Data Selected]").join("\n\n");

  const managerName = source === "contract" 
    ? (records.contracts[0]?.directManager || "[User/Manager]")
    : (records.probations[0]?.directManager || "[User/Manager]");

  const employeeName = source === "contract"
    ? (records.contracts[0]?.employeeName || "[Nama Karyawan]")
    : (records.probations[0]?.employeeName || "[Nama Karyawan]");

  const deadlineDate = source === "contract"
    ? (records.contracts[0]?.contractEndDate || "[Deadline]")
    : (records.probations[0]?.probationEndDate || "[Deadline]");

  const signedDeadline = source === "contract"
    ? (records.contracts[0]?.signedDeadline || "[Signed Deadline]")
    : "[Signed Deadline]";

  switch (type) {
    case "user-review":
      return `Dear Bapak/Ibu ${managerName},

Mohon bantuannya untuk melakukan review dan memberikan rekomendasi atas karyawan berikut yang masa kontrak/probation-nya akan berakhir:

${dataList || "[Mohon pilih karyawan pada panel kiri]"}

Untuk karyawan kontrak, mohon konfirmasi apakah akan:
* Diperpanjang
* Tidak diperpanjang
* Diangkat menjadi karyawan tetap
* Hold terlebih dahulu

Untuk karyawan probation, mohon konfirmasi apakah:
* Lulus probation
* Tidak lulus probation
* Diperpanjang masa probation
* Dilanjutkan sebagai karyawan kontrak/tetap

Mohon feedback dapat diberikan maksimal ${deadlineDate}.

Terima kasih.

Best regards,
HR Team`;

    case "director-approval":
      return `Dear Bapak/Ibu Director,

Mohon approval untuk proses perpanjangan kontrak / kelulusan probation berikut berdasarkan rekomendasi user terkait:

${dataList || "[Mohon pilih karyawan pada panel kiri]"}

Apabila disetujui, HR akan melanjutkan proses administrasi kontrak sesuai keputusan final.

Terima kasih.

Best regards,
HR Team`;

    case "head-hr-review":
      return `Dear Head HR,

Mohon bantuannya untuk mereview draft kontrak berikut sebelum dikirimkan kepada karyawan:

${dataList || "[Mohon pilih karyawan pada panel kiri]"}

Mohon konfirmasi apabila draft sudah sesuai atau ada revisi yang perlu dilakukan.

Terima kasih.

Best regards,
HR Team`;

    case "contract-sent":
      return `Dear ${employeeName},

Terlampir dokumen perpanjangan kontrak kerja untuk dapat diperiksa terlebih dahulu.

Apabila sudah sesuai dan tidak ada pertanyaan, mohon dapat ditandatangani dan dikirimkan kembali kepada HR maksimal ${signedDeadline}.

Apabila terdapat pertanyaan atau hal yang perlu didiskusikan, silakan informasikan kepada HR terlebih dahulu.

Terima kasih.

Best regards,
HR Team`;

    case "signed-followup":
      return `Dear ${employeeName},

Kami ingin melakukan follow up terkait dokumen kontrak kerja yang telah dikirimkan sebelumnya.

Mohon bantuannya untuk mengirimkan kembali dokumen yang sudah ditandatangani maksimal ${signedDeadline}.

Apabila terdapat kendala atau pertanyaan, silakan informasikan kepada HR.

Terima kasih.

Best regards,
HR Team`;

    case "escalation":
      return `Dear Bapak/Ibu,

Mohon perhatian dan tindak lanjut segera untuk data berikut karena sudah masuk status Critical/Overdue:

${dataList || "[Mohon pilih karyawan pada panel kiri]"}

Mohon update keputusan/status terbaru agar proses administrasi HR dapat segera diselesaikan.

Terima kasih.

Best regards,
HR Team`;

    case "probation-request":
      return `Dear Bapak/Ibu ${managerName},

Mohon bantuannya untuk mengisi review performa probation atas karyawan berikut:

${dataList || "[Mohon pilih karyawan pada panel kiri]"}

Review ini dibutuhkan sebagai dasar keputusan kelulusan probation.

Mohon feedback dapat diberikan maksimal ${deadlineDate}.

Terima kasih.

Best regards,
HR Team`;

    case "probation-approval":
      return `Dear Bapak/Ibu Director,

Mohon approval atas hasil review probation berikut:

${dataList || "[Mohon pilih karyawan pada panel kiri]"}

Apabila disetujui, HR akan melanjutkan proses administrasi sesuai keputusan final.

Terima kasih.

Best regards,
HR Team`;

    default:
      return "";
  }
}

// 5. Mark as Sent logic
export function markEmailSent(
  type: EmailTemplateType,
  selectedContractIds: string[],
  selectedProbationIds: string[],
  contracts: ContractItem[],
  probations: ProbationItem[],
  sentDateStr: string
): { contracts: ContractItem[]; probations: ProbationItem[] } {
  const updatedContracts = contracts.map(c => {
    if (selectedContractIds.includes(c.id)) {
      const updated = { ...c };
      switch (type) {
        case "user-review":
          updated.userReviewEmailSentDate = sentDateStr;
          break;
        case "director-approval":
          updated.directorApprovalEmailSentDate = sentDateStr;
          break;
        case "head-hr-review":
          updated.headHrReviewEmailSentDate = sentDateStr;
          break;
        case "contract-sent":
          updated.employeeContractEmailSentDate = sentDateStr;
          break;
        case "signed-followup":
          updated.signedFollowUpEmailSentDate = sentDateStr;
          break;
        case "escalation":
          updated.escalationEmailSentDate = sentDateStr;
          break;
      }
      return updated;
    }
    return c;
  });

  const updatedProbations = probations.map(p => {
    if (selectedProbationIds.includes(p.id)) {
      const updated = { ...p };
      switch (type) {
        case "probation-request":
        case "user-review":
          updated.probationReviewEmailSentDate = sentDateStr;
          break;
        case "probation-approval":
        case "director-approval":
          updated.probationApprovalEmailSentDate = sentDateStr;
          break;
        case "escalation":
          updated.escalationEmailSentDate = sentDateStr;
          break;
      }
      return updated;
    }
    return p;
  });

  return {
    contracts: updatedContracts,
    probations: updatedProbations
  };
}
