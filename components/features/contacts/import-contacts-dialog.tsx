"use client";

import * as React from "react";
import {
  Upload,
  FileSpreadsheet,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface ImportContactsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ImportStep = "upload" | "mapping" | "preview" | "importing" | "complete";

interface CSVRow {
  [key: string]: string;
}

interface ColumnMapping {
  csvColumn: string;
  crmField: string;
}

// CRM fields that can be mapped
const crmFields = [
  { value: "first_name", label: "First Name", required: true },
  { value: "last_name", label: "Last Name", required: true },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "company_name", label: "Company" },
  { value: "job_title", label: "Job Title" },
  { value: "address_line1", label: "Address" },
  { value: "city", label: "City" },
  { value: "state", label: "State" },
  { value: "zip_code", label: "ZIP Code" },
  { value: "country", label: "Country" },
  { value: "type", label: "Contact Type" },
  { value: "source", label: "Lead Source" },
  { value: "tags", label: "Tags" },
];

export function ImportContactsDialog({
  open,
  onOpenChange,
}: ImportContactsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = React.useState<ImportStep>("upload");
  const [file, setFile] = React.useState<File | null>(null);
  const [csvData, setCsvData] = React.useState<CSVRow[]>([]);
  const [csvHeaders, setCsvHeaders] = React.useState<string[]>([]);
  const [mappings, setMappings] = React.useState<ColumnMapping[]>([]);
  const [skipDuplicates, setSkipDuplicates] = React.useState(true);
  const [importProgress, setImportProgress] = React.useState(0);
  const [importResults, setImportResults] = React.useState<{
    success: number;
    failed: number;
    duplicates: number;
    errors: string[];
  } | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStep("upload");
    setFile(null);
    setCsvData([]);
    setCsvHeaders([]);
    setMappings([]);
    setImportProgress(0);
    setImportResults(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  };

  const parseCSV = (text: string): { headers: string[]; rows: CSVRow[] } => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length === 0) return { headers: [], rows: [] };

    // Parse headers
    const headers = parseCSVLine(lines[0]);

    // Parse rows
    const rows: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === headers.length) {
        const row: CSVRow = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        rows.push(row);
      }
    }

    return { headers, rows };
  };

  const parseCSVLine = (line: string): string[] => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    return values;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file.",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);

    const text = await selectedFile.text();
    const { headers, rows } = parseCSV(text);

    if (headers.length === 0 || rows.length === 0) {
      toast({
        title: "Invalid CSV",
        description: "The file appears to be empty or invalid.",
        variant: "destructive",
      });
      return;
    }

    setCsvHeaders(headers);
    setCsvData(rows);

    // Auto-map columns based on header names
    const autoMappings: ColumnMapping[] = [];
    headers.forEach((header) => {
      const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, "");
      const match = crmFields.find((field) => {
        const normalizedField = field.value.replace(/_/g, "");
        return (
          normalizedHeader.includes(normalizedField) ||
          normalizedField.includes(normalizedHeader) ||
          normalizedHeader.includes(field.label.toLowerCase().replace(/[^a-z0-9]/g, ""))
        );
      });
      if (match) {
        autoMappings.push({ csvColumn: header, crmField: match.value });
      }
    });
    setMappings(autoMappings);

    setStep("mapping");
  };

  const handleMappingChange = (csvColumn: string, crmField: string) => {
    setMappings((prev) => {
      const existing = prev.find((m) => m.csvColumn === csvColumn);
      if (existing) {
        if (crmField === "skip") {
          return prev.filter((m) => m.csvColumn !== csvColumn);
        }
        return prev.map((m) =>
          m.csvColumn === csvColumn ? { ...m, crmField } : m
        );
      }
      if (crmField !== "skip") {
        return [...prev, { csvColumn, crmField }];
      }
      return prev;
    });
  };

  const getMappedField = (csvColumn: string): string => {
    return mappings.find((m) => m.csvColumn === csvColumn)?.crmField || "skip";
  };

  const handleImport = async () => {
    setStep("importing");
    setImportProgress(0);

    // Transform data based on mappings
    const contacts = csvData.map((row) => {
      const contact: Record<string, string> = {};
      mappings.forEach((mapping) => {
        contact[mapping.crmField] = row[mapping.csvColumn];
      });
      return contact;
    });

    try {
      const response = await fetch("/api/v1/contacts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contacts,
          skipDuplicates,
        }),
      });

      if (!response.ok) {
        throw new Error("Import failed");
      }

      const result = await response.json();
      setImportResults(result);
      setStep("complete");

      // Invalidate contacts cache
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    } catch (error) {
      toast({
        title: "Import failed",
        description: "An error occurred while importing contacts.",
        variant: "destructive",
      });
      setStep("preview");
    }
  };

  // Check if required fields are mapped
  const requiredFieldsMapped = crmFields
    .filter((f) => f.required)
    .every((f) => mappings.some((m) => m.crmField === f.value));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Contacts</DialogTitle>
          <DialogDescription>
            {step === "upload" && "Upload a CSV file to import contacts."}
            {step === "mapping" && "Map CSV columns to contact fields."}
            {step === "preview" && "Review the data before importing."}
            {step === "importing" && "Importing contacts..."}
            {step === "complete" && "Import complete!"}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          {["upload", "mapping", "preview", "complete"].map((s, i) => (
            <React.Fragment key={s}>
              {i > 0 && <div className="h-px w-8 bg-border" />}
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium",
                  step === s || ["mapping", "preview", "complete"].indexOf(step) >= i
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {i + 1}
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Upload step */}
        {step === "upload" && (
          <div className="space-y-4">
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors",
                file && "border-primary bg-primary/5"
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileSelect}
              />
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Click to select a different file
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="font-medium">Click to upload CSV file</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or drag and drop
                  </p>
                </>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">CSV file requirements:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>First row should contain column headers</li>
                <li>Required columns: First Name, Last Name</li>
                <li>Maximum 1,000 contacts per import</li>
              </ul>
            </div>
          </div>
        )}

        {/* Mapping step */}
        {step === "mapping" && (
          <div className="space-y-4">
            <div className="max-h-[300px] overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CSV Column</TableHead>
                    <TableHead>Sample Data</TableHead>
                    <TableHead>Map to Field</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvHeaders.map((header) => (
                    <TableRow key={header}>
                      <TableCell className="font-medium">{header}</TableCell>
                      <TableCell className="text-muted-foreground truncate max-w-[150px]">
                        {csvData[0]?.[header] || "-"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={getMappedField(header)}
                          onValueChange={(value) =>
                            handleMappingChange(header, value)
                          }
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="skip">
                              <span className="text-muted-foreground">
                                Skip this column
                              </span>
                            </SelectItem>
                            {crmFields.map((field) => (
                              <SelectItem key={field.value} value={field.value}>
                                {field.label}
                                {field.required && (
                                  <span className="text-destructive"> *</span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {!requiredFieldsMapped && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                Please map First Name and Last Name columns
              </div>
            )}
          </div>
        )}

        {/* Preview step */}
        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Badge variant="secondary">{csvData.length} contacts</Badge>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="skipDuplicates"
                  checked={skipDuplicates}
                  onCheckedChange={(checked) =>
                    setSkipDuplicates(checked as boolean)
                  }
                />
                <Label htmlFor="skipDuplicates" className="text-sm">
                  Skip duplicate emails
                </Label>
              </div>
            </div>

            <div className="max-h-[250px] overflow-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    {mappings.slice(0, 4).map((m) => (
                      <TableHead key={m.crmField}>
                        {crmFields.find((f) => f.value === m.crmField)?.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvData.slice(0, 5).map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      {mappings.slice(0, 4).map((m) => (
                        <TableCell
                          key={m.crmField}
                          className="truncate max-w-[120px]"
                        >
                          {row[m.csvColumn] || "-"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {csvData.length > 5 && (
              <p className="text-sm text-muted-foreground text-center">
                Showing first 5 of {csvData.length} contacts
              </p>
            )}
          </div>
        )}

        {/* Importing step */}
        {step === "importing" && (
          <div className="space-y-4 py-8">
            <div className="flex justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <Progress value={importProgress} className="w-full" />
            <p className="text-center text-sm text-muted-foreground">
              Importing contacts... Please don&apos;t close this window.
            </p>
          </div>
        )}

        {/* Complete step */}
        {step === "complete" && importResults && (
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold">Import Complete!</h3>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {importResults.success}
                  </p>
                  <p className="text-sm text-green-600">Imported</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg">
                  <p className="text-2xl font-bold text-amber-600">
                    {importResults.duplicates}
                  </p>
                  <p className="text-sm text-amber-600">Duplicates</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">
                    {importResults.failed}
                  </p>
                  <p className="text-sm text-red-600">Failed</p>
                </div>
              </div>
              {importResults.errors.length > 0 && (
                <div className="mt-4 text-left">
                  <p className="text-sm font-medium text-destructive">Errors:</p>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    {importResults.errors.slice(0, 5).map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "upload" && (
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
          )}

          {step === "mapping" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={() => setStep("preview")}
                disabled={!requiredFieldsMapped}
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}

          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("mapping")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleImport}>
                Import {csvData.length} Contacts
              </Button>
            </>
          )}

          {step === "complete" && (
            <Button onClick={() => handleOpenChange(false)}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
