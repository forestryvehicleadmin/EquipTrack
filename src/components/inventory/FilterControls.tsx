'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type FilterControlsProps = {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  categories: string[];
  selectedLocation: string;
  setSelectedLocation: (value: string) => void;
  locations: string[];
  showBrokenOnly: boolean;
  setShowBrokenOnly: (value: boolean) => void;
};

export default function FilterControls({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  selectedLocation,
  setSelectedLocation,
  locations,
  showBrokenOnly,
  setShowBrokenOnly,
}: FilterControlsProps) {
  return (
    <div className="flex flex-col md:flex-row items-center gap-4 p-4 bg-card/80 backdrop-blur-sm border-b">
      <div className="w-full md:w-auto md:flex-1">
        <Input
          placeholder="Search by name..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>
      <div className="grid grid-cols-2 md:flex md:flex-row gap-4 w-full md:w-auto">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            {locations.map(loc => (
              <SelectItem key={loc} value={loc}>
                {loc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center space-x-2 self-start md:self-center">
        <Checkbox
          id="broken-filter"
          checked={showBrokenOnly}
          onCheckedChange={checked => setShowBrokenOnly(!!checked)}
        />
        <Label htmlFor="broken-filter" className="whitespace-nowrap">
          Show Broken Only
        </Label>
      </div>
    </div>
  );
}
