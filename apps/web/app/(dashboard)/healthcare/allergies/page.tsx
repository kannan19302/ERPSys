"use client";
import { useState, useEffect } from "react";
import { api } from "@unerp/shared/api";
import { Loader2 } from "lucide-react";

export default function HealthcareAllergiesPage() {
  const [allergies, setAllergies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);
  async function loadData() {
    setLoading(true);
    try {
      const patients = await api.get("/ext/healthcare/deep/patients");
      const allAllergies: any[] = [];
      for (const p of (patients.data || []).slice(0, 20)) {
        const r = await api
          .get(`/ext/healthcare/deep/patients/${p.id}/allergies`)
          .catch(() => ({ data: [] }));
        for (const a of r.data || [])
          allAllergies.push({
            ...a,
            patientName: `${p.firstName} ${p.lastName}`,
          });
      }
      setAllergies(allAllergies);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  return (
    <div className="ui-page">
      <div className="ui-page-header">
        <h1 className="ui-page-title">Patient Allergies</h1>
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
                <th>Allergen</th>
                <th>Severity</th>
                <th>Reaction</th>
              </tr>
            </thead>
            <tbody>
              {allergies.map((a: any) => (
                <tr key={a.id}>
                  <td className="font-medium">{a.patientName}</td>
                  <td>{a.allergen}</td>
                  <td>
                    <span
                      className={`ui-badge ${a.severity === "SEVERE" ? "ui-badge-danger" : a.severity === "MODERATE" ? "ui-badge-warning" : "ui-badge-info"}`}
                    >
                      {a.severity}
                    </span>
                  </td>
                  <td>{a.reaction || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
