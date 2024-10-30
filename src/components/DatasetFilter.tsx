import { DatePicker } from "@/components/GDate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { fastApiInstance } from "@/lib/axios";
import { format } from "date-fns";
import { Asterisk } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import useSWRImmutable from "swr/immutable";

interface FilterField {
  code: string;
  label: string;
  is_mandatory: boolean;
  datatype: string;
  datatype_format?: string;
  value_statement?: string;
  is_report_snapshot_field: boolean;
  is_filter: boolean;
}

interface FilterResponse {
  data: FilterField[];
}

interface Option {
  value: string;
  label: string;
}

interface DatasetFilterProps {
  datasetId: string | number;
  versionId: string | number;
  onFilterApply: (filterValues: Record<string, any>) => void;
}

// Fetcher functions
const filterFieldsFetcher = (url: string) =>
  fastApiInstance.get(url).then((res) => res.data);
const optionsFetcher = async ([url, field]: [string, FilterField]) => {
  const response = await fastApiInstance.get(url, {
    params: { statement: field.value_statement },
  });
  return {
    fieldCode: field.code,
    options: Array.isArray(response.data) ? response.data : [],
  };
};

export default function DatasetFilter({
  datasetId,
  versionId,
  onFilterApply,
}: DatasetFilterProps) {
  const { toast } = useToast();
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});

  // Fetch filter fields using SWR
  const { data: filterResponse, isLoading: isFieldsLoading } =
    useSWR<FilterResponse>(
      versionId
        ? `/api/v1/datasets/${datasetId}/filters/?version_id=${versionId}`
        : null,
      filterFieldsFetcher,
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 60000, // Cache for 1 minute
      }
    );

  // Sort and memoize filter fields
  const sortedFilterFields = useMemo(() => {
    if (!filterResponse?.data) return [];
    return [...filterResponse.data].sort((a, b) => {
      if (a.is_report_snapshot_field === b.is_report_snapshot_field) return 0;
      return a.is_report_snapshot_field ? -1 : 1;
    });
  }, [filterResponse]);

  // Get fields with value statements
  const fieldsWithStatements = useMemo(() => {
    return sortedFilterFields.filter((field) => field.value_statement);
  }, [sortedFilterFields]);

  // Fetch dropdown options using SWR for each field with a value_statement
  const dropdownOptionsResults = useSWRImmutable(
    fieldsWithStatements.map((field) => [
      `/api/v1/datasets/${datasetId}/execute_statement/`,
      field,
    ]),
    ([url, field]) => optionsFetcher([url, field]),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // Cache for 5 minutes
    }
  );

  // Combine all dropdown options into a single object
  const dropdownOptions = useMemo(() => {
    if (!dropdownOptionsResults.data) return {};

    return dropdownOptionsResults.data.reduce((acc, result) => {
      if (result) {
        acc[result.fieldCode] = result.options;
      }
      return acc;
    }, {} as Record<string, Option[]>);
  }, [dropdownOptionsResults.data]);

  // Initialize filter values when fields change
  useMemo(() => {
    if (sortedFilterFields.length > 0) {
      const initialValues: Record<string, any> = {};
      sortedFilterFields.forEach((field) => {
        if (!(field.code in filterValues)) {
          initialValues[field.code] = null;
        }
      });
      if (Object.keys(initialValues).length > 0) {
        setFilterValues((prev) => ({ ...prev, ...initialValues }));
      }
    }
  }, [sortedFilterFields, filterValues]);

  const handleFilterChange = useCallback((code: string, value: any) => {
    console.log("Filter changed:", code, value);
    setFilterValues((prev) => ({ ...prev, [code]: value }));
  }, []);

  const canApplyFilters = useCallback(() => {
    const hasAllMandatory = sortedFilterFields
      .filter((field) => field.is_mandatory)
      .every(
        (field) =>
          filterValues[field.code] !== null &&
          filterValues[field.code] !== undefined &&
          filterValues[field.code] !== ""
      );

    console.log("Can apply filters:", hasAllMandatory, filterValues);
    return hasAllMandatory;
  }, [sortedFilterFields, filterValues]);

  const handleApplyFilters = useCallback(() => {
    if (!canApplyFilters()) {
      toast({
        title: "Missing Filters",
        description: "Please fill in all mandatory filters",
        variant: "destructive",
      });
      return;
    }

    console.log("Applying filters:", filterValues);
    onFilterApply(filterValues);
  }, [filterValues, canApplyFilters, onFilterApply, toast]);

  if (isFieldsLoading || !filterResponse?.data) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-10 w-full max-w-sm" />
      </div>
    );
  }

  const isLoadingOptions = dropdownOptionsResults.isLoading;

  return (
    <div className="space-y-6 p-4 border rounded-lg bg-background">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedFilterFields.map((field) => (
          <div key={field.code} className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">
                {field.label}
                {field.is_mandatory && (
                  <Asterisk className="inline-block ml-1 h-3 w-3 text-destructive" />
                )}
              </label>
              {field.is_report_snapshot_field && (
                <Badge variant="outline" className="text-xs">
                  Snapshot
                </Badge>
              )}
            </div>

            {field.value_statement ? (
              // Dropdown for fields with value_statement
              <Select
                value={filterValues[field.code]?.toString() || ""}
                onValueChange={(value) => handleFilterChange(field.code, value)}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingOptions ? "Loading..." : "Select value"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {dropdownOptions[field.code]?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.datatype.toLowerCase() === "gregorianday" ? (
              // Date picker for date fields
              <DatePicker
                value={filterValues[field.code]}
                onChange={(date) =>
                  handleFilterChange(
                    field.code,
                    date ? format(date, "yyyy-MM-dd") : null
                  )
                }
                placeholder="Select date"
              />
            ) : (
              // Regular input for other fields
              <Input
                type={field.datatype === "number" ? "number" : "text"}
                value={filterValues[field.code] || ""}
                onChange={(e) => handleFilterChange(field.code, e.target.value)}
                placeholder={`Enter ${field.label.toLowerCase()}`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleApplyFilters}
          disabled={!canApplyFilters() || isLoadingOptions}
        >
          Show Data
        </Button>
      </div>

      {/* Debug Information */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-4 p-4 border rounded bg-gray-50 text-xs">
          <div>Filter Values: {JSON.stringify(filterValues, null, 2)}</div>
          <div>
            Dropdown Options: {JSON.stringify(dropdownOptions, null, 2)}
          </div>
          <div>
            Loading State:{" "}
            {JSON.stringify(
              {
                isFieldsLoading,
                isLoadingOptions,
                dropdownOptionsError: dropdownOptionsResults.error,
              },
              null,
              2
            )}
          </div>
        </div>
      )}
    </div>
  );
}
