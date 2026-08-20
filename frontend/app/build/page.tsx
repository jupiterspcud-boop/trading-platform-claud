import DragDropBuilder from '@/components/StrategyBuilder/DragDropBuilder';
import AINaturalLanguage from '@/components/StrategyBuilder/AINaturalLanguage';

export default function BuildPage() {
  return (
    <div className="px-4 pt-4 space-y-4">
      <h1 className="text-lg font-bold">Build a Strategy</h1>
      <AINaturalLanguage />
      <DragDropBuilder />
    </div>
  );
}
