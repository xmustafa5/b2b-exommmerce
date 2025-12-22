"use client";

import { useState } from "react";
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from "date-fns";
import { Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  zone?: string;
  onDateChange: (startDate: string, endDate: string) => void;
  onZoneChange: (zone: string | undefined) => void;
}

const PRESETS = [
  { label: "Last 7 days", getValue: () => ({ start: subDays(new Date(), 7), end: new Date() }) },
  { label: "Last 30 days", getValue: () => ({ start: subDays(new Date(), 30), end: new Date() }) },
  { label: "Last 90 days", getValue: () => ({ start: subDays(new Date(), 90), end: new Date() }) },
  { label: "This month", getValue: () => ({ start: startOfMonth(new Date()), end: new Date() }) },
  { label: "Last month", getValue: () => {
    const lastMonth = subDays(startOfMonth(new Date()), 1);
    return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
  }},
  { label: "This year", getValue: () => ({ start: startOfYear(new Date()), end: new Date() }) },
];

export function DateRangePicker({
  startDate,
  endDate,
  zone,
  onDateChange,
  onZoneChange,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);

  const handlePresetClick = (preset: typeof PRESETS[0]) => {
    const { start, end } = preset.getValue();
    const startStr = format(start, "yyyy-MM-dd");
    const endStr = format(end, "yyyy-MM-dd");
    setTempStart(startStr);
    setTempEnd(endStr);
    onDateChange(startStr, endStr);
    setIsOpen(false);
  };

  const handleApply = () => {
    onDateChange(tempStart, tempEnd);
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (!startDate || !endDate) return "Select date range";
    return `${format(new Date(startDate), "MMM d, yyyy")} - ${format(new Date(endDate), "MMM d, yyyy")}`;
  };

  return (
    <div className="flex items-center gap-2">
      {/* Date Range Picker */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="min-w-[240px] justify-start text-left">
            <Calendar className="mr-2 h-4 w-4" />
            {getDisplayText()}
            <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Presets */}
            <div className="border-r p-2">
              <p className="px-2 py-1 text-sm font-medium text-muted-foreground">
                Quick Select
              </p>
              {PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handlePresetClick(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            {/* Custom Date Selection */}
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={tempStart}
                  onChange={(e) => setTempStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={tempEnd}
                  onChange={(e) => setTempEnd(e.target.value)}
                />
              </div>
              <Button onClick={handleApply} className="w-full">
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Zone Filter */}
      <Select
        value={zone || "all"}
        onValueChange={(value) => onZoneChange(value === "all" ? undefined : value)}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Zone" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Zones</SelectItem>
          <SelectItem value="KARKH">KARKH</SelectItem>
          <SelectItem value="RUSAFA">RUSAFA</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
