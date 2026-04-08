"use client";

import React, { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Download, XCircle, Info } from "lucide-react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

interface PreviewRow {
  name: string;
  email: string;
  role: string;
  department: string;
  phone: string;
  mentor_email: string;
}

export function BulkImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
        setError("Please upload a valid CSV file.");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResult(null);

      const text = await selectedFile.text();
      const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
      const header = lines[0].split(",").map(h => h.trim().toLowerCase());
      const dataRows = lines.slice(1, 6);

      const previewRows: PreviewRow[] = dataRows.map(row => {
        const values = row.split(",").map(v => v.trim());
        const obj: Record<string, string> = {};
        header.forEach((h, i) => {
          obj[h] = values[i];
        });
        return obj as unknown as PreviewRow;
      });

      setPreviewData(previewRows);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data.results);
        setFile(null);
        setPreviewData([]);
      } else {
        setError(data.error || "Failed to upload file.");
      }
    } catch {
      setError("An error occurred during upload.");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "Name,Email,Role,Department,Phone,Mentor_Email\nJohn Doe,john@example.com,intern,AI,1234567890,mentor@example.com\nJane Smith,jane@example.com,mentor,JAVA,0987654321,";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "intern_import_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Card className="p-8 max-w-2xl mx-auto relative overflow-hidden">
      <div className="flex flex-col gap-6 relative z-10">
        <div className="flex justify-between items-center bg-primary-subtle p-6 rounded-lg border border-primary-border">
          <div>
            <h2 className="text-2xl font-bold text-content-primary">CSV Import</h2>
            <p className="text-xs text-content-muted mt-1">Bulk import interns and mentors</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="alert alert-warning p-3">
               <Info className="w-4 h-4 shrink-0" />
               <span className="text-xs">Validation enabled</span>
            </div>
            <button
              onClick={downloadTemplate}
              className="btn btn-secondary btn-sm flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Template
            </button>
          </div>
        </div>

        {!result && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${file ? "border-primary bg-primary-subtle" : "border-border-default hover:border-primary bg-surface-muted"}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".csv"
            />
            <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${file ? 'bg-primary text-inverse' : 'bg-surface-card text-content-muted border border-border-default'}`}>
              {file ? <FileText className="w-7 h-7" /> : <Upload className="w-7 h-7" />}
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-content-primary">{file ? file.name : "Select CSV File"}</p>
              <p className="text-xs text-content-muted mt-1">CSV format • Max 10MB</p>
            </div>
          </div>
        )}

        {file && previewData.length > 0 && !result && (
          <div className="animate-fade-in bg-surface-muted rounded-lg p-6 border border-border-default">
            <div className="flex items-center gap-2 mb-4">
               <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
               <span className="text-xs font-medium text-content-muted">Data Preview (First 5 rows)</span>
            </div>
            <div className="table-container">
              <div className="table-scroll">
                <table className="table text-xs">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Department</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, i) => (
                      <tr key={i}>
                        <td className="text-content-primary">{row.name}</td>
                        <td className="text-primary-text">{row.email}</td>
                        <td>
                          <span className={row.role === 'intern' ? 'badge badge-success' : 'badge badge-warning'}>
                            {row.role}
                          </span>
                        </td>
                        <td className="text-content-muted">{row.department || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <XCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Import Error</p>
              <p className="text-xs opacity-80">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-6 animate-fade-in">
            <div className={`p-8 rounded-lg flex flex-col items-center justify-center text-center ${result.failed === 0 ? 'bg-success-subtle border border-success-subtle' : 'bg-warning-subtle border border-warning-subtle'}`}>
              <div className={`w-14 h-14 rounded-lg flex items-center justify-center mb-4 ${result.failed === 0 ? 'bg-success text-inverse' : 'bg-warning text-inverse'}`}>
                {result.failed === 0 ? <CheckCircle2 className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}
              </div>
              <h3 className="text-lg font-bold text-content-primary">{result.failed === 0 ? 'Import Complete' : 'Some rows failed'}</h3>
              <div className="flex gap-4 mt-2 text-sm text-content-secondary">
                <span>Imported: {result.success}</span>
                <span className={result.failed > 0 ? 'text-error-text' : ''}>Failed: {result.failed}</span>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-error-subtle text-error-text flex items-center justify-center">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-content-primary">Issues Found</span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {result.errors.map((err, i) => (
                    <div key={i} className="p-3 bg-error-subtle border border-error-subtle rounded-lg text-xs text-error-text flex items-start gap-2">
                      <XCircle className="w-4 h-4 shrink-0 mt-0.5 opacity-50" />
                      {err}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={() => { setResult(null); setFile(null); }} className="w-full">Start Over</Button>
          </div>
        )}

        {!result && (
          <Button
            onClick={handleUpload}
            disabled={!file || loading}
            size="lg"
            className="w-full flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Start Import
              </>
            )}
          </Button>
        )}
      </div>
    </Card>
  );
}
