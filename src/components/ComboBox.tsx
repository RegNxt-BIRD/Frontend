import { useDebounce } from "@/hooks/use-debounce";
import { fastApiInstance } from "@/lib/axios";
import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";

interface ComboBoxProps {
  apiEndpoint: string;
  placeholder: string;
  onSelect: (value: DatasetItem) => void;
}

interface DatasetItem {
  dataset_id: number;
  code: string;
  label: string;
  description: string;
  framework: string;
  type: string;
  groups: any[];
}

export default function GenericComboBox({
  apiEndpoint,
  placeholder,
  onSelect,
}: ComboBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data, error, isLoading } = useSWR<{ data: DatasetItem[] }>(
    `${apiEndpoint}${
      debouncedSearchTerm ? `?search=${debouncedSearchTerm}` : ""
    }`,
    fastApiInstance
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (item: DatasetItem) => {
    setSelectedValue(item.label);
    setIsOpen(false);
    console.log("asd: ", item);
    onSelect(item);
  };

  const filteredItems = data?.data || [];

  return (
    <div className="relative w-full max-w-[300px]" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {selectedValue || placeholder}
        <ChevronsUpDown
          className="w-5 h-5 ml-2 -mr-1 text-gray-400"
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg">
          <input
            type="text"
            className="w-full px-4 py-2 border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <ul className="py-1 overflow-auto max-h-60">
            {isLoading && (
              <li className="px-4 py-2 text-gray-500">Loading...</li>
            )}
            {error && (
              <li className="px-4 py-2 text-red-500">Error loading data</li>
            )}
            {!isLoading && !error && filteredItems.length === 0 && (
              <li className="px-4 py-2 text-gray-500">No results found</li>
            )}
            {filteredItems.map((item) => (
              <li
                key={item.code}
                className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSelect(item)}
              >
                <Check
                  className={`w-5 h-5 mr-2 ${
                    selectedValue === item.label
                      ? "text-indigo-600"
                      : "text-transparent"
                  }`}
                />
                {item.code}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
