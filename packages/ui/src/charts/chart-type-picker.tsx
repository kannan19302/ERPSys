"use client";

import React, { useState } from "react";

// ─────────────────────────────────────────────────
// Chart Type Picker — compact dropdown for swapping chart types
// ─────────────────────────────────────────────────

export type ChartType =
  | "bar"
  | "line"
  | "area"
  | "pie"
  | "donut"
  | "radar"
  | "stacked-bar"
  | "composed"
  | "funnel";

export interface ChartTypeOption {
  type: ChartType;
  label: string;
  icon: string; // emoji for simplicity, no extra icon dep
}

const DEFAULT_OPTIONS: ChartTypeOption[] = [
  { type: "bar", label: "Bar Chart", icon: "📊" },
  { type: "line", label: "Line Chart", icon: "📈" },
  { type: "area", label: "Area Chart", icon: "📉" },
  { type: "pie", label: "Pie Chart", icon: "🥧" },
  { type: "donut", label: "Donut Chart", icon: "🍩" },
  { type: "stacked-bar", label: "Stacked Bar", icon: "📶" },
  { type: "radar", label: "Radar Chart", icon: "🎯" },
];

export interface ChartTypePickerProps {
  value: ChartType;
  onChange: (type: ChartType) => void;
  options?: ChartTypeOption[];
}

export const ChartTypePicker: React.FC<ChartTypePickerProps> = ({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find((o) => o.type === value) || options[0];

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          background: "var(--color-bg-elevated)",
          color: "var(--color-text-secondary)",
          fontSize: "var(--text-xs)",
          cursor: "pointer",
          whiteSpace: "nowrap",
          transition: "border-color var(--duration-fast)",
          lineHeight: 1,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--color-primary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--color-border)";
        }}
      >
        <span style={{ flexShrink: 0 }}>{selected?.icon}</span>
        <span style={{ whiteSpace: "nowrap" }}>{selected?.label}</span>
        <span style={{ fontSize: "8px", marginLeft: "2px", flexShrink: 0 }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close on outside click */}
          <div
            onClick={() => setIsOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 99 }}
          />
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: "var(--space-1)",
              background: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-lg)",
              zIndex: 100,
              minWidth: "160px",
              padding: "var(--space-1)",
              animation: "fadeInUp 0.15s ease-out",
            }}
          >
            {options.map((opt) => (
              <button
                key={opt.type}
                type="button"
                onClick={() => {
                  onChange(opt.type);
                  setIsOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  width: "100%",
                  padding: "var(--space-2) var(--space-3)",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  background:
                    opt.type === value
                      ? "var(--color-primary-light)"
                      : "transparent",
                  color:
                    opt.type === value
                      ? "var(--color-primary)"
                      : "var(--color-text)",
                  fontSize: "var(--text-sm)",
                  cursor: "pointer",
                  textAlign: "left",
                  fontWeight:
                    opt.type === value ? "var(--weight-semibold)" : "normal",
                  transition: "background var(--duration-fast)",
                }}
                onMouseEnter={(e) => {
                  if (opt.type !== value)
                    e.currentTarget.style.background = "var(--color-bg-sunken)";
                }}
                onMouseLeave={(e) => {
                  if (opt.type !== value)
                    e.currentTarget.style.background = "transparent";
                }}
              >
                <span>{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
