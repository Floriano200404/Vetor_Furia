'use client';

/**
 * BiometryChart — SVG line chart showing weight evolution over time.
 */

import { useMemo } from 'react';
import type { Biometry } from '../domain/biometry.types';
import styles from './BiometryChart.module.css';

interface BiometryChartProps {
  records: Biometry[];
}

export function BiometryChart({ records }: BiometryChartProps) {
  const data = useMemo(() => {
    // Sort oldest first for the chart
    return [...records]
      .filter(r => r.weight > 0)
      .sort((a, b) => a.measuredAt - b.measuredAt)
      .slice(-20); // Last 20 records max
  }, [records]);

  if (data.length < 2) {
    return (
      <div className={styles.empty}>
        <p>Registre pelo menos 2 medições para ver o gráfico de evolução.</p>
      </div>
    );
  }

  // Chart dimensions
  const width = 600;
  const height = 220;
  const padTop = 24;
  const padBottom = 40;
  const padLeft = 48;
  const padRight = 16;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const weights = data.map(d => d.weight);
  const minW = Math.floor(Math.min(...weights) - 1);
  const maxW = Math.ceil(Math.max(...weights) + 1);
  const rangeW = maxW - minW || 1;

  // Map data to SVG coords
  const points = data.map((d, i) => ({
    x: padLeft + (i / (data.length - 1)) * chartW,
    y: padTop + chartH - ((d.weight - minW) / rangeW) * chartH,
    weight: d.weight,
    date: new Date(d.measuredAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
  }));

  // Build polyline path
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Area fill path
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padTop + chartH} L ${points[0].x} ${padTop + chartH} Z`;

  // Y axis labels (5 ticks)
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const val = minW + (rangeW * i) / 4;
    const y = padTop + chartH - (i / 4) * chartH;
    return { val: Math.round(val * 10) / 10, y };
  });

  return (
    <div className={styles.container}>
      <h4 className={styles.title}>📈 Evolução do Peso</h4>
      <div className={styles.chartWrap}>
        <svg viewBox={`0 0 ${width} ${height}`} className={styles.svg} preserveAspectRatio="xMidYMid meet">
          {/* Grid lines */}
          {yTicks.map((t, i) => (
            <g key={i}>
              <line
                x1={padLeft}
                y1={t.y}
                x2={width - padRight}
                y2={t.y}
                className={styles.gridLine}
              />
              <text x={padLeft - 8} y={t.y + 4} className={styles.yLabel} textAnchor="end">
                {t.val}
              </text>
            </g>
          ))}

          {/* Area fill gradient */}
          <defs>
            <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#weightGrad)" />

          {/* Line */}
          <path d={linePath} className={styles.line} />

          {/* Data points + X labels */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={4} className={styles.dot} />
              <circle cx={p.x} cy={p.y} r={10} className={styles.dotHover}>
                <title>{`${p.date}: ${p.weight} kg`}</title>
              </circle>
              {/* Show X label every N points to avoid clutter */}
              {(data.length <= 8 || i % Math.ceil(data.length / 6) === 0 || i === data.length - 1) && (
                <text x={p.x} y={height - 8} className={styles.xLabel} textAnchor="middle">
                  {p.date}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
