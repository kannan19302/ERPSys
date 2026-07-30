// @ts-nocheck
"use client";
import React, { useState } from "react";
import { PageHeader, Button, Card, FormField, Input, Select } from "@unerp/ui";
import { Cpu, Send } from "lucide-react";

export default function MachineTranslationPage() {
  const [sourceText, setSourceText] = useState("");
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("es");
  const [translated, setTranslated] = useState("");

  const handleTranslate = async () => {
    setTranslated(`[MT preview] "${sourceText}" → ${targetLang}`);
  };

  return (
    <div>
      <PageHeader
        title="Machine Translation"
        description="AI-powered translation"
      />
      <div className="ui-card" style={{ maxWidth: "800px" }}>
        <div className="ui-form-group">
          <FormField label="Source Language">
            <Select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="zh">Chinese</option>
            </Select>
          </FormField>
          <FormField label="Target Language">
            <Select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
            >
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="zh">Chinese</option>
              <option value="ar">Arabic</option>
            </Select>
          </FormField>
          <FormField label="Source Text">
            <Input
              type="text"
              placeholder="Enter text to translate..."
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
            />
          </FormField>
          <div className="ui-flex" style={{ justifyContent: "flex-end" }}>
            <Button leftIcon={<Send size={14} />} onClick={handleTranslate}>
              Translate
            </Button>
          </div>
        </div>
        {translated && (
          <div style={{ marginTop: "var(--space-4)" }}>
            <Card className="ui-card" style={{ padding: "var(--space-4)" }}>
              <p>{translated}</p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
