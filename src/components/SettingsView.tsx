import React from "react";
import { 
  ContractStatus, 
  ProbationStatus, 
  UserRecommendation, 
  ApprovalStatus, 
  SalaryNegotiationStatus 
} from "../types";
import { 
  Sliders, 
  CheckCircle, 
  Info, 
  Settings, 
  Calendar, 
  Users, 
  TrendingUp, 
  ShieldAlert 
} from "lucide-react";

export const SettingsView: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in" id="settings-view-container">
      {/* Header */}
      <div className="border-b border-slate-100 pb-5">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Master Data & Policy Control</h1>
        <p className="text-slate-500 mt-1">Configure and reference corporate dropdowns, approval definitions, and SLA reminder matrices.</p>
      </div>

      {/* Grid of Drodown definitions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Contract Status Values */}
        <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-xs">
          <h3 className="font-semibold text-slate-900 font-display flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
            <Sliders className="h-4 w-4 text-indigo-600" />
            Contract Status Domain Definitions
          </h3>
          <p className="text-xs text-slate-500 mb-4">Standard lifecycle stages utilized within the Contract Control Tracker.</p>
          <div className="flex flex-wrap gap-2">
            {Object.values(ContractStatus).map(val => (
              <span key={val} className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-100 font-mono">
                {val}
              </span>
            ))}
          </div>
        </div>

        {/* Probation Status Values */}
        <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-xs">
          <h3 className="font-semibold text-slate-900 font-display flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
            <Users className="h-4 w-4 text-emerald-600" />
            Probation Status Domain Definitions
          </h3>
          <p className="text-xs text-slate-500 mb-4">Standard tracking phases for 3-month trial employees undergoing appraisal.</p>
          <div className="flex flex-wrap gap-2">
            {Object.values(ProbationStatus).map(val => (
              <span key={val} className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100 font-mono">
                {val}
              </span>
            ))}
          </div>
        </div>

        {/* User Recommendations & Approvals */}
        <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-xs space-y-5">
          <div>
            <h3 className="font-semibold text-slate-900 font-display flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
              <CheckCircle className="h-4 w-4 text-slate-700" />
              Manager Recommendation Choices
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.values(UserRecommendation).filter(r => r !== "None").map(val => (
                <span key={val} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                  {val}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 font-display flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
              <CheckCircle className="h-4 w-4 text-purple-600" />
              Workflow Sign-off Statuses
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.values(ApprovalStatus).filter(a => a !== "None").map(val => (
                <span key={val} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-800 border border-purple-100 font-mono">
                  {val}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Compensation Review Dropdowns */}
        <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-xs">
          <h3 className="font-semibold text-slate-900 font-display flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
            <TrendingUp className="h-4 w-4 text-teal-600" />
            Compensation Review Matrix
          </h3>
          <p className="text-xs text-slate-500 mb-4">Standard compensation review and negotiation status triggers.</p>
          <div className="flex flex-wrap gap-2">
            {Object.values(SalaryNegotiationStatus).map(val => (
              <span key={val} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-teal-50 text-teal-800 border border-teal-100 font-mono">
                {val}
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* SLA Matrix rules list */}
      <div className="bg-slate-900 text-slate-100 rounded-xl p-6 shadow-md border border-slate-800">
        <h3 className="text-lg font-bold font-display flex items-center gap-2 border-b border-slate-800 pb-4 mb-4">
          <Calendar className="h-5 w-5 text-indigo-400" />
          SLA & Auto-Priority Calculation Rules (Standard Policy)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
          {/* Contracts SLA policy */}
          <div className="space-y-4">
            <h4 className="font-bold text-indigo-300 font-display flex items-center gap-2 uppercase tracking-wide text-xs">
              <span className="h-2 w-2 rounded-full bg-indigo-400"></span>
              Contract SLA Intervals (H-Days to Expiration)
            </h4>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">&gt; 60 Days:</span>
                <span className="text-slate-200 font-bold">Priority Low (Active)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">H-60 to H-46:</span>
                <span className="text-amber-400 font-bold">Priority Medium (Suggested: Need Review)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">H-45 to H-31:</span>
                <span className="text-amber-400 font-bold">Priority Medium (Suggested: Waiting User Review)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">H-30 to H-22:</span>
                <span className="text-orange-400 font-bold">Priority High (Suggested: Waiting Director Approval)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">H-21 to H-15:</span>
                <span className="text-orange-400 font-bold">Priority High (Suggested: Contract Drafting)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">H-14 to H-11:</span>
                <span className="text-orange-400 font-bold">Priority High (Suggested: Waiting Head HR Review)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">H-10 to H-8:</span>
                <span className="text-orange-400 font-bold">Priority High (Suggested: Contract Sent)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">H-7 to H-4:</span>
                <span className="text-orange-400 font-bold">Priority High (Suggested: Waiting Signed Contract)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">H-3 to H-0:</span>
                <span className="text-rose-500 font-extrabold animate-pulse">Priority Critical</span>
              </div>
              <div className="flex justify-between">
                <span className="text-rose-400">Passed End Date (Without final state):</span>
                <span className="text-rose-600 font-extrabold underline decoration-2">Priority Overdue</span>
              </div>
            </div>
          </div>

          {/* Probations SLA policy */}
          <div className="space-y-4">
            <h4 className="font-bold text-emerald-300 font-display flex items-center gap-2 uppercase tracking-wide text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              Probation SLA Intervals (H-Days to Evaluation)
            </h4>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">&gt; 45 Days:</span>
                <span className="text-slate-200 font-bold">Priority Low (Active Probation)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">H-45 to H-31:</span>
                <span className="text-amber-400 font-bold">Priority Medium (Suggested: Need Review)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">H-30 to H-21:</span>
                <span className="text-amber-400 font-bold">Priority Medium (Suggested: Waiting Review Form)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">H-20 to H-14:</span>
                <span className="text-orange-400 font-bold">Priority High (Suggested: Waiting User Recommendation)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">H-13 to H-7:</span>
                <span className="text-orange-400 font-bold">Priority High (Suggested: Waiting Director Approval)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">H-6 to H-0:</span>
                <span className="text-rose-500 font-extrabold animate-pulse">Priority Critical</span>
              </div>
              <div className="flex justify-between">
                <span className="text-rose-400">Passed End Date (Without final decision):</span>
                <span className="text-rose-600 font-extrabold underline decoration-2">Priority Overdue</span>
              </div>
            </div>
            
            <div className="bg-slate-850 p-4 border border-slate-800 rounded-lg space-y-2 mt-4">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Info className="h-3 w-3 text-indigo-400" />
                Auto-Calculation Note
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                These rules are applied dynamically based on the set Simulation Date. If an employee has achieved a final state (e.g. status Completed/Not Renewed/Converted to Permanent for contracts, or has a finalized decision for probation), their priority is safely marked as <strong className="text-emerald-400">Low</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
