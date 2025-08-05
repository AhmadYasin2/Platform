"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ContractData {
  status: string;
  count: number;
  color: string;
}

export default function ContractStatusChart() {
  const [data, setData] = useState<ContractData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContractData();
  }, []);

  const fetchContractData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contract-status");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: { Signed: number; Sent: number; Pending: number } = await res.json();

      const chartData: ContractData[] = [
        { status: "Signed",  count: json.Signed,  color: "#28a745" },
        { status: "Sent",    count: json.Sent,    color: "#ffc107" },
        { status: "Pending", count: json.Pending, color: "#dc3545" },
      ];

      setData(chartData);
    } catch (err) {
      console.error("Error fetching contract data:", err);
    } finally {
      setLoading(false);
    }
  };

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="bg-white shadow-sm border-0">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-[#212121]">
          Contract Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-[#212121] opacity-70">Loading...</p>
        ) : (
          <>
            <div className="space-y-4">
              {data.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-[#212121]">
                      {item.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-[#212121]">
                      {item.count}
                    </span>
                    {total > 0 && (
                      <span className="text-xs text-[#212121] opacity-70 ml-1">
                        ({Math.round((item.count / total) * 100)}%)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-[#212121]">
                  Total
                </span>
                <span className="text-sm font-bold text-[#212121]">
                  {total}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
