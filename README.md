# OBE-ICAS: Outcome Integrity & Cognitive Alignment Suite
### Faculty of Engineering • Department of Electrical Engineering
Outcome-Based Education (OBE) Outcome Integrity & Cognitive Alignment System compliant with the **Washington Accord (IEA v4.0)**, **Pakistan Engineering Council (PEC)**, and **ABET** criteria.

**Live Deployment (GitHub Pages)**: [https://drnabeelkhalid.github.io/OBE-Evaluator/](https://drnabeelkhalid.github.io/OBE-Evaluator/)  
**Deploy on Vercel**: [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FDrNabeelKhalid%2FOBE-Evaluator)

---

## 🌟 Key Features

1. **Academic Showcase Landing Page**:
   - Modern, high-contrast UI designed with the official Faculty of Engineering logo (`FOE_Logo_WBG.png`) and branding theme (`#F27D26`).
   - Clear value propositions for accreditation teams, curriculum committees, and department chairs.
   - Comprehensive interactive guides for Bloom's Revised Taxonomy (C1–C6, A1–A5, P1–P7) and Pakistan Engineering Council (PEC) 11 Graduate Attributes (PLO-1 to PLO-11).

2. **Interactive Evaluation Workbench**:
   - **Module A: CLO Quality Engine**:
     - Evaluates Course Learning Outcomes against SMART criteria and measurable action verbs.
     - Detects vague unmeasurable verbs (e.g., "understand", "know", "learn") and issues real-time warnings.
     - Generates 1–10 Quality Scores with instant **RETAIN** or **REVISE** accreditation verdicts.
     - Delivers expertly rewritten CLO statements with continuous quality improvement (CQI) rationale.
     - Overall Course Set analysis checking cognitive laddering, progression, and redundancy.
   - **Module B: Assessment Alignment Engine**:
     - Audits exams, quizzes, and midterm questions against mapped CLOs.
     - Detects **Cognitive Deflation** (e.g., questions asking to "List" (C1) mapped to "Design" (C6) outcomes).
     - Marks distribution analysis and cognitive upgrade recommendations.
   - **Module C: AI Resilience Studio & 3-Pillars Audit Framework**:
     - Ingests exam papers via file upload (Word, PDF, Text) or 1-click import from the Assessment Evaluator.
     - Audits assessments against the AI-RLI 3 Pillars:
       - *Pillar 1: Process > Product* (Intermediate engineering artifacts).
       - *Pillar 2: Hyper-Contextualization* (Anchored in local bench reality and lab constraints).
       - *Pillar 3: Conceptual Depth & AI Critique* (Student evaluation and diagnosis of flawed AI outputs).
     - Diagnoses question-by-question LLM vulnerability fractures and automatically generates production-ready **Fortified AI-Resilient Redesigns**.

3. **Multimodal Syllabus & Assessment Scanner**:
   - Upload course outlines or exam papers (PDF, DOCX, or images).
   - Powered by Google Gemini AI with automatic extraction of course titles, descriptions, CLOs, and questions.

4. **Accreditation-Ready Vector PDF Dossier**:
   - Generates clean, official reports complete with Departmental QA headers, audit timestamps, reference numbers, and signature lines for Course Instructors, OBE Coordinators, and Department Chairs.
   - No screenshot artifacts or UI buttons in the generated report.

5. **Privacy & API Modes**:
   - **Live AI Mode**: Securely connect your Google Gemini API Key directly in your browser (`localStorage`).
   - **Simulation / Demo Mode**: Full offline simulated audit engine pre-loaded with Electrical Engineering courses (e.g. *EE-312 Microcontrollers*, *EE-415 Power Electronics*).

6. **Progressive Web App (PWA)**:
   - Installable on mobile and desktop devices via Google Chrome ("Install app" / "Add to Home screen").

---

## 🚀 How to Run Locally

Since this is a modern, standalone web application, you can run it immediately with Python's built-in server:

```bash
python3 -m http.server 8080
```

Open your browser and navigate to:
```
http://localhost:8080
```

---

## 🌐 Deploying & Hosting on Vercel

The platform includes a pre-configured, optimized `vercel.json` with edge caching, service worker security permissions, and clean routing. You can host this platform on Vercel using any of the following 3 methods:

### Method 1: Direct GitHub Integration (Recommended — Continuous Deployment)
1. Sign in to your [Vercel Dashboard](https://vercel.com/dashboard) (log in with your GitHub account `DrNabeelKhalid`).
2. Click **"Add New..."** &rarr; **"Project"**.
3. In the list of repositories, find **`DrNabeelKhalid/OBE-Evaluator`** and click **"Import"**.
4. Configure Project:
   - **Framework Preset**: Select **`Other`** (pure HTML/CSS/JS static site).
   - **Root Directory**: `./` (default).
   - **Build Command**: Leave empty / disabled.
   - **Output Directory**: Leave empty / disabled (serves root `index.html`).
5. Click **"Deploy"**.
6. Within 15 seconds, your site will be live at a custom URL (e.g. `https://obe-evaluator.vercel.app`).
7. **Zero-Maintenance Updates**: Any future commit pushed to GitHub (`git push origin main` or `./deploy_to_github.sh`) will automatically trigger a new deployment on Vercel in seconds!

---

### Method 2: 1-Click Deploy Button
Click the badge below to immediately clone and deploy this project into your Vercel account:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FDrNabeelKhalid%2FOBE-Evaluator)

---

### Method 3: Command-Line Deployment via Vercel CLI
You can also deploy directly from your local terminal using the included script:

```bash
./deploy_to_vercel.sh
```

Or run directly with `npx`:
```bash
npx vercel --prod
```
When prompted for the first time, log in with your email or GitHub account. Vercel will upload and deploy the static site immediately.

---

## 👨‍🏫 System Author & Implementation Credit

This system was conceptualized, architected, and implemented by:
- **Engr. Dr. Nabeel Khalid**  
  *Department of Electrical Engineering, Faculty of Engineering*

Key contributions include:
- Conceptualization of the automated OBE accreditation review pipeline aligned with Pakistan Engineering Council (PEC) and Washington Accord standards.
- Implementation of the dual-evaluation rubric (CLO quality & syllabus topical breadth / contact hour pacing).
- Design and integration of the AI-Resilient Learning Initiative (AI-RLI) assessment generator and audit engine.
- Vector PDF dossier printing architecture for academic course review folders and accreditation visits.

---

## 📑 License & Attribution
© 2026 OBE-ICAS Platform. Implemented by **Engr. Dr. Nabeel Khalid**. All rights reserved.  
Department of Electrical Engineering • Faculty of Engineering
