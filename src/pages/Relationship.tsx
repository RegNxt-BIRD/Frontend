import DatabaseDiagram from "@/components/DatabaseDiagram";
import { ReactFlowProvider } from "@xyflow/react";

const Relationships = () => {
  return (
    <div className="container mx-auto py-10 h-[calc(100vh-100px)]">
      <h1 className="text-2xl font-bold mb-5">Relationships</h1>
      <div className="h-[calc(100%-2rem)] relative">
        <ReactFlowProvider>
          <DatabaseDiagram />
        </ReactFlowProvider>
      </div>
    </div>
  );
};

export default Relationships;
