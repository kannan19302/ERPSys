/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState } from 'react';
import { BarChart3, PieChart, FileText, Download, Calendar, Loader2 } from 'lucide-react';
import { Card, Button } from '@unerp/ui';

export default function AdvancedReportsPage() {
  const [activeReport, setActiveReport] = useState('pnl');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const generateReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
      let url = '';
      if (activeReport === 'pnl') url = 'http://localhost:3001/api/v1/advanced-finance/reports/pnl?startDate=2026-01-01&endDate=2026-12-31';
      else if (activeReport === 'bs') url = 'http://localhost:3001/api/v1/advanced-finance/reports/balance-sheet?asOfDate=2026-12-31';
      else if (activeReport === 'cf') url = 'http://localhost:3001/api/v1/advanced-finance/reports/cash-flow?startDate=2026-01-01&endDate=2026-12-31';

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        setReportData(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Statements</h1>
          <p className="text-muted-foreground mt-1">Generate dynamic P&L, Balance Sheet, and Cash Flow reports.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
          <Button variant="outline"><FileText className="mr-2 h-4 w-4" /> Export PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Report Selector */}
        <div className="md:col-span-1 space-y-2">
          <button 
            onClick={() => { setActiveReport('pnl'); setReportData(null); }}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${activeReport === 'pnl' ? 'bg-primary/5 border-primary text-primary font-medium shadow-sm' : 'bg-card hover:bg-muted/50 border-transparent'}`}
          >
            <BarChart3 className="h-5 w-5" />
            Profit & Loss
          </button>
          <button 
            onClick={() => { setActiveReport('bs'); setReportData(null); }}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${activeReport === 'bs' ? 'bg-primary/5 border-primary text-primary font-medium shadow-sm' : 'bg-card hover:bg-muted/50 border-transparent'}`}
          >
            <PieChart className="h-5 w-5" />
            Balance Sheet
          </button>
          <button 
            onClick={() => { setActiveReport('cf'); setReportData(null); }}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${activeReport === 'cf' ? 'bg-primary/5 border-primary text-primary font-medium shadow-sm' : 'bg-card hover:bg-muted/50 border-transparent'}`}
          >
            <TrendingUpIcon className="h-5 w-5" />
            Cash Flow
          </button>
        </div>

        {/* Report View */}
        <div className="md:col-span-3">
          <Card className="min-h-[500px] flex flex-col border-primary/20">
            <div className="p-4 border-b bg-muted/10 flex justify-between items-center">
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" /> Date Range: FY 2026
                </div>
              </div>
              <Button onClick={generateReport} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayIcon className="mr-2 h-4 w-4" />}
                Generate Report
              </Button>
            </div>
            <div className="flex-1 p-8">
              {!reportData && !loading && (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60">
                  <FileText className="h-16 w-16 mb-4 stroke-[1.5]" />
                  <p className="text-lg">Select a report and click Generate</p>
                </div>
              )}
              {loading && (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              {reportData && !loading && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="text-center pb-6 border-b">
                    <h2 className="text-2xl font-bold uppercase tracking-widest">
                      {activeReport === 'pnl' ? 'Profit & Loss Statement' : activeReport === 'bs' ? 'Balance Sheet' : 'Statement of Cash Flows'}
                    </h2>
                    <p className="text-muted-foreground mt-2">Generated for the period ending Dec 31, 2026</p>
                  </div>
                  <pre className="bg-muted p-6 rounded-xl overflow-x-auto text-sm font-mono border">
                    {JSON.stringify(reportData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

const TrendingUpIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
);
const PlayIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="5 3 19 12 5 21 5 3"/></svg>
);
