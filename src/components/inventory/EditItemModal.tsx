'use client';

import type { InventoryItem } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { updateInventoryItem } from '@/lib/data.client';

type EditItemModalProps = {
  item: InventoryItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
};

// Helper to evaluate simple math expressions
const evaluateMathExpression = (expr: string | number): number => {
  if (typeof expr === 'number') return expr;
  if (!expr || typeof expr !== 'string') return 0;
  // Sanitize to prevent security risks, only allowing numbers and basic operators.
  const sanitizedExpr = expr.replace(/[^0-9+\-*/.() ]/g, '');
  if (sanitizedExpr !== expr) return parseInt(expr, 10) || 0;
  try {
    // Using new Function is safer than eval, but still requires a sanitized string.
    const result = new Function('return ' + sanitizedExpr)();
    return isFinite(result) ? Math.round(result) : 0;
  } catch (error) {
    return parseInt(expr, 10) || 0;
  }
};

const FormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string(),
  category: z.string().min(1, 'Category is required'),
  quantity_lockers: z.union([z.string(), z.number()]),
  quantity_checkedOut: z.union([z.string(), z.number()]),
  condition_good: z.union([z.string(), z.number()]),
  condition_fair: z.union([z.string(), z.number()]),
  condition_poor: z.union([z.string(), z.number()]),
  condition_broken: z.union([z.string(), z.number()]),
});

type FormValues = z.infer<typeof FormSchema>;

export default function EditItemModal({ item, isOpen, onClose, onSave }: EditItemModalProps) {
  const [isSuggesting, setIsSuggesting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
  });

  useEffect(() => {
    if (item) {
      form.reset({
        name: item.name,
        description: item.description,
        category: item.category,
        quantity_lockers: item.quantity.lockers,
        quantity_checkedOut: item.quantity.checkedOut,
        condition_good: item.condition.good,
        condition_fair: item.condition.fair,
        condition_poor: item.condition.poor,
        condition_broken: item.condition.broken,
      });
    }
  }, [item, form.reset]);

  const watchedValues = form.watch();

  const [calculatedQuantities, setCalculatedQuantities] = useState({
    total: item.quantity.total,
    storage: item.quantity.storage
  });

  useEffect(() => {
    const good = evaluateMathExpression(watchedValues.condition_good);
    const fair = evaluateMathExpression(watchedValues.condition_fair);
    const poor = evaluateMathExpression(watchedValues.condition_poor);
    const broken = evaluateMathExpression(watchedValues.condition_broken);
    const lockers = evaluateMathExpression(watchedValues.quantity_lockers);
    const checkedOut = evaluateMathExpression(watchedValues.quantity_checkedOut);
    
    const newTotal = good + fair + poor + broken;
    const newStorage = newTotal - (lockers + checkedOut);

    setCalculatedQuantities({
        total: newTotal,
        storage: newStorage
    });
  }, [watchedValues.condition_good, watchedValues.condition_fair, watchedValues.condition_poor, watchedValues.condition_broken, watchedValues.quantity_lockers, watchedValues.quantity_checkedOut]);
  
  const handleBlur = (fieldName: keyof FormValues) => (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = evaluateMathExpression(e.target.value);
    form.setValue(fieldName, value);
  };

  const onSubmit = async (data: FormValues) => {
    const finalItem: InventoryItem = {
      ...item,
      name: data.name,
      description: data.description,
      category: data.category,
      quantity: {
        total: calculatedQuantities.total,
        storage: calculatedQuantities.storage,
        lockers: evaluateMathExpression(data.quantity_lockers),
        checkedOut: evaluateMathExpression(data.quantity_checkedOut),
      },
      condition: {
        good: evaluateMathExpression(data.condition_good),
        fair: evaluateMathExpression(data.condition_fair),
        poor: evaluateMathExpression(data.condition_poor),
        broken: evaluateMathExpression(data.condition_broken),
      },
    };

    // Send update to server (Supabase) via client helper
    try {
      await updateInventoryItem(finalItem);
      toast({ title: 'Saved', description: 'Equipment updated.' });
      onSave(finalItem);
      onClose();
    } catch (error) {
      console.error('Update error', error);
      toast({ title: 'Error', description: (error as Error)?.message || 'Failed to update equipment.' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit {item.name}</DialogTitle>
          <DialogDescription>
            Make changes to the inventory item. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <ScrollArea className="max-h-[60vh] p-1">
            <div className="space-y-6 px-4 py-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" {...form.register('name')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <div className="flex gap-2">
                    <Input id="category" {...form.register('category')} />
                    
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...form.register('description')} rows={3}/>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">Location Quantities</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity_lockers">In Lockers</Label>
                    <Input id="quantity_lockers" {...form.register('quantity_lockers')} onBlur={handleBlur('quantity_lockers')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity_checkedOut">Checked Out</Label>
                    <Input id="quantity_checkedOut" {...form.register('quantity_checkedOut')} onBlur={handleBlur('quantity_checkedOut')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity_storage">In Storage</Label>
                    <Input id="quantity_storage" value={calculatedQuantities.storage} readOnly disabled />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">Condition Quantities</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="condition_good">Good</Label>
                    <Input id="condition_good" {...form.register('condition_good')} onBlur={handleBlur('condition_good')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="condition_fair">Fair</Label>
                    <Input id="condition_fair" {...form.register('condition_fair')} onBlur={handleBlur('condition_fair')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="condition_poor">Poor</Label>
                    <Input id="condition_poor" {...form.register('condition_poor')} onBlur={handleBlur('condition_poor')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="condition_broken">Broken</Label>
                    <Input id="condition_broken" {...form.register('condition_broken')} onBlur={handleBlur('condition_broken')} />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="quantity_total">Total Quantity</Label>
                  <Input id="quantity_total" value={calculatedQuantities.total} readOnly disabled />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="pt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
