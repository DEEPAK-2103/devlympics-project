# SynapseFlow: Bi-Directional Assistive Collaboration Bridge
### *GDG NSUT Devlympics – Shunya 2026 Submission*
**Theme: Bridge the Gap**

---

## 🚀 Overview

**SynapseFlow** is a lightweight, zero-hardware assistive software suite engineered to connect motor- and speech-impaired individuals (e.g., individuals with ALS, Cerebral Palsy, stroke survivors) with rapid, verbal-first digital teams in modern environments like Google Meet, Zoom, and Slack.

Existing Augmentative and Alternative Communication (AAC) devices suffer from **extreme communication asymmetry**:
* Traditional on-screen gaze keyboards limit users to **8–12 words per minute (WPM)**.
* Modern verbal standups move at **130–160 words per minute (WPM)**.
* Non-verbal engineers frequently experience **conversational collisions**—getting interrupted or talked over before their message finishes typing.
* Proprietary hardware eye-trackers cost **$3,000 – $10,000+**, creating an economic barrier to entry.

**SynapseFlow bridges this gap** by converting sparse physical micro-gazes (350ms dwell or quick blinks) via an ordinary laptop webcam into full, tone-calibrated, context-aware spoken sentences in **under 1.2 seconds**, while distilling incoming peer speech into 4 quick-glance response cards in real time.

---

## ⚡ Key Architectural Innovations

### 1. Zero-Hardware Vision & Gaze Tracker (Frontend)
* Uses `@mediapipe/tasks-vision` running client-side WebAssembly/WebGL on GPU.
* Extracts 478 facial landmarks, tracking normalized iris displacement (points 468 & 473) relative to eye boundaries (points 33, 133, 263, 362).
* **Adaptive Jitter Filter (EMA):** Dynamically adjusts alpha between saccadic movements ($\alpha = 0.45$) and fixations ($\alpha = 0.18$) for rock-solid targeting without jitter.
* **Safety Cancel Guard:** A deliberate prolonged eye closure (>800ms) immediately resets dwell progress, eliminating accidental triggers (the Midas Touch problem).

### 2. The Ergonomic Radial HUD (Fitts's Law Optimized)
* Arranged into 4 ergonomic polar quadrants:
  * **Quadrant 0 (Top / Action & Code Review):** Approve PRs, request changes, code walkthroughs.
  * **Quadrant 1 (Right / Sprint Status):** On track, blocked on APIs, deploy readiness.
  * **Quadrant 2 (Bottom / Rapid Conversational):** Concur, disagree, deferral.
  * **Quadrant 3 (Left / Dynamic Live Meeting Context):** Automatically populated based on what teammates just spoke!
* Visual 350ms animated dwell ring providing instant feedback.

### 3. Conversational Floor Reservation ("The Beacon")
* At 25% dwell (~90ms), SynapseFlow activates a visual badge (*"Alex is preparing a reply..."*) and emits a soft audio chime.
* Peers in Google Meet/Zoom immediately pause, preventing interruptions and giving the non-verbal user full conversational parity.

### 4. Real-Time Inbound Speech Distillation & Outbound TTS
* **Side B $\to$ Side A:** Ingests live ambient microphone speech via the Web Speech API and distills the question into 4 dynamic options via Google Gemini.
* **Side A $\to$ Side B:** Expands sparse intent tokens into natural sentences with 3 persona modes (Professional, Direct, Casual) spoken aloud via Neural TTS.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | Next.js (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS v4, Glassmorphism, Responsive SVG |
| **Computer Vision** | Google MediaPipe Face Landmarker (478 Landmarks, WASM / WebGL) |
| **AI / LLM Engine** | Google Gemini 1.5 Flash API (Structured JSON & Fluent Expansion) |
| **Speech Layer** | Web Speech API (`webkitSpeechRecognition`), SpeechSynthesis TTS, Web Audio API |
| **Signal Processing** | Custom Dynamic Exponential Moving Average (EMA) Vector Filter |

---

## 🏃 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and add your Google Gemini API key:
```bash
cp .env.example .env.local
```
Add your key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
*(Note: SynapseFlow also includes a built-in contextual heuristic generator that provides full functionality even before an API key is entered!)*

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in Google Chrome or Microsoft Edge.

---

## 🎯 Testing & Evaluation Modes

1. **Webcam Gaze Mode:**
   * Allow camera access. Look at any of the 4 HUD quadrants for 350ms to trigger spoken speech.
   * Click **Calibrate** in the eye-tracker toolbar for the 5-point rapid calibration.
   * Close your eyes for >800ms to test the safety cancel guard.
2. **Cursor Simulation Mode:**
   * Toggle **"Enable Cursor"** in the top banner or settings drawer to simulate eye gaze with your mouse pointer (ideal for screen recordings or environments without webcams).
3. **Live Microphone Ingestion:**
   * Click **"Listen via Mic"** in the meeting stage and speak a question (e.g., *"Alex, can you review the auth PR?"*). Watch the 4 HUD cards dynamically refresh in real time!
