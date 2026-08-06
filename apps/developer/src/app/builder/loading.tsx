import { Spinner } from "@unerp/ui";

export default function LoadingPage() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "60vh",
      }}
    >
      <Spinner size="lg" />
    </div>
  );
}
