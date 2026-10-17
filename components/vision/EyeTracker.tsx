'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GazeCoords, CalibrationMatrix, GestureType, GestureDiagnostics } from '@/lib/types';
import { IrisGazeEngine } from '@/lib/vision/irisTracker';
import { CalibrationManager } from '@/lib/vision/calibration';
import { GestureEngine } from '@/lib/vision/gestureTracker';
import CalibrationModal from './CalibrationModal';
import {
  Camera,
  Eye,
  Sliders,
  AlertCircle,
  RefreshCw,
  MousePointer,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Smile,
} from 'lucide-react';

interface Props {
  onGazeUpdate: (coords: GazeCoords, quadrant: 0 | 1 | 2 | 3 | null) => void;
  onProlongedBlink?: () => void;
  onGesture?: (gesture: GestureType) => void;
  onRawGazeSample?: (raw: { x: number; y: number }) => void;
  isSimulatingMouse?: boolean;
  onToggleMouseSimulation?: () => void;
  externalCalibrationTrigger?: boolean;
  onCalibrationComplete?: (matrix: CalibrationMatrix) => void;
}

export default function EyeTracker({
  onGazeUpdate,
  onProlongedBlink,
  onGesture,
  onRawGazeSample,
  isSimulatingMouse = false,
  onToggleMouseSimulation,
  externalCalibrationTrigger,
  onCalibrationComplete,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<IrisGazeEngine>(new IrisGazeEngine());
  const gestureEngineRef = useRef<GestureEngine>(new GestureEngine());

  const [isLoading, setIsLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const [currentEar, setCurrentEar] = useState(0.28);
  const [isBlinking, setIsBlinking] = useState(false);
  const [calibrationModalOpen, setCalibrationModalOpen] = useState(false);
  const [calibrationMatrix, setCalibrationMatrix] = useState<CalibrationMatrix | null>(null);
  const [rawGazeSample, setRawGazeSample] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });

  // Gesture Diagnostics state
  const [gesturesEnabled, setGesturesEnabled] = useState(true);
  const [gestureDiagnostics, setGestureDiagnostics] = useState<GestureDiagnostics>({
    headPitch: 0,
    headYaw: 0,
    browRatio: 1.0,
    isNodding: false,
    isShaking: false,
    isBrowRaised: false,
  });
  const [activeGestureToast, setActiveGestureToast] = useState<{
    type: GestureType;
    label: string;
    sublabel: string;
    color: string;
  } | null>(null);

  // Watch for external calibration open requests
  useEffect(() => {
    if (externalCalibrationTrigger) {
      setCalibrationModalOpen(true);
    }
  }, [externalCalibrationTrigger]);

  // Load saved calibration on mount
  useEffect(() => {
    const saved = CalibrationManager.loadSavedCalibration();
    if (saved) {
      setCalibrationMatrix(saved);
      engineRef.current.setCalibration(saved);
    }
  }, []);

  // Handle Mouse Simulation mode when active
  useEffect(() => {
    if (!isSimulatingMouse) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Map screen coords to [-1, 1]
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;

      const quadrant = engineRef.current.getGazeQuadrant(nx, ny);
      const coords: GazeCoords = {
        x: nx,
        y: ny,
        rawLeftIris: { x: 0.5, y: 0.5 },
        rawRightIris: { x: 0.5, y: 0.5 },
        ear: 0.28,
        isBlinking: false,
        isProlongedBlink: false,
        confidence: 1.0,
      };

      onGazeUpdate(coords, quadrant);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isSimulatingMouse, onGazeUpdate]);

  // Initialize MediaPipe and Webcam
  useEffect(() => {
    let landmarker: any = null;
    let animFrameId: number;
    let stream: MediaStream | null = null;
    let frameCount = 0;
    let lastTime = performance.now();

    async function initVision() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const visionModule = await import('@mediapipe/tasks-vision');
        const { FaceLandmarker, FilesetResolver } = visionModule;

        const fileset = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
        );

        landmarker = await FaceLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          outputFaceBlendshapes: false,
          runningMode: 'VIDEO',
          numFaces: 1,
        });

        // Request webcam
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraActive(true);
          setIsLoading(false);
          startLoop();
        }
      } catch (err: any) {
        console.error('Vision initialization error:', err);
        setErrorMessage(err.message || 'Could not access webcam or load vision models.');
        setIsLoading(false);
      }
    }

    function startLoop() {
      function render() {
        if (!videoRef.current || !canvasRef.current || !landmarker) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (video.readyState >= 2 && ctx) {
          const now = performance.now();
          const results = landmarker.detectForVideo(video, now);

          // Calculate FPS
          frameCount++;
          if (now - lastTime >= 1000) {
            setFps(frameCount);
            frameCount = 0;
            lastTime = now;
          }

          // Clear Canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (results && results.faceLandmarks && results.faceLandmarks.length > 0) {
            const landmarks = results.faceLandmarks[0];

            // 1. Process Iris Gaze with engine
            const coords = engineRef.current.processFrame(landmarks);
            const quadrant = engineRef.current.getGazeQuadrant(coords.x, coords.y);

            setCurrentEar(coords.ear);
            setIsBlinking(coords.isBlinking);

            // Save raw sample for calibration
            const rawRatio = engineRef.current.extractRawIrisRatio(landmarks);
            setRawGazeSample(rawRatio);
            if (onRawGazeSample) {
              onRawGazeSample(rawRatio);
            }

            if (coords.isProlongedBlink && onProlongedBlink) {
              onProlongedBlink();
            }

            if (!isSimulatingMouse) {
              onGazeUpdate(coords, quadrant);
            }

            // 2. Process Multi-Modal Facial Gestures
            if (gesturesEnabled) {
              const diag = gestureEngineRef.current.processGestures(landmarks);
              setGestureDiagnostics(diag);

              if (diag.isBrowRaised) {
                setActiveGestureToast({
                  type: 'browRaise',
                  label: 'Brow Raise Detected',
                  sublabel: 'Reserving Meeting Floor Beacon',
                  color: 'border-cyan-400 bg-cyan-950/90 text-cyan-200',
                });
                onGesture?.('browRaise');
                setTimeout(() => setActiveGestureToast(null), 1500);
              } else if (diag.isNodding) {
                setActiveGestureToast({
                  type: 'nod',
                  label: 'Head Nod Detected',
                  sublabel: 'Quick Affirmation Dispatched',
                  color: 'border-emerald-400 bg-emerald-950/90 text-emerald-200',
                });
                onGesture?.('nod');
                setTimeout(() => setActiveGestureToast(null), 1500);
              } else if (diag.isShaking) {
                setActiveGestureToast({
                  type: 'shake',
                  label: 'Head Shake Detected',
                  sublabel: 'Soft Hold / Selection Aborted',
                  color: 'border-amber-400 bg-amber-950/90 text-amber-200',
                });
                onGesture?.('shake');
                setTimeout(() => setActiveGestureToast(null), 1500);
              }
            }

            // Draw eye mesh & irises on canvas
            drawEyeLandmarks(ctx, canvas, landmarks, coords);
          }
        }

        animFrameId = requestAnimationFrame(render);
      }

      animFrameId = requestAnimationFrame(render);
    }

    function drawEyeLandmarks(
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      landmarks: any[],
      coords: GazeCoords
    ) {
      const w = canvas.width;
      const h = canvas.height;

      // Draw Left Eye Contour (indices: 33, 160, 158, 133, 153, 144)
      const leftEyeIndices = [33, 160, 158, 133, 153, 144, 33];
      ctx.beginPath();
      ctx.strokeStyle = coords.isBlinking ? '#ef4444' : '#06b6d4';
      ctx.lineWidth = 1.5;
      leftEyeIndices.forEach((idx, i) => {
        const pt = landmarks[idx];
        if (i === 0) ctx.moveTo(pt.x * w, pt.y * h);
        else ctx.lineTo(pt.x * w, pt.y * h);
      });
      ctx.stroke();

      // Draw Right Eye Contour (indices: 263, 385, 387, 362, 373, 380)
      const rightEyeIndices = [263, 385, 387, 362, 373, 380, 263];
      ctx.beginPath();
      ctx.strokeStyle = coords.isBlinking ? '#ef4444' : '#06b6d4';
      ctx.lineWidth = 1.5;
      rightEyeIndices.forEach((idx, i) => {
        const pt = landmarks[idx];
        if (i === 0) ctx.moveTo(pt.x * w, pt.y * h);
        else ctx.lineTo(pt.x * w, pt.y * h);
      });
      ctx.stroke();

      // Draw Iris Centers (468, 473)
      const leftIris = landmarks[468];
      const rightIris = landmarks[473];

      if (leftIris && rightIris) {
        // Left Iris
        ctx.beginPath();
        ctx.arc(leftIris.x * w, leftIris.y * h, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();

        // Right Iris
        ctx.beginPath();
        ctx.arc(rightIris.x * w, rightIris.y * h, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
      }
    }

    initVision();

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (landmarker) {
        landmarker.close();
      }
    };
  }, [isSimulatingMouse, onGazeUpdate, onProlongedBlink, onGesture, onRawGazeSample, gesturesEnabled]);

  const handleCalibrationComplete = useCallback(
    (matrix: CalibrationMatrix) => {
      setCalibrationMatrix(matrix);
      engineRef.current.setCalibration(matrix);
      if (onCalibrationComplete) {
        onCalibrationComplete(matrix);
      }
    },
    [onCalibrationComplete]
  );

  return (
    <div className="relative rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-xl group">
      {/* Video & Canvas Stream */}
      <div className="relative aspect-video w-full max-w-sm bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          playsInline
          muted
          className="w-full h-full object-cover -scale-x-100 opacity-80"
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="absolute inset-0 w-full h-full -scale-x-100 pointer-events-none"
        />

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/90 text-white gap-3 p-4 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></div>
            <p className="text-xs text-neutral-300 font-medium">
              Initializing MediaPipe 478-Landmark Vision Engine...
            </p>
          </div>
        )}

        {/* Error Fallback */}
        {errorMessage && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/95 text-white gap-2 p-4 text-center">
            <AlertCircle className="w-7 h-7 text-amber-400" />
            <p className="text-xs text-amber-200 font-semibold">Webcam Not Detected</p>
            <p className="text-[11px] text-neutral-400 max-w-xs">{errorMessage}</p>
            <button
              onClick={onToggleMouseSimulation}
              className="mt-2 py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-medium text-white flex items-center gap-1.5 transition"
            >
              <MousePointer className="w-3.5 h-3.5" /> Enable Cursor Simulation Mode
            </button>
          </div>
        )}

        {/* Mouse Simulation Watermark */}
        {isSimulatingMouse && (
          <div className="absolute top-2 left-2 bg-purple-500/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-semibold text-white flex items-center gap-1.5 border border-purple-400/30">
            <MousePointer className="w-3 h-3 animate-pulse" /> CURSOR SIMULATION MODE
          </div>
        )}

        {/* Live Diagnostics Pills */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end pointer-events-none">
          <div className="bg-neutral-900/85 backdrop-blur-md border border-neutral-700/60 rounded px-2 py-0.5 text-[10px] font-mono text-neutral-300 flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                cameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            ></span>
            {fps} FPS
          </div>
          <div className="bg-neutral-900/85 backdrop-blur-md border border-neutral-700/60 rounded px-2 py-0.5 text-[10px] font-mono text-neutral-300">
            EAR:{' '}
            <span className={currentEar < 0.2 ? 'text-red-400 font-bold' : 'text-cyan-400'}>
              {currentEar.toFixed(2)}
            </span>
          </div>
          {gesturesEnabled && cameraActive && (
            <div className="bg-neutral-900/85 backdrop-blur-md border border-neutral-700/60 rounded px-2 py-0.5 text-[10px] font-mono text-neutral-300 flex items-center gap-1">
              <span>Pose:</span>
              <span className="text-cyan-400">{gestureDiagnostics.headPitch > 0 ? `+${gestureDiagnostics.headPitch}` : gestureDiagnostics.headPitch}°</span>
              <span className="text-neutral-500">|</span>
              <span className="text-purple-400">Brow: {gestureDiagnostics.browRatio}x</span>
            </div>
          )}
        </div>

        {/* Active Gesture Trigger Toast */}
        {activeGestureToast && (
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border px-3.5 py-2 rounded-xl flex items-center gap-2.5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 z-20 ${activeGestureToast.color}`}
          >
            <Sparkles className="w-4 h-4 shrink-0 animate-spin" />
            <div>
              <p className="text-xs font-bold leading-tight">{activeGestureToast.label}</p>
              <p className="text-[10px] opacity-80">{activeGestureToast.sublabel}</p>
            </div>
          </div>
        )}

        {/* Prolonged Blink Alert */}
        {isBlinking && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-red-500/90 text-white text-[11px] font-medium px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse shadow-lg z-10">
            <ShieldAlert className="w-3.5 h-3.5" /> Blink Detected
          </div>
        )}
      </div>

      {/* Control Toolbar */}
      <div className="p-3 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-neutral-300">
          <Eye className="w-4 h-4 text-cyan-400" />
          <span className="font-medium text-neutral-200">Zero-Hardware Gaze</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded ${
              calibrationMatrix
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            {calibrationMatrix ? 'Calibrated' : 'Auto Default'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Facial Gestures Toggle */}
          <button
            onClick={() => setGesturesEnabled(!gesturesEnabled)}
            title={gesturesEnabled ? 'Facial Gestures Active (Nod/Shake/Brow)' : 'Facial Gestures Paused'}
            className={`py-1 px-2 rounded-lg border text-[11px] font-medium transition flex items-center gap-1 ${
              gesturesEnabled
                ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                : 'bg-neutral-800 border-neutral-700 text-neutral-400'
            }`}
          >
            <Smile className="w-3 h-3" />
            <span className="hidden sm:inline">Gestures</span>
          </button>

          {onToggleMouseSimulation && (
            <button
              onClick={onToggleMouseSimulation}
              title="Toggle Cursor Simulation Mode"
              className={`p-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-1 ${
                isSimulatingMouse
                  ? 'bg-purple-600/30 border-purple-500/50 text-purple-300'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
              }`}
            >
              <MousePointer className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setCalibrationModalOpen(true)}
            className="py-1 px-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white flex items-center gap-1.5 transition text-[11px] font-medium"
          >
            <Sliders className="w-3 h-3 text-cyan-400" /> Calibrate
          </button>
        </div>
      </div>

      {/* 5-Point Calibration Modal */}
      <CalibrationModal
        isOpen={calibrationModalOpen}
        onClose={() => setCalibrationModalOpen(false)}
        rawGaze={rawGazeSample}
        onCalibrationComplete={handleCalibrationComplete}
      />
    </div>
  );
}
