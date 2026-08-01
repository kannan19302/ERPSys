"use client";
import { GitBranch } from "lucide-react";
import {
  WorkflowTabLayout,
  WORKFLOW_TABS,
} from "@/components/workflow/WorkflowTabLayout";

export default function WorkflowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkflowTabLayout
      tabs={WORKFLOW_TABS}
      moduleId="workflow"
      moduleLabel="Workflow"
      moduleIcon={GitBranch}
      moduleDescription="Workflow definitions, instances, and task management"
    >
      {children}
    </WorkflowTabLayout>
  );
}
