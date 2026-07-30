// @ts-nocheck
"use client";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
const api = {
  get: async (p: string) => {
    const r = await fetch(`${BASE}${p}`, { credentials: "include" });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
};

export default function HealthcareMedicalRecordsPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);
  async function loadData() {
    setLoading(true);
    try {
      const patients = await api.get("/ext/healthcare/deep/patients");
      const allRecords: any[] = [];
      for (const p of (patients.data || []).slice(0, 10)) {
        const r = await api
          .get(`/ext/healthcare/deep/patients/${p.id}/medical-records`)
          .catch(() => ({ data: [] }));
        for (const rec of r.data || [])
          allRecords.push({
            ...rec,
            patientName: `${p.firstName} ${p.lastName}`,
          });
      }
      setRecords(allRecords);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  return (
    <div className="ui-page">
      <div className="ui-page-header">
        <h1 className="ui-page-title">Medical Records (EHR)</h1>
      </div>
      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="ui-card">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Title</th>
                <th>Type</th>
                <th>Diagnosis</th>
                <th>Signed</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r: any) => (
                <tr key={r.id}>
                  <td className="font-medium">{r.patientName}</td>
                  <td>{r.title}</td>
                  <td>
                    <span className="ui-badge ui-badge-info">
                      {r.recordType}
                    </span>
                  </td>
                  <td>{r.diagnosis || "-"}</td>
                  <td>
                    {r.signedBy
                      ? `${r.signedBy} ${r.signedAt ? new Date(r.signedAt).toLocaleDateString() : ""}`
                      : "Unsigned"}
                  </td>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
