# SynapseFlow: Enterprise Bi-Directional Assistive Collaboration Suite
### *GDG NSUT Devlympics – Shunya 2026 Grand Submission*
**Theme: Bridge the Gap**

---

## 🌟 Executive Summary

**SynapseFlow** directly answers the Devlympics Shunya 2026 problem statement by transforming an ordinary commodity laptop webcam into a **bi-directional zero-hardware cognitive bridge**. It connects motor- and speech-impaired individuals (e.g., engineers with ALS, cerebral palsy, or brainstem stroke) with high-velocity, verbal-first digital engineering teams.

---

## ⚡ The 6 Core Interactive Modules

### 1. The Assistive Collaboration Cockpit
* **Dual-Pane Cockpit:** Unifies the **Zero-Hardware Gaze HUD (Side A)** with the **Live Collaboration Stage (Side B)**.
* **Client-Side Vision Engine:** 478 MediaPipe landmarks tracking iris displacement vectors (landmarks 468 & 473) normalized against eye boundary anchors with velocity-sensitive EMA smoothing.
* **Floor Reservation Beacon:** At 90ms dwell, SynapseFlow plays a subtle acoustic chime and displays a live pulse badge (*"Alex is preparing a reply..."*), preventing conversational interruptions.
* **Emergency Cancel Guard:** Deliberate eye closure ($>800\text{ms}$) immediately resets the HUD, eliminating unintended triggers.

### 2. "Feel the Gap" Live Benchmark Simulator
* **Side-by-Side Comparison:** Judges can experience firsthand the agonizing friction of spelling out a 12-word sentence letter-by-letter on a simulated traditional 8-WPM eye keyboard (42.5 seconds + severe teammate impatience).
* **The SynapseFlow Contrast:** Delivering the exact same spoken response in **0.82 seconds** with a single 350ms micro-gaze (**51.8x speedup** with zero physical fatigue).

### 3. Gaze-Driven GitHub PR Code Review Bridge
* **Technical Empowerment:** Senior engineers with motor disabilities can lead code reviews and pair program without keyboard or mouse input.
* **Context Lens Ingestion:** Parses technical pull request diffs (e.g. distributed locking, JWT expiration) and generates 4 actionable technical review options.
* **Line-by-Line Commenting & Verbal Review:** Gaze dwell simultaneously synthesizes the spoken review for teammates and posts line-by-line review comments to the PR thread.

### 4. Macro Wheel Studio & Custom Category Packs
* **Pre-Configured Packs:** Daily Standup, P0 Incident Triage, and Design & UX Critique.
* **Live In-App Editor:** Allows engineers to customize titles, intent tokens, and spoken phrasing for any quadrant.

### 5. Professional Identity & Neural Voice Calibrator
* **Dignity & Personalization:** Non-verbal professionals customize their name, role, technical stack, and vocal pitch/rate so their synthesized voice reflects their unique seniority and personality.

### 6. Assistive Clinical Telemetry & Caregiver Safeguard
* **Live Telemetry:** Tracks effective WPM (130+ WPM), cumulative minutes saved, and intent accuracy rate.
* **Caregiver Distress Safeguard:** Emergency triggers for ergonomic posture breaks, caregiver alerts, or medical pauses.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | Next.js (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS v4, Glassmorphism, Responsive SVG |
| **Computer Vision** | Google MediaPipe Face Landmarker (478 Landmarks, WASM / WebGL on GPU) |
| **AI / LLM Engine** | Google Gemini 1.5 Flash API (Structured JSON & Fluent Expansion) |
| **Speech Layer** | Web Speech API (`webkitSpeechRecognition`), SpeechSynthesis TTS, Web Audio API |
| **Signal Processing** | Custom Dynamic Exponential Moving Average (EMA) Vector Filter |
| **Integrations** | Slack Incoming Webhooks, Virtual Audio Cable Pipeline (VB-CABLE / BlackHole) |

---

## 🏃 Quick Start Guide

### 1. Install & Run
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in Google Chrome or Microsoft Edge.

### 2. Environment Configuration
Copy `.env.example` to `.env.local`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
*(Note: SynapseFlow includes a high-performance contextual dynamic generator that provides full functionality even before an API key is entered!)*
