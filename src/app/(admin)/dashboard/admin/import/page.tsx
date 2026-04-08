"use client";

import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BulkImportForm } from "@/components/features/BulkImportForm";
import { ArrowLeft, ShieldCheck, Zap, ShieldAlert, Sparkles } from "lucide-react";
import Link from "next/link";

export default function BulkImportPage() {
   return (
      <DashboardLayout>
         <div className="max-w-5xl mx-auto space-y-12">
            {/* Compact Header */}
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 text-content-primary">
                <div>
                   <h1 className="text-5xl font-black text-content-primary tracking-tight uppercase">
                      Bulk <span className="text-indigo-600">Import</span>
                   </h1>
                   <p className="text-content-secondary mt-2 font-medium opacity-80">Add multiple interns at once using a CSV file.</p>
                </div>

                <Link href="/dashboard/admin">
                   <button className="btn btn-secondary">
                      <ArrowLeft className="w-4 h-4" />
                      Dashboard
                   </button>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
               {/* Main Action Area */}
               <div className="lg:col-span-12 xl:col-span-8">
                  <BulkImportForm />
               </div>

               {/* Collateral Info Area - Optimized for Space */}
                <div className="lg:col-span-12 xl:col-span-4 space-y-10">
                    <div className="rounded-lg border border-border-subtle p-10 bg-surface-card shadow-sm overflow-hidden relative group hover:shadow-xl transition-all duration-500">
                       <div className="absolute -right-10 -top-10 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
                       <div className="relative z-10 space-y-8">
                          <div className="flex items-center gap-4">
                             <div className="btn btn-primary">
                                <ShieldCheck className="w-6 h-6" />
                             </div>
                             <h3 className="text-[10px] font-black text-content-muted uppercase tracking-[0.4em] mb-3">Import Guidelines</h3>
                          </div>
                          <p className="text-sm font-bold text-content-secondary mb-6">Follow these rules to ensure your data is correctly processed.</p>

                          <div className="space-y-8">
                             <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                   <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                     <span className="w-5 h-px bg-indigo-200" />
                                     Required Fields
                                   </p>
                                   <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[8px] font-black rounded uppercase tracking-tighter">Required</span>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                   {["NAME", "EMAIL", "ROLE", "DEPARTMENT"].map(item => (
                                      <div key={item} className="flex items-center gap-4 p-4 bg-indigo-50/50 rounded-lg border border-indigo-100 hover:bg-indigo-50 hover:border-indigo-200 transition-all cursor-default group/item">
                                         <div className="w-8 h-8 rounded-lg bg-surface-card shadow-sm flex items-center justify-center text-amber-500 group-hover/item:scale-110 transition-transform">
                                            <Zap className="w-4 h-4 animate-pulse" fill="currentColor" />
                                         </div>
                                         <span className="text-[11px] font-black text-content-primary tracking-[0.2em]">{item}</span>
                                      </div>
                                   ))}
                                </div>
                             </div>
 
                             <div className="space-y-4 pt-2">
                                <p className="text-[10px] font-black text-content-muted uppercase tracking-widest flex items-center gap-2">
                                  <span className="w-5 h-px bg-gray-200" />
                                  Optional Fields
                                </p>
                                <div className="grid grid-cols-1 gap-3">
                                   {["PHONE", "MENTOR_EMAIL"].map(item => (
                                      <div key={item} className="flex items-center gap-4 p-4 bg-surface-muted/50 rounded-lg border border-transparent opacity-60 hover:opacity-100 transition-opacity">
                                         <div className="w-2 h-2 rounded-full bg-slate-300" />
                                         <span className="text-[11px] font-black text-content-muted tracking-[0.2em]">{item}</span>
                                      </div>
                                   ))}
                                </div>
                             </div>
                          </div>
                      </div>
                    </div>

                    <div className="btn btn-primary">
                       <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-size-[24px_24px] opacity-5 group-hover:opacity-10 transition-opacity" />
                       <div className="relative z-10 font-black">
                          <div className="w-14 h-14 rounded-lg bg-surface-card/10 flex items-center justify-center mb-8 border border-white/20 group-hover:rotate-12 transition-transform shadow-2xl">
                             <Sparkles className="w-7 h-7 text-indigo-400" />
                          </div>
                          <h4 className="text-3xl font-black tracking-tight mb-6 uppercase leading-tight underline decoration-indigo-500 decoration-4 underline-offset-8">Data <br />Validation</h4>
                          <p className="text-[10px] font-medium opacity-60 leading-relaxed mb-10">
                             All imported records are checked for errors. Email addresses must be unique.
                          </p>
                          <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] bg-surface-card/5 px-6 py-3 rounded-lg text-indigo-300 border border-white/10 shadow-inner">
                             <ShieldAlert className="w-4 h-4 animate-pulse text-rose-400" />
                             Import History Enabled
                          </div>
                       </div>
                    </div>
                </div>
               </div>
         </div>
      </DashboardLayout>
   );
}
