// Build module — 3 strategy creation modes:
// 1. Drag & drop (DragDropBuilder)
// 2. AI natural language (AINaturalLanguage)
// 3. Full Python code (advanced users) — not stubbed here, would be a
//    code editor component (e.g. Monaco) + backend sandboxed executor.

import DragDropBuilder from '@/components/StrategyBuilder/DragDropBuilder';
import AINaturalLanguage from '@/components/StrategyBuilder/AINaturalLanguage';

export default function BuildPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Build a Strategy</h1>
      <AINaturalLanguage />
      <DragDropBuilder />
    </div>
  );
}
