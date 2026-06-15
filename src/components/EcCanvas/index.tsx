import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { LineChart, ScatterChart, BarChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  LegendComponent,
  MarkLineComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { View } from '@tarojs/components';
import styles from './index.module.scss';

echarts.use([
  LineChart,
  ScatterChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  LegendComponent,
  MarkLineComponent,
  CanvasRenderer,
]);

let instanceCounter = 0;

interface EcCanvasProps {
  option: Record<string, unknown>;
  height?: number;
}

const EcCanvas: React.FC<EcCanvasProps> = ({ option, height = 300 }) => {
  const idRef = useRef<string>(`ec-canvas-${++instanceCounter}`);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    const dom = document.getElementById(idRef.current);
    if (!dom) return;

    const chart = echarts.init(dom);
    chartRef.current = chart;
    chart.setOption(option);

    const handleResize = () => {
      chart.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.setOption(option, { notMerge: true });
    }
  }, [option]);

  return (
    <View
      className={styles.container}
      id={idRef.current}
      style={{ height: `${height}px` }}
    />
  );
};

export default EcCanvas;
