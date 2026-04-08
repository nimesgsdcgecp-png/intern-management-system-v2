"use client";

import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BulkImportForm } from "@/components/features/BulkImportForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function BulkImportPage() {
   return (
      <DashboardLayout>
         <div className="max-w-4xl mx-auto space-y-8">
            {/* Standard Header */}
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                   <h1 className="text-2xl font-bold text-content-primary">
                      Bulk Import Interns
                   </h1>
                   <p className="text-sm text-content-secondary mt-1">Upload a CSV file to add multiple interns to the system at once.</p>
                </div>

                <Link href="/dashboard/admin/interns">
                   <button className="btn btn-secondary">
                      <ArrowLeft className="w-4 h-4" />
                      Back to Interns
                   </button>
                </Link>
            </div>

            <div className="card shadow-sm border border-border-default">
               <div className="p-8">
                  <BulkImportForm />
               </div>
            </div>

            <div className="card p-6 bg-surface-muted/30 border-dashed">
               <h3 className="text-sm font-semibold text-content-primary mb-3">Import CSV Format</h3>
               <p className="text-xs text-content-secondary mb-4">
                  Ensure your CSV file contains the following headers for successful processing:
               </p>
               <div className="flex flex-wrap gap-2">
                  {["Name", "Email", "Role", "Department", "Phone", "Mentor Email"].map(header => (
                     <span key={header} className="badge badge-neutral px-3 py-1">
                        {header}
                     </span>
                  ))}
               </div>
               <p className="text-[10px] text-content-muted mt-4 italic">
                  * Name, Email, Role, and Department are required fields.
               </p>
            </div>
         </div>
      </DashboardLayout>
   );
}
