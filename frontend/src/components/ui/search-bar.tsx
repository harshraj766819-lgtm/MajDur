"use client";

import * as React from "react";
import { Search, MapPin, X, Loader2 } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface SearchBarProps {
  initialQuery?: string;
  initialCity?: string;
  onSearch: (params: { query: string; city: string }) => void;
  placeholder?: string;
  cities?: string[];
  isLoading?: boolean;
  className?: string;
}

const DEFAULT_CITIES = [
  "All India",
  "Delhi NCR",
  "Mumbai",
  "Bengaluru",
  "Patna",
  "Lucknow",
  "Kolkata",
  "Hyderabad",
  "Pune",
  "Ahmedabad",
];

export function SearchBar({
  initialQuery = "",
  initialCity = "All India",
  onSearch,
  placeholder = "Search by trade, skill or name (e.g. Electrician, Mason)...",
  cities = DEFAULT_CITIES,
  isLoading = false,
  className,
}: SearchBarProps) {
  const [query, setQuery] = React.useState(initialQuery);
  const [city, setCity] = React.useState(initialCity);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ query: query.trim(), city });
  };

  const handleClear = () => {
    setQuery("");
    onSearch({ query: "", city });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex flex-col sm:flex-row items-center gap-2 rounded-2xl bg-[#181818] p-2 border border-[#2A2A2A] shadow-lg transition-all focus-within:border-[#D4AF37]/60",
        className
      )}
    >
      {/* Search Input */}
      <div className="relative flex-1 w-full flex items-center">
        <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-zinc-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent py-2.5 pl-10 pr-9 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 p-1 rounded-full text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* City Dropdown */}
      <div className="relative w-full sm:w-48 border-t sm:border-t-0 sm:border-l border-[#2A2A2A] flex items-center">
        <MapPin className="pointer-events-none absolute left-3 h-4 w-4 text-zinc-500" />
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full appearance-none bg-transparent py-2.5 pl-9 pr-6 text-sm text-zinc-200 focus:outline-none cursor-pointer"
        >
          {cities.map((c) => (
            <option key={c} value={c} className="bg-[#181818] text-white">
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        size="md"
        variant="primary"
        isLoading={isLoading}
        className="w-full sm:w-auto px-6 rounded-xl bg-[#D4AF37] hover:bg-[#C5A028] text-black font-bold shrink-0"
      >
        Search
      </Button>
    </form>
  );
}

