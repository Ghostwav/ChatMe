import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = "Search or start new chat" }: SearchBarProps) {
  return (
    <div className="p-2 bg-sidebar border-b border-sidebar-border">
      <div className="relative flex items-center w-full h-9 rounded-md bg-sidebar-accent overflow-hidden">
        <div className="pl-4 pr-2 flex items-center justify-center text-muted-foreground">
          <Search size={18} className={value ? "opacity-0" : "opacity-100 transition-opacity"} />
          <button 
            className={`absolute left-4 ${value ? "opacity-100 rotate-90" : "opacity-0 rotate-0"} transition-all duration-300 text-[#00a884]`}
            onClick={() => onChange("")}
          >
            <X size={18} />
          </button>
        </div>
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-full bg-transparent border-0 focus-visible:ring-0 px-2 text-sm placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}
