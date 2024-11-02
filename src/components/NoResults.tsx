import { FileQuestion } from "lucide-react";

interface NoResultsProps {
  title?: string;
  message?: string;
}

export const NoResults = ({
  title = "No results found",
  message = "Try adjusting your filters to find what you're looking for.",
}: NoResultsProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-center max-w-sm">{message}</p>
    </div>
  );
};
