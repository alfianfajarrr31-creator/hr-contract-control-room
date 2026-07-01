import React from "react";
import { 
  ContractItem, 
  ProbationItem, 
  ContractStatus, 
  ProbationStatus,
  SalaryNegotiationStatus 
} from "../types";
import { 
  AlertTriangle, 
  AlertCircle, 
  Clock, 
  UserCheck, 
  FileText, 
  DollarSign, 
  CheckCircle, 
  Send, 
  TrendingUp, 
  ArrowRight,
  ShieldAlert,
  Users
} from "lucide-react";

interface DashboardViewProps {
  contracts: ContractItem[];
  probations: ProbationItem[];
  onNavigateToContracts: () => void;
  onNavigateToProbation: () => void;
  onEditContract: (contract: ContractItem) => void;
  onEditProbation: (probation: ProbationItem) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  contracts,
  probations,
  onNavigateToContracts,
  onNavigateToProbation,
  onEditContract,
  onEditProbation
}) => {
  // Count helpers
  const activeContracts = contracts.filter(c => 
    c.contractStatus !== ContractStatus.Completed &&
    c.contractStatus !== ContractStatus.NotRenewed &&
    c.contractStatus !== ContractStatus.ConvertedToPermanent
  );

  const due60 = activeContracts.filter(c => c.daysRemaining >= 0 && c.daysRemaining <= 60).length;
  const due30 = activeContracts.filter(c => c.daysRemaining >= 0 && c.daysRemaining <= 30).length;
  const due14 = activeContracts.filter(c => c.daysRemaining >= 0 && c.daysRemaining <= 14).length;

  const waitingUserReview = contracts.filter(c => c.contractStatus === ContractStatus.WaitingUserReview).length;
  const waitingDirectorApproval = contracts.filter(c => c.contractStatus === ContractStatus.WaitingDirectorApproval).length;
  const waitingHeadHRReview = contracts.filter(c => c.contractStatus === ContractStatus.WaitingHeadHRReview).length;
  
  const contractSent = contracts.filter(c => c.contractStatus === ContractStatus.ContractSent).length;
  const waitingSignedContract = contracts.filter(c => c.contractStatus === ContractStatus.WaitingSignedContract).length;

  const compensationReviews = contracts.filter(c => 
    c.compensationReviewNeeded || 
    c.salaryNegotiationStatus !== SalaryNegotiationStatus.NoNegotiation
  ).length;

  // Probation Due (H-30 until end)
  const activeProbations = probations.filter(p => !p.finalDecision);
  const probationDue = activeProbations.filter(p => p.daysRemaining >= 0 && p.daysRemaining <= 30).length;

  // Critical & Overdue across both trackers
  const criticalContracts = contracts.filter(c => c.priority === "Critical");
  const criticalProbations = probations.filter(p => p.priority === "Critical");
  const totalCritical = criticalContracts.length + criticalProbations.length;

  const overdueContracts = contracts.filter(c => c.priority === "Overdue");
  const overdueProbations = probations.filter(p => p.priority === "Overdue");
  const totalOverdue = overdueContracts.length + overdueProbations.length;

  // Consolidated Urgent Items
  const urgentContracts = contracts
    .filter(c => c.priority === "Critical" || c.priority === "Overdue")
    .map(c => ({
      id: c.id,
      name: c.employeeName,
      department: c.department,
      type: "Contract",
      detail: c.contractType,
      daysRemaining: c.daysRemaining,
      status: c.contractStatus,
      priority: c.priority,
      pic: c.hrPic,
      original: c
    }));

  const urgentProbations = probations
    .filter(p => p.priority === "Critical" || p.priority === "Overdue")
    .map(p => ({
      id: p.id,
      name: p.employeeName,
      department: p.department,
      type: "Probation",
      detail: p.position,
      daysRemaining: p.daysRemaining,
      status: p.probationStatus,
      priority: p.priority,
      pic: p.hrPic,
      original: p
    }));

  const consolidatedUrgent = [...urgentContracts, ...urgentProbations].sort((a, b) => {
    // Overdue first, then lower daysRemaining
    if (a.priority === "Overdue" && b.priority !== "Overdue") return -1;
    if (b.priority === "Overdue" && a.priority !== "Overdue") return 1;
    return a.daysRemaining - b.daysRemaining;
  });

  return (
    <div className="space-y-8 animate-fade-in" id="dashboard-container">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">HR Command Dashboard</h1>
          <p className="text-slate-500 mt-1">Real-time overview of employee contracts, probation deadlines, and SLA progression.</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-3">
          <button 
            id="nav-to-contracts-btn"
            onClick={onNavigateToContracts}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-sm font-medium transition shadow-sm"
          >
            <FileText className="h-4 w-4 text-indigo-600" />
            Manage Contracts
          </button>
          <button 
            id="nav-to-probation-btn"
            onClick={onNavigateToProbation}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-sm font-medium transition shadow-sm"
          >
            <UserCheck className="h-4 w-4 text-emerald-600" />
            Manage Probation
          </button>
        </div>
      </div>

      {/* Alert Banner for Overdue / Critical */}
      {(totalCritical > 0 || totalOverdue > 0) && (
        <div id="urgent-alert-banner" className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg flex items-start gap-3 shadow-xs">
          <ShieldAlert className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-900 font-display">Urgent Attention Required</h3>
            <div className="text-xs text-red-700 mt-1 space-y-1">
              {totalOverdue > 0 && <p>There are <strong className="font-bold">{totalOverdue} overdue items</strong> that have passed their deadline without a final status update.</p>}
              {totalCritical > 0 && <p>There are <strong className="font-bold">{totalCritical} items in Critical SLA state</strong> (less than 4 days for contracts or 7 days for probation).</p>}
            </div>
          </div>
        </div>
      )}

      {/* Section 1: High Alert & Timeline Bento Grid */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 font-mono">1. Timeline Alert & Critical Milestones</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-slate-50 text-slate-700 rounded-lg">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Contracts</p>
              <h3 className="text-2xl font-bold font-mono text-slate-900 mt-1">{activeContracts.length}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Total monitored</p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex items-center gap-4 border-l-4 border-l-amber-400">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Due in 60 Days</p>
              <h3 className="text-2xl font-bold font-mono text-amber-700 mt-1">{due60}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Alert triggered</p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex items-center gap-4 border-l-4 border-l-orange-500">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Due in 30 / 14 Days</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-orange-700">{due30}</span>
                <span className="text-slate-300 text-sm">/</span>
                <span className="text-lg font-bold font-mono text-red-600">{due14}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">H-30 vs H-14 remaining</p>
            </div>
          </div>

          <div className="bg-red-500 text-white rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-red-600/50 rounded-lg">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-red-100 uppercase tracking-wider">Critical & Overdue</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-white">{totalCritical}</span>
                <span className="text-red-300 text-sm">/</span>
                <span className="text-2xl font-bold font-mono text-red-100 underline decoration-2">{totalOverdue}</span>
              </div>
              <p className="text-xs text-red-200 mt-0.5">Action required ASAP</p>
            </div>
          </div>

        </div>
      </div>

      {/* Section 2: Workflows & Approvals Bento Grid */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 font-mono">2. Workflow Progress & Approvals</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Waiting User Review</p>
              <h3 className="text-2xl font-bold font-mono text-indigo-700 mt-1">{waitingUserReview}</h3>
              <p className="text-xs text-slate-400 mt-0.5">With Line Managers</p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Director Approval</p>
              <h3 className="text-2xl font-bold font-mono text-purple-700 mt-1">{waitingDirectorApproval}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Pending sign-off</p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-sky-50 text-sky-600 rounded-lg">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Head HR Review</p>
              <h3 className="text-2xl font-bold font-mono text-sky-700 mt-1">{waitingHeadHRReview}</h3>
              <p className="text-xs text-slate-400 mt-0.5">In final draft check</p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Compensation Review</p>
              <h3 className="text-2xl font-bold font-mono text-teal-700 mt-1">{compensationReviews}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Active reviews & nego</p>
            </div>
          </div>

        </div>
      </div>

      {/* Section 3 & 4: Outbound, Signatures & Probation */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 font-mono">3. Document Operations & Probation status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Send className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Contract Sent</p>
              <h3 className="text-2xl font-bold font-mono text-blue-700 mt-1">{contractSent}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Delivered to candidates</p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Waiting Signed Contract</p>
              <h3 className="text-2xl font-bold font-mono text-amber-700 mt-1">{waitingSignedContract}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Awaiting return copies</p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex items-center gap-4 border-l-4 border-l-emerald-500">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Probation Due (H-30)</p>
              <h3 className="text-2xl font-bold font-mono text-emerald-700 mt-1">{probationDue}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Evaluation active</p>
            </div>
          </div>

        </div>
      </div>

      {/* Urgent Items Table Console */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden">
        <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900 font-display flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              SLA Priority Console: Urgent Actions Required
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Consolidated lists of contract and probation items that have reached Critical or Overdue thresholds.</p>
          </div>
          <span className="inline-flex self-start sm:self-auto items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            {consolidatedUrgent.length} Items Total
          </span>
        </div>

        {consolidatedUrgent.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-medium text-slate-600">Perfect Control Room State</p>
            <p className="text-xs mt-0.5 text-slate-400">No overdue or critical items in the queue. All SLAs are fully compliant.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="urgent-items-table">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs font-medium font-mono uppercase bg-slate-50/20">
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Employee Name</th>
                  <th className="px-6 py-3">Dept / Detail</th>
                  <th className="px-6 py-3 text-right">Days Remaining</th>
                  <th className="px-6 py-3">Current Status</th>
                  <th className="px-6 py-3">SLA Priority</th>
                  <th className="px-6 py-3">HR PIC</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {consolidatedUrgent.map((item) => (
                  <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50/40 transition">
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase font-mono ${
                        item.type === "Contract" 
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-100" 
                          : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-900">{item.name}</td>
                    <td className="px-6 py-3.5">
                      <div className="text-slate-700 font-medium">{item.department}</div>
                      <div className="text-slate-400 text-xs">{item.detail}</div>
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono font-semibold">
                      {item.daysRemaining < 0 ? (
                        <span className="text-rose-600">
                          {Math.abs(item.daysRemaining)} Days ago
                        </span>
                      ) : (
                        <span className={item.daysRemaining <= 3 ? "text-amber-600" : "text-slate-700"}>
                          {item.daysRemaining} Days left
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.priority === "Overdue"
                          ? "bg-rose-50 text-rose-700 border border-rose-100"
                          : "bg-amber-50 text-amber-700 border border-amber-100"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase font-mono ${
                        item.priority === "Overdue"
                          ? "bg-rose-600 text-white animate-pulse"
                          : "bg-amber-500 text-white"
                      }`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 font-medium">{item.pic}</td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => {
                          if (item.type === "Contract") {
                            onEditContract(item.original as ContractItem);
                          } else {
                            onEditProbation(item.original as ProbationItem);
                          }
                        }}
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-900 font-semibold cursor-pointer"
                      >
                        Resolve
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
