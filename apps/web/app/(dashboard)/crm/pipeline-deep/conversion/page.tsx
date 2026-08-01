"use client";

import { useState, useEffect } from "react";
import { useApiClient } from "@unerp/framework";

export default function PipelineConversionPage() {
  const api = useApiClient();
  const [conversion, setConversion] = useState<any[]>([]);
  const [duration, setDuration] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/crm/pipeline-deep/stage-conversion/null"),
      api.get("/crm/pipeline-deep/stage-duration/null"),
    ])
      .then(([c, d]: any) => {
        setConversion(c.data || []);
        setDuration(d.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading)
    return <div className="ui-card p-6">Loading conversion data...</div>;

  return (
    <div className="space-y-6">
      <div className="ui-card p-4">
        <h1 className="text-xl font-bold mb-4">Stage Conversion Rates</h1>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 px-2">Stage</th>
              <th className="py-2 px-2">Entered</th>
              <th className="py-2 px-2">Won</th>
              <th className="py-2 px-2">Lost</th>
              <th className="py-2 px-2">→Win %</th>
              <th className="py-2 px-2">→Lost %</th>
            </tr>
          </thead>
          <tbody>
            {conversion.map((s: any) => (
              <tr key={s.stage} className="border-b hover:bg-muted/50">
                <td className="py-2 px-2 font-medium">{s.stage}</td>
                <td className="py-2 px-2">{s.entered}</td>
                <td className="py-2 px-2">{s.won}</td>
                <td className="py-2 px-2">{s.lost}</td>
                <td className="py-2 px-2">{s.conversionToWin}%</td>
                <td className="py-2 px-2">{s.conversionToLoss}%</td>
              </tr>
            ))}
            {conversion.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="py-4 text-center text-muted-foreground"
                >
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="ui-card p-4">
        <h2 className="text-xl font-bold mb-4">Stage Duration Analysis</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 px-2">Stage</th>
              <th className="py-2 px-2">Deals</th>
              <th className="py-2 px-2">Avg Days</th>
              <th className="py-2 px-2">Min Days</th>
              <th className="py-2 px-2">Max Days</th>
            </tr>
          </thead>
          <tbody>
            {duration.map((s: any) => (
              <tr key={s.stage} className="border-b hover:bg-muted/50">
                <td className="py-2 px-2 font-medium">{s.stage}</td>
                <td className="py-2 px-2">{s.count}</td>
                <td className="py-2 px-2">{s.avgDays}</td>
                <td className="py-2 px-2">{s.minDays}</td>
                <td className="py-2 px-2">{s.maxDays}</td>
              </tr>
            ))}
            {duration.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="py-4 text-center text-muted-foreground"
                >
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
