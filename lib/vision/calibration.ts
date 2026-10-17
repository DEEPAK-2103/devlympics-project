// 5-Point Eye-Gaze Calibration Manager
import { CalibrationMatrix } from '../types';

const STORAGE_KEY = 'synapseflow_calibration_v1';

export class CalibrationManager {
  public static loadSavedCalibration(): CalibrationMatrix | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to load saved calibration', e);
    }
    return null;
  }

  public static saveCalibration(matrix: CalibrationMatrix): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(matrix));
    } catch (e) {
      console.warn('Failed to save calibration', e);
    }
  }

  public static clearCalibration(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear calibration', e);
    }
  }

  /**
   * Computes affine normalization matrix from recorded calibration points
   */
  public static computeMatrix(
    centerSamples: { x: number; y: number }[],
    topLeftSamples: { x: number; y: number }[],
    topRightSamples: { x: number; y: number }[],
    bottomLeftSamples: { x: number; y: number }[],
    bottomRightSamples: { x: number; y: number }[]
  ): CalibrationMatrix {
    const avg = (samples: { x: number; y: number }[]) => {
      if (!samples.length) return { x: 0.5, y: 0.5 };
      const sum = samples.reduce((acc, s) => ({ x: acc.x + s.x, y: acc.y + s.y }), { x: 0, y: 0 });
      return { x: sum.x / samples.length, y: sum.y / samples.length };
    };

    const c = avg(centerSamples);
    const tl = avg(topLeftSamples);
    const tr = avg(topRightSamples);
    const bl = avg(bottomLeftSamples);
    const br = avg(bottomRightSamples);

    // Compute range based on spread from corners
    const leftX = (tl.x + bl.x) / 2;
    const rightX = (tr.x + br.x) / 2;
    const topY = (tl.y + tr.y) / 2;
    const bottomY = (bl.y + br.y) / 2;

    const rangeX = Math.max(0.05, Math.abs(rightX - leftX) / 2);
    const rangeY = Math.max(0.04, Math.abs(bottomY - topY) / 2);

    const matrix: CalibrationMatrix = {
      isCalibrated: true,
      centerX: c.x,
      centerY: c.y,
      rangeX,
      rangeY,
      timestamp: Date.now(),
    };

    this.saveCalibration(matrix);
    return matrix;
  }
}
