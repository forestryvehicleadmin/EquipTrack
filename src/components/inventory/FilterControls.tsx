"use client";

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Download } from 'lucide-react';

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
  onCreate?: () => void;
  onDownloadCsv?: () => void;
  // Optional multi-field filter props
  filterField?: string;
  setFilterField?: (value: string) => void;
  // (mode/value removed)
  // Optional sorting props
  sortField?: string;
  setSortField?: (value: string) => void;
  sortOrder?: 'asc' | 'desc';
  setSortOrder?: (value: 'asc' | 'desc') => void;
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
  onCreate,
  onDownloadCsv,
  filterField,
  setFilterField,
  sortField,
  setSortField,
  sortOrder,
  setSortOrder,
}: FilterControlsProps) {
  // local state to keep component controlled even if parent doesn't provide setters
  const [localFilterField, setLocalFilterField] = useState<string>(filterField ?? 'any');
  // sorting local state
  const [localSortField, setLocalSortField] = useState<string>(sortField ?? 'name');
  const [localSortOrder, setLocalSortOrder] = useState<'asc' | 'desc'>(sortOrder ?? 'asc');

  useEffect(() => setLocalFilterField(filterField && filterField !== '' ? filterField : 'any'), [filterField]);
  useEffect(() => setLocalSortField(sortField ?? 'name'), [sortField]);
  useEffect(() => setLocalSortOrder(sortOrder ?? 'asc'), [sortOrder]);

  const handleFieldChange = (val: string) => {
    setLocalFilterField(val);
    setFilterField?.(val);
  };

  const handleSortFieldChange = (val: string) => {
    setLocalSortField(val);
    setSortField?.(val);
  };

  const handleSortOrderChange = (val: 'asc' | 'desc') => {
    setLocalSortOrder(val);
    setSortOrder?.(val);
  };
  return (
    <div className="flex flex-col md:flex-row items-center gap-4 p-4 bg-card/80 backdrop-blur-sm border-b">
      <div className="flex items-center gap-2 w-full md:w-auto md:flex-1">
        {onCreate && (
          <Button variant="default" size="sm" onClick={onCreate}>New Item</Button>
        )}
        {onDownloadCsv && (
          <Button variant="outline" size="sm" onClick={onDownloadCsv}><Download /> CSV</Button>
        )}
      </div>
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
  {/* Multi-field filter: field selector, mode selector, adaptive input, and sorting */}
        
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select value={localSortField} onValueChange={handleSortFieldChange}>
            <SelectTrigger className="w-full md:w-[140px]">
              <SelectValue placeholder="Sort Field" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="category">Category</SelectItem>
              <SelectItem value="location">Location</SelectItem>
              <SelectItem value="quantity">Quantity</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select value={localSortOrder} onValueChange={(v: string) => handleSortOrderChange(v as 'asc' | 'desc')}>
            <SelectTrigger className="w-full md:w-[120px]">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">A → Z</SelectItem>
              <SelectItem value="desc">Z → A</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
