'use client';

import type { InventoryItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Copy, Pencil, Package, Lock, Truck, Smile, Meh, Frown, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";

type InventoryCardProps = {
  item: InventoryItem;
  onEdit: (item: InventoryItem) => void;
};

const StatItem = ({ icon, label, value }: { icon: React.ElementType, label: string, value: number }) => {
  const Icon = icon;
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Icon className="w-4 h-4" />
      <span className="flex-1">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
};


export default function InventoryCard({ item, onEdit }: InventoryCardProps) {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(item.name).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy name.",
      });
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">{item.name}</CardTitle>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            <span className="ml-2">{isCopied ? 'Copied!' : 'Copy'}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
            <Pencil className="w-4 h-4" />
            <span className="ml-2">Edit</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2">
             <h4 className="font-semibold text-primary">Total: {item.quantity.total}</h4>
          </div>
          <div className="flex flex-col gap-2">
             <h4 className="font-semibold">Location</h4>
             <StatItem icon={Package} label="In Storage" value={item.quantity.storage} />
             <StatItem icon={Lock} label="In Lockers" value={item.quantity.lockers} />
             <StatItem icon={Truck} label="Checked Out" value={item.quantity.checkedOut} />
          </div>
          <div className="flex flex-col gap-2">
             <h4 className="font-semibold">Condition</h4>
             <StatItem icon={Smile} label="Good" value={item.condition.good} />
             <StatItem icon={Meh} label="Fair" value={item.condition.fair} />
             <StatItem icon={Frown} label="Poor" value={item.condition.poor} />
             <StatItem icon={XCircle} label="Broken" value={item.condition.broken} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
