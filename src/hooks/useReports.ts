import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface SalesSummary {
  location: string;
  total_revenue: number;
  total_units: number;
  transaction_count: number;
}

export interface SKUPerformance {
  sku: string;
  name: string;
  revenue: number;
  units_sold: number;
  current_stock: number;
  stock_to_sales_ratio: number;
}

export interface ReportData {
  summary: SalesSummary[];
  performance: SKUPerformance[];
}

export function useReports() {
  const { user } = useAuth();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/reports/sales-summary', {
        headers: { 'x-user-id': user.uid }
      });
      if (res.ok) {
        setReportData(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch report summary', err);
    } finally {
      setLoading(false);
    }
  };

  const getDrilldown = async (location: string) => {
    if (!user) return [];
    try {
      const res = await fetch(`/api/reports/drilldown/${location}`, {
        headers: { 'x-user-id': user.uid }
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error(`Failed to fetch drilldown for ${location}`, err);
    }
    return [];
  };

  useEffect(() => {
    fetchSummary();
  }, [user?.uid]);

  return { reportData, loading, getDrilldown, refresh: fetchSummary };
}
