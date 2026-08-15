# MantraAI 🧬

**Private, evidence-based men's health intelligence for India.**

MantraAI is an anonymous, clinical-grade digital wellness platform designed specifically for the modern Indian man — addressing reproductive health, mental wellness, and lifestyle risk factors through AI-powered symptom assessment.

---

## ✨ Features

### 🔬 Symptom Assessment
A structured, multi-block clinical questionnaire covering 13 health domains with 96+ data points — including demographics, lifestyle, mental health, reproductive health, sexual health, and more. Produces a personalized AI-generated clinical report with no account required.

### 🤖 AI Report Generation (Groq API)
Questionnaire responses are analyzed server-side by a large language model (Llama 3.3 70B via Groq) to produce a private, non-diagnostic wellness report with domain-specific insights.

### 🎨 Living Microscopic Visual Identity
A unique "life at the microscopic level" visual language — custom biological Canvas-2D particle field, abstract sperm-like biological forms, Ashoka-inspired orbital mandala rings, custom biological cursor with click-burst physics, and a full page entry animation.

### 🇮🇳 India-First Design
- Bilingual: English ↔ Hindi (हिन्दी)
- Localized datasets grounded in NFHS-5 Indian demographic data
- India data map with animated city nodes (Delhi, Mumbai, Bengaluru, Kolkata, Chennai, Pune)
- Saffron (Marigold) primary accent with Ashoka-green identity markers

### 🔒 Privacy-First
- Zero PII collected
- No account signup
- No session tracking
- Anonymous assessments by design

---

## 🏗️ Architecture

```
MantraAI/
├── frontend/              # React + Vite + Tailwind v4 frontend
│   └── src/
│       ├── components/
│       │   ├── landing/   # Landing page components
│       │   │   ├── Hero.jsx
│       │   │   ├── MicroscopicField.jsx  # Canvas-2D biological particle system
│       │   │   ├── MagneticButton.jsx    # Magnetic CTA hover component
│       │   │   ├── ScrollNarrative.jsx   # Right-side scroll journey indicator
│       │   │   ├── PageLoader.jsx        # Cinematic entry animation
│       │   │   ├── CustomCursor.jsx      # Biological sperm-like cursor
│       │   │   ├── ModulePreview.jsx     # Clinical module cards
│       │   │   ├── TrustSection.jsx      # Privacy + India map
│       │   │   ├── ResearchSection.jsx   # Clinical citations
│       │   │   ├── ProblemSection.jsx    # Research data + chart
│       │   │   └── Footer.jsx
│       │   └── assessment/              # Questionnaire UI components
│       ├── context/       # Theme + Language context providers
│       ├── data/          # Assessment schema (96 questions, 13 blocks)
│       └── pages/
│           └── SymptomAssessment.jsx    # Full assessment + AI report flow
├── backend/               # FastAPI Python backend
│   └── main.py            # REST API + Groq LLM integration
├── ml/                    # ML pipeline (future)
│   ├── data/
│   └── notebooks/
├── docs/                  # Documentation
└── mobile/                # Mobile app (React Native / Expo)
```

---

## 🛠️ Tech Stack

| Layer     | Technology |
|-----------|-----------|
| Frontend  | React 19, Vite 8, Tailwind CSS v4 |
| Animation | Framer Motion 13, Canvas 2D API |
| 3D        | Three.js + @react-three/fiber |
| Backend   | FastAPI (Python), Uvicorn |
| AI/LLM    | Groq API (Llama-3.3-70b-versatile) |
| Fonts     | Instrument Serif, Satoshi (Fontshare) |

---

## 🚀 Getting Started

Follow these steps to run the MantraAI frontend and backend applications locally.

### 📋 Prerequisites
- **Node.js** (version 18 or higher)
- **Python** (version 3.10 or higher)

---

### 🎨 Running the Frontend

The frontend is built with React, Vite, and Tailwind CSS.

1. **Navigate to the frontend folder:**
   ```bash
   cd frontend
   ```

2. **Install node package dependencies:**
   ```bash
   npm install
   ```

3. **Start the local Vite development server:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   Open your browser and navigate to **[http://localhost:5173](http://localhost:5173)**.

---

### ⚡ Running the Backend

The backend is built with FastAPI and connects to the Groq API for pre-clinical report generation.

1. **Navigate to the backend folder:**
   ```bash
   cd backend
   ```

2. **Create a Python virtual environment:**
   ```bash
   python -m venv .venv
   ```

3. **Activate the virtual environment:**
   - **On Windows (PowerShell/CMD):**
     ```powershell
     .venv\Scripts\activate
     ```
   - **On macOS/Linux:**
     ```bash
     source .venv/bin/activate
     ```

4. **Install Python package dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Configure environment variables:**
   Create a `.env` file inside the `backend/` directory:
   ```env
   GROQ_API_KEY=your_actual_groq_api_key_here
   GROQ_MODEL=llama-3.3-70b-versatile
   ```
   *(Note: Obtain your API key from the [Groq Console](https://console.groq.com/))*

6. **Start the Uvicorn local server:**
   ```bash
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

7. **Verify the server is running:**
   - Interactive docs: [http://localhost:8000/docs](http://localhost:8000/docs)
   - Health check: [http://localhost:8000/health](http://localhost:8000/health)

---

### 📱 Running the Mobile App (Expo Go)

The mobile application is built with React Native and Expo Router. It automatically resolves your developer machine's local IP address dynamically to ensure physical mobile devices running Expo Go can communicate with the backend server out-of-the-box.

1. **Navigate to the mobile folder:**
   ```bash
   cd mobile
   ```

2. **Install node package dependencies:**
   ```bash
   npm install
   ```

3. **Start the local Expo Metro bundler:**
   ```bash
   npm run start
   ```
   *(Note: This clears caches and boots the Expo development server, displaying a QR code in your terminal)*

4. **Launch inside Expo Go:**
   - **Android:** Download the **Expo Go** app from the Google Play Store, open it, and scan the terminal's QR code.
   - **iOS:** Open the native iOS **Camera** app, scan the terminal's QR code, and tap the prompt to open it inside **Expo Go** (available on the App Store).
   - **Emulators:** Press `a` in the terminal for Android Emulator or `i` for iOS Simulator.

---

## 📋 Assessment Schema

The questionnaire covers **13 clinical blocks** across **96 data points**:

| Block | Domain |
|-------|--------|
| 01 | Demographics |
| 02 | Lifestyle & Behaviors |
| 03 | Heat Exposure |
| 04 | Diet & Nutrition |
| 05 | Environmental Exposure |
| 06 | Mental Health & Stress |
| 07 | Reproductive History |
| 08 | Substance Use |
| 09 | Digital & Sexual Behavior |
| 10 | Performance Anxiety |
| 11 | Body Image & Perception |
| 12 | Social & Relational Context |
| 13 | Coping Mechanism Mapping |

Dynamic skip logic ensures questions are contextually appropriate (e.g., partner-specific questions skipped for single users).

---

## 🧪 Clinical Foundations

MantraAI's assessment logic is grounded in peer-reviewed instruments and national datasets:

- **PHQ-9** — Patient Health Questionnaire-9 (depression screening)
- **GAD-7** — Generalized Anxiety Disorder-7 (anxiety severity)
- **NFHS-5** — National Family Health Survey 2019-21 (India-specific demographic baseline)
- **Levine et al. (2023)** — Temporal trends in sperm count, Human Reproduction Update

> ⚠️ MantraAI is a pre-clinical wellness and risk screening platform. It does **not** replace professional medical advice, diagnosis, or treatment. Always consult a registered medical practitioner (RMP) for clinical concerns.

---

## 🎨 Design System

### Color Tokens
| Token | Value | Usage |
|-------|-------|-------|
| `marigold` | `#d97706` | Primary accent (saffron) |
| `night-blue` | `#080c16` | Deep background (dark) |
| `cream` | `#fbfaf7` | Background (light) |
| `ashoka-green` | `#065f46` | India identity accent |

### Typography
- **Serif**: Instrument Serif — headlines, major statements
- **Sans**: Satoshi — UI, metadata, navigation, labels

### Animation Philosophy
- All animations respect `prefers-reduced-motion`
- Canvas animations pause when off-screen (IntersectionObserver)
- Custom cursor disabled on touch devices
- Target: smooth 60fps on standard hardware

---

## 🌐 Accessibility

- Full keyboard navigation support
- `prefers-reduced-motion` respected across all animations
- Touch device detection — custom cursor disabled on mobile
- Semantic HTML with ARIA labels
- Readable contrast maintained across dark and light modes

---

## 📦 Environment Variables

### Backend (`backend/.env`)
```env
GROQ_API_KEY=          # Your Groq API key
GROQ_MODEL=            # e.g. llama-3.3-70b-versatile
```

> ⚠️ Never commit `.env` files. They are excluded by `.gitignore`.

---

## 🗺️ Roadmap

- [x] Phase 1 — Core symptom assessment questionnaire (87 variables)
- [x] Phase 2 — Sexual health extension (96 variables)
- [x] Phase 3 — AI-powered report generation (Groq API)
- [x] Phase 4 — Premium landing page redesign (microscopic visual identity)
- [ ] Phase 5 — ML model training on synthetic dataset
- [ ] Phase 6 — Backend database integration
- [x] Phase 7 — Mobile app (React Native / Expo)
- [ ] Phase 8 — Clinical referral pathways

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">
  <strong>MANTRA.AI</strong> — Private health intelligence for India 🇮🇳<br/>
  <em>Shielded by design. Anonymous by default.</em>
</div>
