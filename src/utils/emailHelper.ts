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
  | "probation-approval"
  | "exit-notice"
  | "exit-asset"
  | "exit-clearance"
  | "exit-interview"
  | "exit-documents-request"
  | "exit-follow-up";

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

    case "exit-notice":
    case "exit-asset":
    case "exit-clearance":
    case "exit-interview":
      return {
        contracts: contracts.filter(c => 
          ["Resigned", "End Process", "Exit Process", "Closed"].includes(c.contractStatus) ||
          (c.exitProcessStatus && c.exitProcessStatus !== "Not Started")
        ),
        probations: probations.filter(p => 
          ["Resigned", "Not Continued", "Failed Probation", "End Process", "Exit Process", "Closed"].includes(p.probationStatus) ||
          (p.exitProcessStatus && p.exitProcessStatus !== "Not Started")
        )
      };

    case "exit-documents-request": {
      const isOffboardingC = (c: ContractItem) => {
        const statuses = ["Resigned", "Not Renewed", "End Process", "Exit Process"];
        const endReasons = ["Resigned", "Not Renewed", "Failed Probation", "Employee Declined", "End Process", "Exit Process"];
        const isMatch = statuses.includes(c.contractStatus) || (c.endReason && endReasons.includes(c.endReason));
        return !!isMatch && !!c.lastWorkingDate && (!c.exitDocumentsSentDate || c.exitDocumentsSentDate.trim() === "");
      };
      const isOffboardingP = (p: ProbationItem) => {
        const statuses = ["Resigned", "Not Continued", "Failed Probation", "End Process", "Exit Process"];
        const endReasons = ["Resigned", "Not Renewed", "Failed Probation", "Employee Declined", "End Process", "Exit Process"];
        const isMatch = statuses.includes(p.probationStatus) || (p.endReason && endReasons.includes(p.endReason));
        return !!isMatch && !!p.lastWorkingDate && (!p.exitDocumentsSentDate || p.exitDocumentsSentDate.trim() === "");
      };
      return {
        contracts: contracts.filter(isOffboardingC),
        probations: probations.filter(isOffboardingP)
      };
    }

    case "exit-follow-up": {
      const isFollowUpC = (c: ContractItem) => {
        const hasSent = !!c.exitDocumentsSentDate && c.exitDocumentsSentDate.trim() !== "";
        const notClosed = c.exitProcessStatus !== "Closed";
        const formPending = !c.accessAssetFormCompletedDate || 
                            !c.exitClearanceCompletedDate || 
                            !c.exitInterviewCompletedDate ||
                            c.accessAssetFormStatus === "Pending" ||
                            c.exitClearanceFormStatus === "Pending" ||
                            ["Pending", "Sent"].includes(c.exitInterviewFormStatus || "");
        return hasSent && notClosed && formPending;
      };
      const isFollowUpP = (p: ProbationItem) => {
        const hasSent = !!p.exitDocumentsSentDate && p.exitDocumentsSentDate.trim() !== "";
        const notClosed = p.exitProcessStatus !== "Closed";
        const formPending = !p.accessAssetFormCompletedDate || 
                            !p.exitClearanceCompletedDate || 
                            !p.exitInterviewCompletedDate ||
                            p.accessAssetFormStatus === "Pending" ||
                            p.exitClearanceFormStatus === "Pending" ||
                            ["Pending", "Sent"].includes(p.exitInterviewFormStatus || "");
        return hasSent && notClosed && formPending;
      };
      return {
        contracts: contracts.filter(isFollowUpC),
        probations: probations.filter(isFollowUpP)
      };
    }

    default:
      return { contracts: [], probations: [] };
  }
}

// 2. Format lists into clean text table or bullet points
export function formatContractListForEmail(contracts: ContractItem[]): string {
  if (contracts.length === 0) return "";
  
  return contracts.map(c => {
    return `Nama Karyawan:
${c.employeeName}

Jabatan:
${c.position}

Department:
${c.department}

Tanggal Berakhir:
${c.contractEndDate}

Sisa Hari:
${c.daysRemaining} Hari

Rekomendasi:
${c.userRecommendation && c.userRecommendation !== "None" ? c.userRecommendation : "-"}`;
  }).join("\n\n================================\n\n");
}

export function formatProbationListForEmail(probations: ProbationItem[]): string {
  if (probations.length === 0) return "";
  
  return probations.map(p => {
    let rec = "-";
    if (p.userRecommendation && p.userRecommendation !== "None") {
      rec = p.userRecommendation;
    } else if (p.finalDecision && p.finalDecision !== "-") {
      rec = p.finalDecision;
    }
    return `Nama Karyawan:
${p.employeeName}

Jabatan:
${p.position}

Department:
${p.department}

Tanggal Berakhir:
${p.probationEndDate}

Sisa Hari:
${p.daysRemaining} Hari

Rekomendasi:
${rec}`;
  }).join("\n\n================================\n\n");
}

export function formatCompactContractList(contracts: ContractItem[]): string {
  if (contracts.length === 0) return "";
  return contracts.map((c, idx) => {
    return `${idx + 1}. ${c.employeeName}
   ${c.position} - ${c.department}
   Berakhir: ${c.contractEndDate} (${c.daysRemaining} Hari)`;
  }).join("\n\n");
}

export function formatCompactProbationList(probations: ProbationItem[]): string {
  if (probations.length === 0) return "";
  return probations.map((p, idx) => {
    return `${idx + 1}. ${p.employeeName}
   ${p.position} - ${p.department}
   Berakhir: ${p.probationEndDate} (${p.daysRemaining} Hari)`;
  }).join("\n\n");
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

    case "exit-notice": {
      const name = records.contracts[0]?.employeeName || records.probations[0]?.employeeName || "[Nama]";
      return `Pemberitahuan Offboarding & Last Working Day (LWD) - ${name}`;
    }
    case "exit-asset": {
      const name = records.contracts[0]?.employeeName || records.probations[0]?.employeeName || "[Nama]";
      return `[Form 1] Penutupan Akses & Pengembalian Asset - ${name}`;
    }
    case "exit-clearance": {
      const name = records.contracts[0]?.employeeName || records.probations[0]?.employeeName || "[Nama]";
      return `[Form 2] Exit Clearance Form - ${name}`;
    }
    case "exit-interview": {
      const name = records.contracts[0]?.employeeName || records.probations[0]?.employeeName || "[Nama]";
      return `[Form 3] Undangan Exit Interview - ${name}`;
    }
    case "exit-documents-request": {
      const name = records.contracts[0]?.employeeName || records.probations[0]?.employeeName || "[Nama Karyawan]";
      return `Dokumen Offboarding - ${name}`;
    }
    case "exit-follow-up": {
      const name = records.contracts[0]?.employeeName || records.probations[0]?.employeeName || "[Nama Karyawan]";
      return `Follow Up Dokumen Offboarding - ${name}`;
    }
    
    default:
      return "Notification HR - Contract & Probation Control Room";
  }
}

export function getReturnDeadline(lastWorkingDateStr?: string): string {
  if (!lastWorkingDateStr) return "[Return Deadline]";
  try {
    const d = new Date(lastWorkingDateStr);
    d.setDate(d.getDate() - 2);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    return "[Return Deadline]";
  }
}

// 4. Generate Body based on template
export function generateEmailBody(
  type: EmailTemplateType,
  records: { contracts: ContractItem[]; probations: ProbationItem[] },
  source: "contract" | "probation" | "both",
  currentMonthYear: string,
  exitLinks?: { accessAsset: string; exitClearance: string; exitInterview: string },
  formatMode: "automatic" | "detailed" | "compact" | "summary_export" = "automatic",
  simulationDate?: string
): string {
  const effectiveDate = (simulationDate && simulationDate.trim()) ? simulationDate : (new Date().toISOString().split('T')[0]);
  const totalCount = records.contracts.length + records.probations.length;
  
  // Resolve active format mode
  let activeMode = formatMode;
  if (formatMode === "automatic") {
    if (totalCount <= 5) {
      activeMode = "detailed";
    } else if (totalCount <= 20) {
      activeMode = "compact";
    } else {
      activeMode = "summary_export";
    }
  }

  // Summary + Export layout
  if (activeMode === "summary_export") {
    return `Dear Bapak/Ibu,

Mohon bantuannya untuk melakukan review.

Total karyawan:
${totalCount} orang

Detail daftar karyawan tersedia pada file:
email_export_${effectiveDate}.csv

Terima kasih.`;
  }

  // Generate lists based on active mode
  let contractList = "";
  let probationList = "";

  if (activeMode === "detailed") {
    contractList = records.contracts.length > 0 ? formatContractListForEmail(records.contracts) : "";
    probationList = records.probations.length > 0 ? formatProbationListForEmail(records.probations) : "";
  } else {
    contractList = records.contracts.length > 0 ? formatCompactContractList(records.contracts) : "";
    probationList = records.probations.length > 0 ? formatCompactProbationList(records.probations) : "";
  }
  
  // Combine lists cleanly with plain text headers for Contract vs Probation
  let dataList = "";
  if (records.contracts.length > 0 && records.probations.length > 0) {
    dataList = `KARYAWAN KONTRAK\n\n${contractList}\n\nKARYAWAN PROBATION\n\n${probationList}`;
  } else if (records.contracts.length > 0) {
    dataList = `KARYAWAN KONTRAK\n\n${contractList}`;
  } else if (records.probations.length > 0) {
    dataList = `KARYAWAN PROBATION\n\n${probationList}`;
  }

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

    case "exit-notice": {
      const lwd = source === "contract" ? (records.contracts[0]?.lastWorkingDate || "[LWD]") : (records.probations[0]?.lastWorkingDate || "[LWD]");
      const dept = source === "contract" ? (records.contracts[0]?.department || "[Dept]") : (records.probations[0]?.department || "[Dept]");
      const pos = source === "contract" ? (records.contracts[0]?.position || "[Posisi]") : (records.probations[0]?.position || "[Posisi]");
      return `Dear Bapak/Ibu ${managerName} & Rekan ${employeeName},

Dengan email ini kami sampaikan pemberitahuan resmi mengenai akhir masa kerja (offboarding) Rekan ${employeeName} dari departemen ${dept} (${pos}).

Berikut detail informasi LWD (Last Working Day):
* Nama: ${employeeName}
* Departemen: ${dept}
* Jabatan: ${pos}
* Last Working Day (LWD): ${lwd}

Rekan ${employeeName} diharapkan untuk segera menyelesaikan proses serah terima pekerjaan (handover) sebelum tanggal tersebut. HR akan memandu proses pengembalian asset, penutupan akses, exit clearance, serta exit interview dalam email terpisah.

Terima kasih atas segala kontribusi yang diberikan selama masa kerja.

Best regards,
HR Team`;
    }

    case "exit-asset": {
      const lwd = source === "contract" ? (records.contracts[0]?.lastWorkingDate || "[LWD]") : (records.probations[0]?.lastWorkingDate || "[LWD]");
      const accessAsset = (exitLinks?.accessAsset || "").trim() || "[Access & Asset Form Link]";
      return `Dear Rekan ${employeeName},

Menjelang Last Working Day (LWD) Anda pada ${lwd}, mohon bantuan Anda untuk segera melengkapi Form Penutupan Akses dan Pengembalian Asset perusahaan.

Formulir ini bersifat wajib diisi bagi seluruh karyawan offboarding baik yang memiliki inventaris asset tetap ataupun tidak:
* Link Form: ${accessAsset}

Catatan:
* Penutupan Akun/Akses (Email, VPN, Internal Portal, Slack/Teams) akan dieksekusi secara otomatis oleh IT Support pada LWD.
* Seluruh asset milik perusahaan wajib diserahkan kembali ke GA / IT Support paling lambat pada hari kerja terakhir Anda.

Mohon konfirmasi jika formulir sudah dilengkapi agar proses clearance dapat berlanjut ke tahap berikutnya.

Terima kasih atas kerja samanya.

Best regards,
HR Team`;
    }

    case "exit-clearance": {
      const lwd = source === "contract" ? (records.contracts[0]?.lastWorkingDate || "[LWD]") : (records.probations[0]?.lastWorkingDate || "[LWD]");
      const exitClearance = (exitLinks?.exitClearance || "").trim() || "[Exit Clearance Form Link]";
      return `Dear Rekan ${employeeName},

Tahap Penutupan Akses & Pengembalian Asset Anda telah kami terima. Proses offboarding Anda sekarang dilanjutkan ke Form Exit Clearance.

Mohon melengkapi formulir clearance di bawah ini untuk verifikasi penyelesaian tanggung jawab administrasi dengan tim Finance, GA, dan departemen terkait:
* Link Form: ${exitClearance}

Proses verifikasi clearance ini penting untuk memastikan hak-hak akhir Anda (termasuk surat referensi kerja) dapat diproses tepat waktu.

Terima kasih atas perhatian dan kerja samanya.

Best regards,
HR Team`;
    }

    case "exit-interview": {
      const exitInterview = (exitLinks?.exitInterview || "").trim() || "[Exit Interview Form Link]";
      return `Dear Rekan ${employeeName},

Sebagai bagian dari proses offboarding, kami mengundang Anda untuk mengisi kuesioner Exit Interview.

Masukan dan evaluasi Anda selama bekerja di perusahaan sangat bernilai bagi perbaikan internal kami. Kami menjamin kerahasiaan isi tanggapan/interview Anda secara profesional (aplikasi HR hanya memantau status pengisian form dan tidak mencatat isi jawaban curhatan Anda):
* Link Form: ${exitInterview}

Setelah melengkapi form ini, silakan jadwalkan sesi tatap muka singkat (15 menit) dengan tim HR melalui kalender terlampir untuk verifikasi akhir.

Terima kasih atas dedikasi Anda selama ini.

Best regards,
HR Team`;
    }

    case "exit-documents-request": {
      const lwd = source === "contract"
        ? (records.contracts[0]?.lastWorkingDate || "[LWD]")
        : (records.probations[0]?.lastWorkingDate || "[LWD]");
      const returnDeadline = getReturnDeadline(lwd === "[LWD]" ? undefined : lwd);

      const accessAsset = (exitLinks?.accessAsset || "").trim() || "[Access & Asset Form Link]";
      const exitClearance = (exitLinks?.exitClearance || "").trim() || "[Exit Clearance Form Link]";
      const exitInterview = (exitLinks?.exitInterview || "").trim() || "[Exit Interview Form Link]";

      return `Dear ${employeeName},

Terima kasih atas kontribusi dan kerja sama yang telah diberikan selama bekerja di PT Mitra Galang Sejahtera. Kami sangat mengapresiasi dedikasi serta kinerja yang telah diberikan kepada perusahaan.

Sehubungan dengan proses offboarding, berikut tahapan dan dokumen yang perlu dilengkapi:

1. Form Akses & Aset (Penutupan Akses, Sistem & Pengembalian Aset)
   Form ini digunakan untuk proses penutupan seluruh akses sistem serta pengembalian aset perusahaan apabila ada.

Karyawan diminta untuk berkoordinasi langsung dengan masing-masing PIC terkait guna memastikan:
* Penonaktifan akses sistem telah dilakukan
* Pengembalian aset perusahaan telah diterima

Setiap PIC terkait dimohon memberikan tanda tangan pada form tersebut sebagai bukti penyelesaian.

Link/Form:
${accessAsset}

2. Form Exit Clearance
   Setelah Form Akses & Aset selesai dan telah ditandatangani oleh seluruh PIC terkait, selanjutnya Karyawan diminta mengisi Form Exit Clearance.

Form ini memerlukan tanda tangan dari:
* Atasan langsung, sebagai konfirmasi bahwa proses handover pekerjaan telah dilakukan
* Tim GA, sebagai konfirmasi bahwa aset dan kebutuhan operasional telah diselesaikan
* Tim HR, sebagai konfirmasi bahwa administrasi dan keperluan personalia telah diselesaikan, termasuk verifikasi Form Akses

Setelah seluruh tanda tangan diperoleh, Karyawan dapat menandatangani pada bagian akhir Form Exit Clearance.

Link/Form:
${exitClearance}

3. Form Exit Interview
   Tahap terakhir adalah pengisian Form Exit Interview.

Form ini bersifat pribadi dan rahasia, bertujuan untuk mendapatkan masukan serta evaluasi sebagai bahan perbaikan perusahaan ke depannya.

Form ini hanya memerlukan tanda tangan dari Karyawan terkait pada bagian akhir.

Link/Form:
${exitInterview}

Mohon agar seluruh dokumen yang telah lengkap dan ditandatangani dapat dikembalikan maksimal H-2 sebelum tanggal terakhir bekerja, yaitu ${returnDeadline}.

Apabila terdapat pertanyaan terkait proses ini, silakan menghubungi tim HR.

Terima kasih atas perhatian dan kerja samanya.

Regards,

HR Department

Head Office
Menara Caraka Lantai 2
Kawasan Mega Kuningan, Jl. Mega Kuningan Barat Blok E No.4.7, RT.5/RW.2
Kuningan, Kuningan Timur, Kecamatan Setiabudi, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12950`;
    }

    case "exit-follow-up": {
      const lwd = source === "contract"
        ? (records.contracts[0]?.lastWorkingDate || "[LWD]")
        : (records.probations[0]?.lastWorkingDate || "[LWD]");
      const returnDeadline = getReturnDeadline(lwd === "[LWD]" ? undefined : lwd);

      const accessAsset = (exitLinks?.accessAsset || "").trim() || "[Access & Asset Form Link]";
      const exitClearance = (exitLinks?.exitClearance || "").trim() || "[Exit Clearance Form Link]";
      const exitInterview = (exitLinks?.exitInterview || "").trim() || "[Exit Interview Form Link]";

      const accessAssetStatus = source === "contract"
        ? (records.contracts[0]?.accessAssetFormStatus || "Pending")
        : (records.probations[0]?.accessAssetFormStatus || "Pending");
      const exitClearanceStatus = source === "contract"
        ? (records.contracts[0]?.exitClearanceFormStatus || "Pending")
        : (records.probations[0]?.exitClearanceFormStatus || "Pending");
      const exitInterviewStatus = source === "contract"
        ? (records.contracts[0]?.exitInterviewFormStatus || "Sent")
        : (records.probations[0]?.exitInterviewFormStatus || "Sent");

      const pendingList: string[] = [];
      if (accessAssetStatus !== "Completed") pendingList.push("1. Form Akses & Aset (Penutupan Akses & Pengembalian Aset)");
      if (exitClearanceStatus !== "Completed") pendingList.push("2. Form Exit Clearance (Persetujuan Handover, GA & HR)");
      if (exitInterviewStatus !== "Completed" && exitInterviewStatus !== "Declined") pendingList.push("3. Form Exit Interview (Kuesioner Pribadi & Rahasia)");

      const pendingStr = pendingList.length > 0 ? pendingList.join("\n") : "Tidak ada dokumen pending.";

      return `Dear Rekan ${employeeName},

Kami ingin menindaklanjuti proses offboarding Anda di PT Mitra Galang Sejahtera. Berdasarkan data kami, beberapa dokumen offboarding Anda masih dalam status belum lengkap.

Berikut adalah daftar dokumen yang masih membutuhkan penyelesaian Anda:
${pendingStr}

Untuk melengkapinya kembali, silakan gunakan link formulir berikut sesuai kebutuhan:

1. Form Akses & Aset:
Link: ${accessAsset}
Status Saat Ini: ${accessAssetStatus}

2. Form Exit Clearance:
Link: ${exitClearance}
Status Saat Ini: ${exitClearanceStatus}

3. Form Exit Interview:
Link: ${exitInterview}
Status Saat Ini: ${exitInterviewStatus}

Mohon agar seluruh dokumen tersebut dapat dilengkapi dan dikembalikan kepada kami paling lambat pada H-2 sebelum hari kerja terakhir Anda, yaitu ${returnDeadline}.

Jika Anda memiliki pertanyaan atau memerlukan bantuan teknis, silakan hubungi tim HR.

Terima kasih atas kerja samanya.

Regards,
HR Department`;
    }

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
        case "exit-notice":
          updated.exitNotes = `${updated.exitNotes || ""}\n[${sentDateStr}] Exit notice email sent.`.trim();
          break;
        case "exit-asset":
          updated.accessAssetFormSentDate = sentDateStr;
          updated.exitProcessStatus = "Access & Asset Form Pending";
          break;
        case "exit-clearance":
          updated.exitClearanceFormSentDate = sentDateStr;
          updated.exitProcessStatus = "Exit Clearance Pending";
          break;
        case "exit-interview":
          updated.exitInterviewFormSentDate = sentDateStr;
          updated.exitInterviewStatus = "Sent";
          break;
        case "exit-documents-request":
          updated.exitDocumentsSentDate = sentDateStr;
          updated.accessAssetFormSentDate = sentDateStr;
          updated.exitClearanceFormSentDate = sentDateStr;
          updated.exitInterviewFormSentDate = sentDateStr;
          updated.exitProcessStatus = "Exit Documents Sent";
          updated.accessAssetFormStatus = "Pending";
          updated.exitClearanceFormStatus = "Pending";
          updated.exitInterviewFormStatus = "Sent";
          if (updated.lastWorkingDate) {
            updated.exitDocumentsReturnDeadline = getReturnDeadline(updated.lastWorkingDate);
          }
          break;
        case "exit-follow-up":
          updated.exitNotes = `${updated.exitNotes || ""}\n[${sentDateStr}] Exit documents follow-up sent.`.trim();
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
        case "exit-notice":
          updated.exitNotes = `${updated.exitNotes || ""}\n[${sentDateStr}] Exit notice email sent.`.trim();
          break;
        case "exit-asset":
          updated.accessAssetFormSentDate = sentDateStr;
          updated.exitProcessStatus = "Access & Asset Form Pending";
          break;
        case "exit-clearance":
          updated.exitClearanceFormSentDate = sentDateStr;
          updated.exitProcessStatus = "Exit Clearance Pending";
          break;
        case "exit-interview":
          updated.exitInterviewFormSentDate = sentDateStr;
          updated.exitInterviewStatus = "Sent";
          break;
        case "exit-documents-request":
          updated.exitDocumentsSentDate = sentDateStr;
          updated.accessAssetFormSentDate = sentDateStr;
          updated.exitClearanceFormSentDate = sentDateStr;
          updated.exitInterviewFormSentDate = sentDateStr;
          updated.exitProcessStatus = "Exit Documents Sent";
          updated.accessAssetFormStatus = "Pending";
          updated.exitClearanceFormStatus = "Pending";
          updated.exitInterviewFormStatus = "Sent";
          if (updated.lastWorkingDate) {
            updated.exitDocumentsReturnDeadline = getReturnDeadline(updated.lastWorkingDate);
          }
          break;
        case "exit-follow-up":
          updated.exitNotes = `${updated.exitNotes || ""}\n[${sentDateStr}] Exit documents follow-up sent.`.trim();
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
