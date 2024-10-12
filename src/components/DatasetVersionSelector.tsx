import GenericComboBox from "@/components/ComboBox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

import { fastApiInstance } from "@/lib/axios";
import React, { useEffect, useState } from "react";
import useSWR from "swr";

interface DatasetVersionSelectorProps {
  framework: string;
  layer: string;
  date: Date;
  onSelect: (datasetVersion: any) => void;
}

const DatasetVersionSelector: React.FC<DatasetVersionSelectorProps> = ({
  framework,
  layer,
  date,
  onSelect,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [selectedDataset, setSelectedDataset] = useState<string>("");

  const { data: groups } = useSWR(
    framework !== "NO_FILTER" && layer !== "NO_FILTER"
      ? `/api/v1/datasets/groups/?framework=${framework}&layer=${layer}`
      : null,
    fastApiInstance
  );

  const { data: datasetVersions } = useSWR(
    selectedDataset
      ? `/api/v1/datasets/${
          selectedDataset?.dataset_id
        }/versions/?date=${format(date, "yyyy-MM-dd")}`
      : null,
    fastApiInstance
  );
  console.log("datasetVersions::: ", datasetVersions?.data);
  const { data: dataVersionsColumns } = useSWR(
    datasetVersions
      ? `/api/v1/datasets/${selectedDataset?.dataset_id}/columns/?version_id=${datasetVersions?.data?.dataset_version_id}`
      : null,
    fastApiInstance
  );
  console.log({ dataVersionsColumns });
  // const { data: datasetVersions } = useSWR(
  //   selectedDataset
  //     ? `/api/v1/datasets/${selectedDataset}/versions/?date=${format(
  //         date,
  //         "yyyy-MM-dd"
  //       )}`
  //     : null,
  //   fastApiInstance
  // );
  // const columnsResponse = await fastApiInstance.get(
  //   `/api/v1/datasets/${selectedTable.dataset_id}/columns/`,
  //   {
  //     params: { version_id: datasetVersion.dataset_version_id },
  //   }
  // );

  useEffect(() => {
    setSelectedGroup("all");
    setSelectedDataset("");
  }, [framework, layer]);

  useEffect(() => {
    setSelectedDataset("");
  }, [selectedGroup]);

  const handleDatasetSelect = (datasetCode: string) => {
    setSelectedDataset(datasetCode);
  };

  return (
    <div className="flex space-x-2">
      <GenericComboBox
        apiEndpoint={`/api/v1/datasets/${
          selectedGroup === "all" ? "" : `by_group/?group=${selectedGroup}`
        }`}
        placeholder="Select a Dataset"
        onSelect={handleDatasetSelect}
      />

      <Select onValueChange={onSelect} disabled={!selectedDataset?.code}>
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="Select a Dataset Version" />
        </SelectTrigger>
        <SelectContent>
          {dataVersionsColumns?.data?.map((version: any) => (
            <SelectItem
              key={version.dataset_version_id}
              value={version.dataset_version_id.toString()}
            >
              {version.version_code || "Unnamed Version"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default DatasetVersionSelector;
