import React, { useEffect, useRef, useCallback } from 'react';
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
  const domRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const optionRef = useRef(option);
  const idRef = useRef<string>(`ec-canvas-${++instanceCounter}`);

  optionRef.current = option;

  const initChart = useCallback(() => {
    if (chartRef.current) return;
    if (!domRef.current) return;

    try {
      const chart = echarts.init(domRef.current);
      chartRef.current = chart;
      chart.setOption(optionRef.current);
    } catch (e) {
      console.error('[EcCanvas] init failed:', e);
    }
  }, []);

  const refCallback = useCallback((node: HTMLDivElement | null) => {
    domRef.current = node;
    if (node) {
      setTimeout(() => {
        initChart();
      }, 50);
    }
  }, [initChart]);

  useEffect(() => {
    if (chartRef.current && option && Object.keys(option).length > 0) {
      try {
        chartRef.current.setOption(option, { notMerge: true });
      } catch (e) {
        console.error('[EcCanvas] setOption failed:', e);
      }
    }
  }, [option]);

  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        try {
          chartRef.current.resize();
        } catch (_) {}
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        try {
          chartRef.current.dispose();
        } catch (_) {}
        chartRef.current = null;
      }
    };
  }, []);

  return (
    <View
      className={styles.container}
      id={idRef.current}
      ref={refCallback}
      style={{ height: `${height}px` }}
    />
  );
};

export default EcCanvas;
