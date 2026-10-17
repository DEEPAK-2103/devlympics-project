// Multi-Modal Head Gesture & Facial Action Unit (AU) Tracker
// Tracks Head Nod (Yes), Head Shake (No), Brow Raise (Attention Beacon)
import { distance2D } from './irisTracker';

export interface GestureState {
  headPitch: number; // Vertical tilt (nod)
  headYaw: number;   // Horizontal turn (shake)
  browRaise: number; // Eyebrow raise distance
  isNodding: boolean;
  isShaking: boolean;
  isBrowRaised: boolean;
}

export class GestureEngine {
  private pitchHistory: number[] = [];
  private yawHistory: number[] = [];
  private baselineBrowDistance: number | null = null;

  public processGestures(landmarks: any[]): GestureState {
    if (!landmarks || landmarks.length < 478) {
      return {
        headPitch: 0,
        headYaw: 0,
        browRaise: 0,
        isNodding: false,
        isShaking: false,
        isBrowRaised: false,
      };
    }

    // Key facial anchor landmarks:
    // 1: Nose tip
    // 10: Forehead top
    // 152: Chin bottom
    // 234: Left face edge (ear)
    // 454: Right face edge (ear)
    // 70: Left eyebrow mid
    // 300: Right eyebrow mid
    // 159, 386: Eye upper eyelids
    const nose = landmarks[1];
    const forehead = landmarks[10];
    const chin = landmarks[152];
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];

    // Compute Head Pitch (vertical angle relative to facial height)
    const faceHeight = Math.max(0.001, chin.y - forehead.y);
    const noseRelativeY = (nose.y - forehead.y) / faceHeight;
    const pitch = (noseRelativeY - 0.6) * 100; // Normalised pitch

    // Compute Head Yaw (horizontal rotation relative to face width)
    const faceWidth = Math.max(0.001, rightCheek.x - leftCheek.x);
    const noseRelativeX = (nose.x - leftCheek.x) / faceWidth;
    const yaw = (noseRelativeX - 0.5) * 100; // Normalised yaw

    // Track Eyebrow Raise (Distance between eyebrows and upper eyelids)
    const leftBrow = landmarks[70];
    const rightBrow = landmarks[300];
    const leftEyelid = landmarks[159];
    const rightEyelid = landmarks[386];

    const currentBrowDist =
      (Math.abs(leftBrow.y - leftEyelid.y) + Math.abs(rightBrow.y - rightEyelid.y)) / 2;

    if (this.baselineBrowDistance === null) {
      this.baselineBrowDistance = currentBrowDist;
    }

    const browRatio = this.baselineBrowDistance > 0 ? currentBrowDist / this.baselineBrowDistance : 1.0;
    const isBrowRaised = browRatio > 1.35;

    // Rolling History for oscillatory gesture detection
    this.pitchHistory.push(pitch);
    this.yawHistory.push(yaw);
    if (this.pitchHistory.length > 20) this.pitchHistory.shift();
    if (this.yawHistory.length > 20) this.yawHistory.shift();

    // Nod Detection: Look for sinusoidal vertical motion (amplitude > 8 over 15 frames)
    const minPitch = Math.min(...this.pitchHistory);
    const maxPitch = Math.max(...this.pitchHistory);
    const pitchDelta = maxPitch - minPitch;
    const isNodding = pitchDelta > 14 && this.pitchHistory.length >= 15;

    // Shake Detection: Look for sinusoidal horizontal motion (amplitude > 12 over 15 frames)
    const minYaw = Math.min(...this.yawHistory);
    const maxYaw = Math.max(...this.yawHistory);
    const yawDelta = maxYaw - minYaw;
    const isShaking = yawDelta > 18 && this.yawHistory.length >= 15;

    return {
      headPitch: pitch,
      headYaw: yaw,
      browRaise: browRatio,
      isNodding,
      isShaking,
      isBrowRaised,
    };
  }
}
