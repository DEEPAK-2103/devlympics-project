// Robust Eye Aspect Ratio (EAR) & Iris Tracking with Adaptive EMA Filter
import { GazeCoords, CalibrationMatrix } from '../types';
import { OneEuroFilter2D } from './oneEuroFilter';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

export function distance2D(p1: Point3D, p2: Point3D): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

export class IrisGazeEngine {
  private prevX = 0;
  private prevY = 0;
  private blinkStartTime: number | null = null;
  private isCurrentlyBlinking = false;
  private oneEuro = new OneEuroFilter2D(1.2, 0.009, 1.0);
  private calibration: CalibrationMatrix = {
    isCalibrated: false,
    centerX: 0.5,
    centerY: 0.5,
    rangeX: 0.15,
    rangeY: 0.15,
    timestamp: 0,
  };

  public setCalibration(matrix: CalibrationMatrix) {
    this.calibration = matrix;
  }

  public getCalibration(): CalibrationMatrix {
    return this.calibration;
  }

  /**
   * Computes Eye Aspect Ratio (EAR) to detect natural blinks vs prolonged closure
   */
  public calculateEAR(landmarks: Point3D[]): number {
    if (!landmarks || landmarks.length < 478) return 0.3;

    // Left eye landmarks: 33, 160, 158, 133, 153, 144
    const l1 = landmarks[33];
    const l2 = landmarks[160];
    const l3 = landmarks[158];
    const l4 = landmarks[133];
    const l5 = landmarks[153];
    const l6 = landmarks[144];

    const leftDistV1 = distance2D(l2, l6);
    const leftDistV2 = distance2D(l3, l5);
    const leftDistH = distance2D(l1, l4);
    const leftEar = (leftDistV1 + leftDistV2) / (2.0 * Math.max(leftDistH, 0.0001));

    // Right eye landmarks: 263, 385, 387, 362, 373, 380
    const r1 = landmarks[263];
    const r2 = landmarks[385];
    const r3 = landmarks[387];
    const r4 = landmarks[362];
    const r5 = landmarks[373];
    const r6 = landmarks[380];

    const rightDistV1 = distance2D(r2, r6);
    const rightDistV2 = distance2D(r3, r5);
    const rightDistH = distance2D(r1, r4);
    const rightEar = (rightDistV1 + rightDistV2) / (2.0 * Math.max(rightDistH, 0.0001));

    return (leftEar + rightEar) / 2.0;
  }

  /**
   * Extracts raw iris displacement relative to eye boundaries
   */
  public extractRawIrisRatio(landmarks: Point3D[]): { x: number; y: number } {
    if (!landmarks || landmarks.length < 478) return { x: 0.5, y: 0.5 };

    // Left eye corners: 33 (outer), 133 (inner)
    // Left iris center: 468
    const leftIris = landmarks[468];
    const leftEyeCornerOuter = landmarks[33];
    const leftEyeCornerInner = landmarks[133];
    const leftEyeTop = landmarks[159];
    const leftEyeBottom = landmarks[145];

    const leftWidth = Math.abs(leftEyeCornerInner.x - leftEyeCornerOuter.x);
    const leftHeight = Math.abs(leftEyeBottom.y - leftEyeTop.y);

    const leftRatioX = leftWidth > 0 ? (leftIris.x - Math.min(leftEyeCornerOuter.x, leftEyeCornerInner.x)) / leftWidth : 0.5;
    const leftRatioY = leftHeight > 0 ? (leftIris.y - leftEyeTop.y) / leftHeight : 0.5;

    // Right eye corners: 362 (inner), 263 (outer)
    // Right iris center: 473
    const rightIris = landmarks[473];
    const rightEyeCornerInner = landmarks[362];
    const rightEyeCornerOuter = landmarks[263];
    const rightEyeTop = landmarks[386];
    const rightEyeBottom = landmarks[374];

    const rightWidth = Math.abs(rightEyeCornerOuter.x - rightEyeCornerInner.x);
    const rightHeight = Math.abs(rightEyeBottom.y - rightEyeTop.y);

    const rightRatioX = rightWidth > 0 ? (rightIris.x - Math.min(rightEyeCornerInner.x, rightEyeCornerOuter.x)) / rightWidth : 0.5;
    const rightRatioY = rightHeight > 0 ? (rightIris.y - rightEyeTop.y) / rightHeight : 0.5;

    // Average both eyes for robust estimation
    const avgX = (leftRatioX + rightRatioX) / 2.0;
    const avgY = (leftRatioY + rightRatioY) / 2.0;

    return { x: avgX, y: avgY };
  }

  /**
   * Process landmarks and return normalized screen gaze coordinates (-1 to 1)
   */
  public processFrame(landmarks: Point3D[], blinkThreshold = 0.20, prolongedBlinkThresholdMs = 800): GazeCoords {
    const ear = this.calculateEAR(landmarks);
    const now = Date.now();

    const isBlinkingNow = ear < blinkThreshold;
    let isProlongedBlink = false;

    if (isBlinkingNow) {
      if (!this.isCurrentlyBlinking) {
        this.isCurrentlyBlinking = true;
        this.blinkStartTime = now;
      } else if (this.blinkStartTime && (now - this.blinkStartTime > prolongedBlinkThresholdMs)) {
        isProlongedBlink = true;
      }
    } else {
      this.isCurrentlyBlinking = false;
      this.blinkStartTime = null;
    }

    const raw = this.extractRawIrisRatio(landmarks);

    // Apply Calibration Mapping to [-1, 1] range
    let normX = 0;
    let normY = 0;

    if (this.calibration.isCalibrated) {
      // In mirrored webcam: looking left means iris moves right in frame coordinates
      const deltaX = -(raw.x - this.calibration.centerX);
      const deltaY = raw.y - this.calibration.centerY;

      normX = Math.max(-1, Math.min(1, deltaX / (this.calibration.rangeX || 0.12)));
      const sensitivityY = (this.calibration.rangeY || 0.10) * 0.7; // Vertical eye movement has smaller range
      normY = Math.max(-1, Math.min(1, deltaY / sensitivityY));
    } else {
      // Default heuristic calibration
      const defaultCenterX = 0.5;
      const defaultCenterY = 0.45;
      const defaultSpan = 0.12;

      normX = Math.max(-1, Math.min(1, -(raw.x - defaultCenterX) / defaultSpan));
      normY = Math.max(-1, Math.min(1, (raw.y - defaultCenterY) / (defaultSpan * 0.8)));
    }

    // 1€ Filter (One Euro Filter) combined with velocity-aware smoothing
    // Eliminates micro-nystagmus and jitter during fixation with zero lag during saccades
    const filtered = this.oneEuro.filter(normX, normY, now);
    const smoothX = filtered.x;
    const smoothY = filtered.y;

    this.prevX = smoothX;
    this.prevY = smoothY;

    return {
      x: smoothX,
      y: smoothY,
      rawLeftIris: { x: landmarks[468]?.x ?? 0, y: landmarks[468]?.y ?? 0 },
      rawRightIris: { x: landmarks[473]?.x ?? 0, y: landmarks[473]?.y ?? 0 },
      ear,
      isBlinking: isBlinkingNow,
      isProlongedBlink,
      confidence: landmarks.length >= 478 ? 0.95 : 0.3,
    };
  }

  /**
   * Determine which quadrant (0: Top, 1: Right, 2: Bottom, 3: Left) or null (deadzone)
   */
  public getGazeQuadrant(x: number, y: number, deadzoneRadius = 0.28): 0 | 1 | 2 | 3 | null {
    const distFromCenter = Math.sqrt(x * x + y * y);
    if (distFromCenter < deadzoneRadius) {
      return null; // Inside deadzone (resting center)
    }

    // Angle in degrees from positive X axis (0 to 360)
    // Note: y is positive downwards
    let angleRad = Math.atan2(y, x); // -PI to +PI
    if (angleRad < 0) angleRad += 2 * Math.PI;
    const deg = (angleRad * 180) / Math.PI;

    // 4 Quadrants:
    // Top: 225 deg to 315 deg (negative Y) -> Quadrant 0
    // Right: 315 deg to 45 deg (positive X) -> Quadrant 1
    // Bottom: 45 deg to 135 deg (positive Y) -> Quadrant 2
    // Left: 135 deg to 225 deg (negative X) -> Quadrant 3
    if (deg >= 225 && deg < 315) {
      return 0; // Top
    } else if (deg >= 315 || deg < 45) {
      return 1; // Right
    } else if (deg >= 45 && deg < 135) {
      return 2; // Bottom
    } else {
      return 3; // Left
    }
  }
}
