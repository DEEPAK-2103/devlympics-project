export type ToneType = 'professional' | 'direct' | 'casual';

export interface QuadrantOption {
  id: string;
  quadrant: 0 | 1 | 2 | 3; // 0: Top, 1: Right, 2: Bottom, 3: Left
  title: string;
  shortLabel: string;
  category: 'action' | 'status' | 'conversational' | 'contextual';
  intentToken: string;
  previewText?: string;
  iconName?: string;
}

export interface GazeCoords {
  x: number; // -1 (left) to 1 (right)
  y: number; // -1 (top) to 1 (bottom)
  rawLeftIris: { x: number; y: number };
  rawRightIris: { x: number; y: number };
  ear: number; // Eye Aspect Ratio
  isBlinking: boolean;
  isProlongedBlink: boolean;
  confidence: number;
}

export interface CalibrationPoint {
  name: 'center' | 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';
  targetX: number; // -1 to 1
  targetY: number; // -1 to 1
  samples: { x: number; y: number }[];
}

export interface CalibrationMatrix {
  isCalibrated: boolean;
  centerX: number;
  centerY: number;
  rangeX: number;
  rangeY: number;
  timestamp: number;
}

export interface MeetingTranscriptEntry {
  id: string;
  speaker: string;
  avatarColor: string;
  role: string;
  text: string;
  timestamp: string;
  isUser?: boolean;
}

export interface DynamicHUDState {
  activeQuadrant: number | null; // 0, 1, 2, 3 or null
  dwellProgress: number; // 0 to 1
  dwellTimeMs: number;
  isFloorReserved: boolean;
  cancelGuardTriggered: boolean;
  tone: ToneType;
  options: QuadrantOption[];
}

export interface VoiceProfile {
  userName: string;
  role: string;
  techStack: string;
  selectedVoice: string;
  speechPitch: number;
  speechRate: number;
}

export type GestureType = 'nod' | 'shake' | 'browRaise';

export interface GestureDiagnostics {
  headPitch: number;
  headYaw: number;
  browRatio: number;
  isNodding: boolean;
  isShaking: boolean;
  isBrowRaised: boolean;
  lastGesture?: GestureType;
  lastGestureTimestamp?: number;
}

