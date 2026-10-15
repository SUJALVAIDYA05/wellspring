import React from "react";

export interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "narrow" | "full";
}

export function PageContainer({
  children,
  className = "",
  size = "default",
}: PageContainerProps) {
  const maxWidth =
    size === "narrow" ? "900px" : size === "full" ? "100%" : "var(--container-max-width)";

  return (
    <div
      className={className}
      style={{
        width: "100%",
        maxWidth,
        marginLeft: "auto",
        marginRight: "auto",
        paddingLeft: "1.5rem",
        paddingRight: "1.5rem",
      }}
    >
      {children}
    </div>
  );
}
