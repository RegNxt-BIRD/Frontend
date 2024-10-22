import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { fastApiInstance } from "@/lib/axios";
import { Column } from "@/types/databaseTypes";
import React, { useEffect, useState } from "react";
import { EditableColumnTable } from "./EditableColumnTable";

interface DatasetVersionColumnsProps {
  datasetId: number;
  versionId: number;
}

export const DatasetVersionColumns: React.FC<DatasetVersionColumnsProps> = ({
  datasetId,
  versionId,
}) => {
  const [columns, setColumns] = useState<Column[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchColumns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetId, versionId]);

  const fetchColumns = async () => {
    try {
      setIsLoading(true);
      const response = await fastApiInstance.get(
        `/api/v1/datasets/${datasetId}/version-columns/?version_id=${versionId}`
      );
      setColumns(response.data);
    } catch (error) {
      console.error("Error fetching columns:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleColumnsChange = (columns: Column[]) => {
    setColumns(columns);
  };

  const handleSave = async () => {
    try {
      const columnsToSave = columns.map((column) => ({
        ...column,
        dataset_version_id: versionId,
      }));
      await fastApiInstance.post(
        `/api/v1/datasets/${datasetId}/update-columns/?version_id=${versionId}`,
        { columns: columnsToSave }
      );
      toast({
        title: "Success",
        description: "Columns updated successfully.",
      });
      fetchColumns(); // Refresh the columns after saving
    } catch (error) {
      console.error("Error saving columns:", error);
      toast({
        title: "Error",
        description: "Failed to save columns. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Dataset Version Columns</h3>
      <EditableColumnTable
        columns={columns}
        onColumnsChange={handleColumnsChange}
      />
      <Button onClick={handleSave}>Save Changes</Button>
    </div>
  );
};
