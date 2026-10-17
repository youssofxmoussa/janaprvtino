import { Check, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PdfFileList({ files, selectedIndex, onSelect }: {
  files: { id: string; title: string }[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  if (files.length < 2) return null;
  return (
    <div aria-label="Lesson PDF files" className="mb-4 grid w-full min-w-0 grid-cols-1 gap-2">
      {files.map((file, index) => (
        <Button key={file.id} variant="ghost" aria-pressed={index === selectedIndex} onClick={() => onSelect(index)} className={cn("grid h-auto min-h-14 w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border px-3 py-3 text-left whitespace-normal", index === selectedIndex ? "border-primary/25 bg-primary/10 text-primary hover:bg-primary/15" : "border-border/60 bg-surface-solid text-foreground hover:bg-secondary/60")}>
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary"><FileText className="size-4" /></span>
          <span className="min-w-0 text-[0.8125rem] font-semibold leading-relaxed [overflow-wrap:anywhere]">{file.title}</span>
          <span className="grid size-5 shrink-0 place-items-center">{index === selectedIndex && <Check className="size-4" />}</span>
        </Button>
      ))}
    </div>
  );
}