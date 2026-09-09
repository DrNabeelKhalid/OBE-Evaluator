# OBE-ICAS: Outcome Integrity & Cognitive Alignment Suite
### Faculty of Engineering • Department of Electrical Engineering
Outcome-Based Education (OBE) Outcome Integrity & Cognitive Alignment System compliant with the **Washington Accord (IEA v4.0)**, **Pakistan Engineering Council (PEC)**, and **ABET** criteria.

**Live Deployment**: [https://drnabeelkhalid.github.io/OBE-Evaluator/](https://drnabeelkhalid.github.io/OBE-Evaluator/)

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
   - Installable on Android devices via Google Chrome ("Install app" / "Add to Home screen").

---

## 🚀 How to Run Locally

Since this is a modern, standalone web application, you can run it immediately with Python's built-in server:

```bash
cd /home/technoverx/.gemini/antigravity/scratch/obe-clo-evaluator
python3 -m http.server 8080
```

Open your browser and navigate to:
```
http://localhost:8080
```

---

## 🌐 Quick 1-Click Deployment

You can host this platform publicly for your department in seconds:

- **GitHub Pages**: Push this directory to a GitHub repository and enable Pages in repository settings.
- **Vercel / Netlify**: Drag and drop the `obe-clo-evaluator` folder into the Netlify or Vercel dashboard.

---

## 👨‍🏫 System Author & Implementation Credit

This system was conceptualized, architected, and implemented by:
- **Engr. Dr. Nabeel Khalid**  
  *Department of Electrical Engineering, Faculty of Engineering*

Key contributions include:
- Conceptualization of the automated OBE accreditation review pipeline aligned with Pakistan Engineering Council (PEC) and Washington Accord standards.
- Implementation of the dual-evaluation rubric (CLO quality & syllabus topical breadth / contact hour pacing).
- Design and integration of the AI-Resilient Learning Initiative (AI-RLI) assessment generator engine.
- Vector PDF dossier printing architecture for academic course review folders and accreditation visits.

---

## 📑 License & Attribution
© 2026 OBE-ICAS Platform. Implemented by **Engr. Dr. Nabeel Khalid**. All rights reserved.  
Department of Electrical Engineering • Faculty of Engineering
