import { useEffect, useRef, useState } from "react";

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  className?: string;
}

export default function DonutChart({ data, size = 160, className = "" }: DonutChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(!document.documentElement.classList.contains("light"));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const total = data.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) return;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;
    const innerRadius = radius * 0.65;

    ctx.clearRect(0, 0, size, size);

    let startAngle = -Math.PI / 2;

    data.forEach((segment) => {
      if (segment.value === 0) return;
      const sliceAngle = (segment.value / total) * 2 * Math.PI;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();

      ctx.fillStyle = segment.color;
      ctx.fill();

      startAngle += sliceAngle;
    });

    ctx.fillStyle = isDark ? "#0B0F1A" : "#F8FAFC";
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius - 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isDark ? "#E2E8F0" : "#1E293B";
    ctx.font = `bold ${size / 8}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(total.toString(), centerX, centerY);

    ctx.fillStyle = isDark ? "#64748B" : "#94A3B8";
    ctx.font = `${size / 14}px sans-serif`;
    ctx.fillText("Total", centerX, centerY + size / 10);
  }, [data, size, isDark]);

  return (
    <canvas ref={canvasRef} width={size} height={size} className={className} />
  );
}
