"use client";

import React, { useMemo } from 'react';
import type { InventoryItem } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type Props = {
  initialItems: InventoryItem[];
};

const COLORS = ['#10B981', '#F59E0B', '#F97316', '#EF4444'];

export default function StatsDashboard({ initialItems }: Props) {
  const totals = useMemo(() => {
    const totalItems = initialItems.reduce((sum, item) => sum + (item.quantity.total || 0), 0);
    const totalGood = initialItems.reduce((sum, item) => sum + (item.condition.good || 0), 0);
    const totalFair = initialItems.reduce((sum, item) => sum + (item.condition.fair || 0), 0);
    const totalPoor = initialItems.reduce((sum, item) => sum + (item.condition.poor || 0), 0);
    const totalBroken = initialItems.reduce((sum, item) => sum + (item.condition.broken || 0), 0);

    const byCategory: Record<string, number> = {};
    initialItems.forEach(item => {
      const cat = item.category || 'Uncategorized';
      byCategory[cat] = (byCategory[cat] || 0) + (item.quantity.total || 0);
    });

    return { totalItems, totalGood, totalFair, totalPoor, totalBroken, byCategory };
  }, [initialItems]);

  const conditionPieData = [
    { name: 'Good', value: totals.totalGood },
    { name: 'Fair', value: totals.totalFair },
    { name: 'Poor', value: totals.totalPoor },
    { name: 'Broken', value: totals.totalBroken },
  ];

  const categoryBarData = Object.entries(totals.byCategory).map(([name, value]) => ({ name, value }));

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="grid grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Equipment</CardTitle>
              <CardDescription className="text-muted-foreground">All units across categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-semibold">{totals.totalItems.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Broken Items</CardTitle>
              <CardDescription className="text-muted-foreground">Items marked as broken</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-semibold text-rose-600">{totals.totalBroken.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Condition Breakdown</CardTitle>
            <CardDescription>Distribution of equipment by condition</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ height: 300 }}>
              <ChartContainer id="condition-pie" config={{ good: { color: COLORS[0] }, fair: { color: COLORS[1] }, poor: { color: COLORS[2] }, broken: { color: COLORS[3] } }}>
                <PieChart>
                  <Pie dataKey="value" data={conditionPieData} outerRadius={100} innerRadius={50} paddingAngle={2} label>
                    {conditionPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By Category</CardTitle>
            <CardDescription>Counts grouped by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryBarData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={160} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2563EB" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Useful counts at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between">
                <div className="text-sm text-muted-foreground">Good</div>
                <div className="font-medium">{totals.totalGood.toLocaleString()}</div>
              </div>
              <div className="flex justify-between">
                <div className="text-sm text-muted-foreground">Fair</div>
                <div className="font-medium">{totals.totalFair.toLocaleString()}</div>
              </div>
              <div className="flex justify-between">
                <div className="text-sm text-muted-foreground">Poor</div>
                <div className="font-medium">{totals.totalPoor.toLocaleString()}</div>
              </div>
              <div className="flex justify-between">
                <div className="text-sm text-muted-foreground">Broken</div>
                <div className="font-medium text-rose-600">{totals.totalBroken.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
            <CardDescription>Most populous categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {categoryBarData.slice(0, 6).map(cat => (
                <div key={cat.name} className="flex justify-between">
                  <div className="truncate text-sm">{cat.name}</div>
                  <div className="font-medium">{cat.value.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
