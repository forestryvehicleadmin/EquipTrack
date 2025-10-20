export type InventoryItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  quantity: {
    total: number;
    storage: number;
    lockers: number;
    checkedOut: number;
  };
  condition: {
    good: number;
    fair: number;
    poor: number;
    broken: number;
  };
};
