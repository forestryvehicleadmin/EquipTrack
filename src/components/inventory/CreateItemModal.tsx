"use client";

import { useState } from 'react';
import type { InventoryItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (item: InventoryItem) => void;
};

export default function CreateItemModal({ isOpen, onClose, onCreate }: Props) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [qtyGood, setQtyGood] = useState('0');
  const { toast } = useToast();

  const handleCreate = () => {
    // Validation
    if (!name.trim()) {
      toast({ title: 'Validation', description: 'Name is required', variant: 'destructive' });
      return;
    }
    const parsedQty = parseInt(qtyGood || '0', 10);
    if (Number.isNaN(parsedQty) || parsedQty < 0) {
      toast({ title: 'Validation', description: 'Quantity must be a non-negative integer', variant: 'destructive' });
      return;
    }

    const newItem: InventoryItem = {
      id: name.replace(/[^a-zA-Z0-9\-_\.]/g, '-') || `new-${Date.now()}`,
      name: name.trim(),
      description: notes || '',
      category: category || 'Uncategorized',
      quantity: {
        total: parsedQty,
        storage: 0,
        lockers: 0,
        checkedOut: 0,
      },
      condition: {
        good: parsedQty,
        fair: 0,
        poor: 0,
        broken: 0,
      },
    };

    onCreate(newItem);
    // reset and close
    setName('');
    setCategory('');
    setNotes('');
    setQtyGood('0');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Equipment</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2 py-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Category</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <div>
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div>
            <Label>Quantity (Good)</Label>
            <Input value={qtyGood} onChange={(e) => setQtyGood(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
