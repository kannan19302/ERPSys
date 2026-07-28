"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost } from "../../../src/lib/api";
import { Spinner, Button, Input, Select, Checkbox } from "@unerp/ui";
import { Check, ChevronRight, Save, LogIn } from "lucide-react";
import styles from "./page.module.css";
import "../../landing.css";

const MODULES = [
  { id: "finance", name: "Finance & Accounting", description: "GL, AR/AP, Invoicing", icon: "💰" },
  { id: "hr", name: "Human Resources", description: "Employees, Payroll, Time off", icon: "👥" },
  { id: "crm", name: "CRM", description: "Leads, Opportunities, Customers", icon: "🎯" },
  { id: "inventory", name: "Inventory", description: "Stock, Warehouses, Fulfillment", icon: "📦" },
  { id: "sales", name: "Sales", description: "Quotations, Sales Orders", icon: "📈" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [workspace, setWorkspace] = useState({
    timezone: "UTC",
    currency: "USD",
    fiscalYearStart: "01-01",
    logoUrl: "",
  });
  const [team, setTeam] = useState([{ email: "", role: "employee" }]);
  const [modules, setModules] = useState<Set<string>>(new Set(["finance", "hr"]));

  const handleSaveAndContinue = async () => {
    setSaving(true);
    try {
      // Simulate saving to backend
      await new Promise(resolve => setTimeout(resolve, 500));
      if (step < 6) {
        setStep(step + 1);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className={styles.stepContent}>
            <h2>Welcome to UniERP!</h2>
            <p>Let's get your workspace set up. This will only take a few minutes.</p>
          </div>
        );
      case 2:
        return (
          <div className={styles.stepContent}>
            <h2>Workspace Setup</h2>
            <div className={styles.fieldGroup}>
              <label>Timezone</label>
              <select value={workspace.timezone} onChange={e => setWorkspace({...workspace, timezone: e.target.value})}>
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>
            <div className={styles.fieldGroup}>
              <label>Currency</label>
              <select value={workspace.currency} onChange={e => setWorkspace({...workspace, currency: e.target.value})}>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>
        );
      case 3:
        return (
          <div className={styles.stepContent}>
            <h2>Team Invite</h2>
            <p>Invite colleagues to join your workspace (Up to 5 on the free tier).</p>
            {team.map((member, i) => (
              <div key={i} className={styles.teamMember}>
                <input 
                  type="email" 
                  placeholder="name@company.com" 
                  value={member.email}
                  onChange={e => {
                    const newTeam = [...team];
                    newTeam[i].email = e.target.value;
                    setTeam(newTeam);
                  }}
                />
              </div>
            ))}
            <button type="button" onClick={() => setTeam([...team, {email: "", role: "employee"}])}>
              + Add another
            </button>
          </div>
        );
      case 4:
        return (
          <div className={styles.stepContent}>
            <h2>Module Selection</h2>
            <p>Select the modules you want to enable for your workspace.</p>
            <div className={styles.moduleGrid}>
              {MODULES.map(mod => (
                <div 
                  key={mod.id} 
                  className={`${styles.moduleCard} ${modules.has(mod.id) ? styles.selected : ''}`}
                  onClick={() => {
                    const newMods = new Set(modules);
                    if (newMods.has(mod.id)) newMods.delete(mod.id);
                    else newMods.add(mod.id);
                    setModules(newMods);
                  }}
                >
                  <span className={styles.moduleIcon}>{mod.icon}</span>
                  <h4>{mod.name}</h4>
                  <p>{mod.description}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 5:
        return (
          <div className={styles.stepContent}>
            <h2>Data Import</h2>
            <p>Would you like to import existing data or start fresh?</p>
            <div className={styles.importOptions}>
              <button type="button" className={styles.importBtn}>Start Fresh</button>
              <button type="button" className={styles.importBtn}>Import Data (CSV/Excel)</button>
            </div>
          </div>
        );
      case 6:
        return (
          <div className={styles.stepContent}>
            <h2>All Set!</h2>
            <p>Your workspace is ready. Let's get to work.</p>
          </div>
        );
    }
  };

  return (
    <div className={styles.onboardingContainer}>
      <div className={styles.onboardingCard}>
        <div className={styles.progressHeader}>
          Step {step} of 6
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${(step / 6) * 100}%` }} />
          </div>
        </div>
        
        <div className={styles.contentArea}>
          {renderStepContent()}
        </div>

        <div className={styles.footerActions}>
          {step > 1 && step < 6 && (
            <button type="button" onClick={() => setStep(step - 1)} className={styles.backBtn}>
              Back
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button 
            type="button" 
            onClick={handleSaveAndContinue} 
            className={styles.continueBtn}
            disabled={saving}
          >
            {saving ? <Spinner size="sm" /> : (
              step === 6 ? "Go to Dashboard" : "Save & Continue"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
