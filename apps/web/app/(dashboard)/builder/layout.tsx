"use client";

export const dynamic = "force-dynamic";
import React from "react";
import StudioCommandPalette from "../../../src/components/builder/StudioCommandPalette";
import { StudioAutoBreadcrumb } from "../../../src/components/builder/StudioBreadcrumb";

export default function BuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StudioAutoBreadcrumb />
      {children}
      <StudioCommandPalette />
    </>
  );
}
