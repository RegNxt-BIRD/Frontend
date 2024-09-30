import { CustomNodeProps } from "@/types/databaseTypes";
import React, { useEffect, useState } from "react";

interface ColumnSelectionModalProps {
  sourceNode: CustomNodeProps | undefined;
  targetNode: CustomNodeProps | undefined;
  onClose: () => void;
  onSelect: (sourceColumn: string, targetColumn: string) => void;
  initialSourceColumn?: string;
  initialTargetColumn?: string;
}

interface Column {
  id: string;
  name: string;
}

const ColumnSelectionModal: React.FC<ColumnSelectionModalProps> = ({
  sourceNode,
  targetNode,
  onClose,
  onSelect,
  initialSourceColumn,
  initialTargetColumn,
}) => {
  const [selectedSourceColumn, setSelectedSourceColumn] = useState(
    initialSourceColumn || ""
  );
  const [selectedTargetColumn, setSelectedTargetColumn] = useState(
    initialTargetColumn || ""
  );

  useEffect(() => {
    setSelectedSourceColumn(initialSourceColumn || "");
    setSelectedTargetColumn(initialTargetColumn || "");
  }, [initialSourceColumn, initialTargetColumn]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSourceColumn && selectedTargetColumn) {
      onSelect(selectedSourceColumn, selectedTargetColumn);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">
          {initialSourceColumn
            ? "Edit Relationship"
            : "Create New Relationship"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2">
              Source Column ({sourceNode?.data?.label}):
              <select
                className="w-full border rounded p-2 mt-1"
                value={selectedSourceColumn}
                onChange={(e) => setSelectedSourceColumn(e.target.value)}
                required
              >
                <option value="">Select a column</option>
                {sourceNode?.data?.columns?.map((column: Column) => (
                  <option key={column.id} value={column.name}>
                    {column.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mb-4">
            <label className="block mb-2">
              Target Column ({targetNode?.data?.label}):
              <select
                className="w-full border rounded p-2 mt-1"
                value={selectedTargetColumn}
                onChange={(e) => setSelectedTargetColumn(e.target.value)}
                required
              >
                <option value="">Select a column</option>
                {targetNode?.data?.columns?.map((column: Column) => (
                  <option key={column.id} value={column.name}>
                    {column.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="mr-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {initialSourceColumn ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ColumnSelectionModal;
