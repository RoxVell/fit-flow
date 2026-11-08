export const chartAxisProps = {
  tick: { fontSize: 10 },
  stroke: "var(--color-muted-foreground)",
};

export const chartGridProps = {
  strokeDasharray: "3 3",
  stroke: "var(--color-muted)",
};

export const chartTooltipProps = {
  wrapperStyle: { outline: "none" },
  contentStyle: {
    backgroundColor: "var(--color-popover)",
    border: "1px solid var(--color-border)",
    borderRadius: "8px",
    fontSize: "12px",
    color: "var(--color-popover-foreground)",
  },
  cursor: { stroke: "var(--color-border)", strokeWidth: 1 },
};
