// Gemini AI Engine & Multimodal Document Evaluator
// Integrates with Google Gemini API (gemini-2.5-flash / gemini-1.5-flash)

import { parseSyllabusText } from './document-extractor.js';

export class GeminiOBEEvaluator {
  constructor() {
    this.apiKey = localStorage.getItem('gemini_api_key') || '';
    this.primaryModel = 'gemini-2.5-flash';
    this.fallbackModel = 'gemini-1.5-flash';
  }

  setApiKey(key) {
    this.apiKey = key.trim();
    if (this.apiKey) {
      localStorage.setItem('gemini_api_key', this.apiKey);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
  }

  getApiKey() {
    return this.apiKey;
  }

  hasApiKey() {
    return Boolean(this.apiKey && this.apiKey.length > 10);
  }

  /**
   * Evaluates Course Learning Outcomes (CLOs) AND Course Plan / Topical Outline Quality
   */
  async evaluateCLOs({ courseName, courseDescription, clos, coursePlan = '', topics = [] }) {
    if (!this.hasApiKey()) {
      return this.simulateCLOEvaluation({ courseName, courseDescription, clos, coursePlan, topics });
    }

    const systemPrompt = `You are a Senior Outcome-Based Education (OBE) Quality Assurance Auditor and Engineering Accreditation Specialist for the Washington Accord / ABET / PEC.
Your task is to critically assess BOTH:
1. The Course Learning Outcomes (CLOs) statements, taxonomy levels, and mapped PLOs.
2. The Course Plan and Topical Outline (modules, technical concepts, weekly breakdown, and contact hours).

Evaluation Rules:
Part A: CLO Quality Assessment
1. Check measurable action verbs (Bloom's Taxonomy). Strictly flag non-measurable, vague verbs like "understand", "know", "learn", "study", "appreciate", "comprehend" as REVISE.
2. Check Cognitive domain taxonomy alignment (C1-C6). Is each statement written at the intended cognitive depth?
3. Check alignment with Course Name, Description, and Mapped PLO (PLO-1 to PLO-11, Pakistan Engineering Council Standard).
4. Score each CLO from 1 to 10 (10 being perfect SMART measurable CLO).
5. Verdict MUST be either "RETAIN" (score >= 8) or "REVISE" (score < 8).
6. Provide an expertly rewritten "suggestedRevision" adhering strictly to SMART criteria and Bloom's action verbs.
7. Provide overallSetAnalysis with coverageScore (1-10), progressionCheck, redundancyAssessment, and recommendations.

Part B: Course Plan & Topical Outline Assessment
8. Evaluate Topical Breadth & Technical Depth: Do the topics adequately span fundamental concepts to complex engineering problems (Washington Accord WP1-WP7) suitable for an accredited engineering degree?
9. Evaluate Constructive Alignment between Topics and CLOs:
   - Identify which topics directly instruct each CLO.
   - Detect "unaddressedCLOs": Any stated CLOs that have insufficient or missing instructional coverage in the topic outline.
   - Detect "orphanTopics": Any topics taught that do not meaningfully contribute to any defined CLO.
10. Evaluate Pacing & Contact Hours Distribution: Is the course plan structured logically across the semester without cramming or excessive gaps?
11. Detect Missing Modern Topics & Standards: Identify modern software/hardware tools (e.g. MATLAB, Simulink, RTOS, EDA tools, Spice) and professional standards (e.g., IEEE, IEC, ISO) that should be integrated.
12. Score the Course Outline from 1 to 10 ("outlineScore").
13. Determine Overall Course Accreditation Readiness:
    - "ACCREDITED" (both CLO score and outline score >= 8.0)
    - "MINOR_REVISIONS_NEEDED" (scores between 6.0 and 7.9)
    - "MAJOR_RESTRUCTURING_REQUIRED" (scores < 6.0)

Respond strictly with a valid JSON object matching this structure:
{
  "readinessStatus": "ACCREDITED",
  "readinessBadge": "Accreditation Compliant (Minor Revisions)",
  "overallSetAnalysis": {
    "summary": "Detailed narrative summarizing CLO quality and cognitive laddering...",
    "coverageScore": 8.5,
    "progressionCheck": "Evaluates progression from foundational to advanced cognitive levels...",
    "redundancyAssessment": "Observations on overlapping competencies...",
    "recommendations": ["Recommendation 1", "Recommendation 2"]
  },
  "outlineAnalysis": {
    "outlineScore": 8.2,
    "summary": "Detailed narrative evaluating the syllabus topical depth, rigor, and structure...",
    "topicalBreadth": "Assessment of technical breadth and coverage of complex engineering problems...",
    "pacingAssessment": "Assessment of weekly module pacing and contact hours allocation...",
    "alignmentSummary": "Assessment of constructive alignment between topics and stated CLOs...",
    "alignmentStatus": "STRONG_ALIGNMENT",
    "unaddressedCLOs": ["None detected"],
    "orphanTopics": ["None detected"],
    "missingModernTopics": [
      "Hardware-in-the-loop (HIL) simulation benchmarks",
      "Industry safety and regulatory compliance case study"
    ],
    "outlineRecommendations": [
      "Explicitly allocate simulation lab sessions to reinforce high-order design outcomes.",
      "Incorporate contemporary industry standards in later modules."
    ]
  },
  "cloResults": [
    {
      "cloId": 1,
      "qualityScore": 6,
      "verdict": "REVISE",
      "measurableVerb": "understand",
      "strengths": ["Clear context on technical principles"],
      "weaknesses": ["Uses non-measurable verb 'understand'"],
      "suggestedRevision": "Actionable, rewritten CLO statement using an active Bloom's verb...",
      "explanation": "Why this revision elevates the outcome and satisfies accreditation criteria..."
    }
  ]
}`;

    const userPrompt = `Course Name: ${courseName}
Course Description: ${courseDescription}

Course Plan & Topical Syllabus Outline:
${coursePlan || (topics.length > 0 ? topics.map(t => `Module ${t.moduleNumber}: ${t.title} (${t.weekRange || ''}, ${t.contactHours || ''} hrs) - ${t.subtopics?.join(', ')}`).join('\n') : 'Standard departmental topical breakdown provided.')}

Course Learning Outcomes (CLOs) to evaluate:
${clos.map((c, i) => `CLO-${c.id || i+1}:
Statement: "${c.statement}"
Mapped PLO: ${c.plo}
Target Taxonomy Level: ${c.taxonomy}`).join('\n\n')}`;

    try {
      const response = await this.callGeminiAPI(systemPrompt, userPrompt);
      return this.parseJSONResponse(response);
    } catch (err) {
      console.warn('Gemini API call failed, falling back to simulated evaluation engine:', err);
      return this.simulateCLOEvaluation({ courseName, courseDescription, clos, coursePlan, topics, errorNote: err.message });
    }
  }

  /**
   * Evaluates an Assessment (Exam/Quiz) against mapped CLOs
   */
  async evaluateAssessment({ courseName, clos, questions }) {
    if (!this.hasApiKey()) {
      return this.simulateAssessmentEvaluation({ courseName, clos, questions });
    }

    const systemPrompt = `You are a Senior OBE Assessment Auditor for an Engineering program.
Your task is to audit exam/quiz questions to verify whether they authentically test the intended Course Learning Outcomes (CLOs) at their specified Bloom's Taxonomy cognitive levels (Cognitive Match).

Critical Audit Rules:
1. Cognitive Depth Check: If a question is mapped to a high-order CLO (like C6 Design or C4 Analysis) but only asks for recall/definition (C1/C2), flag a severe "Cognitive Mismatch".
2. Content Alignment: Verify if the question content directly evaluates the competency stated in the mapped CLO.
3. Clarity and Marks Proportion: Evaluate if the question phrasing is unambiguous and if the marks allocated are justified by the required cognitive effort.
4. Score each question from 1 to 10.
5. Verdict MUST be "ALIGNED" (score >= 8), "NEEDS_REFINEMENT" (score 6-7), or "MISALIGNED" (score < 6).

Respond strictly with a valid JSON object matching this structure:
{
  "totalAlignmentScore": 7.4,
  "overallSummary": "Audit summary of the assessment instrument...",
  "marksDistribution": "Analysis of mark weights across cognitive domains...",
  "questions": [
    {
      "qId": 1,
      "score": 4,
      "alignmentVerdict": "MISALIGNED",
      "cognitiveMatch": "Question tests C1 (recall) but is mapped to CLO-3 (C6 Design)",
      "strengths": ["Clearly phrased prompt"],
      "weaknesses": ["Significant cognitive level deflation: requires listing rather than synthesis", "Marks (25) excessively high for rote memorization"],
      "suggestedRevision": "Rewritten question that authentically challenges students at C6 level..."
    }
  ]
}`;

    const userPrompt = `Course Name: ${courseName}
Target CLOs:
${clos.map(c => `CLO-${c.id}: ${c.statement} [${c.plo}, ${c.taxonomy}]`).join('\n')}

Assessment Questions to audit:
${questions.map((q, i) => `Question ${q.qNumber || i+1}:
Text: "${q.text}"
Allocated Marks: ${q.marks}
Mapped to: ${q.mappedCLO}
Target Taxonomy: ${q.targetTaxonomy}`).join('\n\n')}`;

    try {
      const response = await this.callGeminiAPI(systemPrompt, userPrompt);
      return this.parseJSONResponse(response);
    } catch (err) {
      console.warn('Gemini API call failed, falling back to simulated evaluation engine:', err);
      return this.simulateAssessmentEvaluation({ courseName, clos, questions, errorNote: err.message });
    }
  }

  /**
   * Extracts Course Information and CLOs from uploaded syllabus file or raw extracted text
   */
  async extractSyllabus(fileData, mimeType, fileName, rawText = '') {
    // 1. If API key is present and raw text is available, send directly to Gemini
    if (this.hasApiKey() && rawText && rawText.trim().length > 20) {
      const systemPrompt = `You are an automated curriculum extraction engine for Washington Accord / ABET / PEC accredited engineering programs.
Extract the Course Name (including BOTH the Course Code and Course Title, e.g. "EE-312: Microcontroller & Embedded Systems"), Course Description, Course Plan / Weekly Topical Outline, and all Course Learning Outcomes (CLOs) from the provided syllabus document text.
For each CLO, identify or infer the most suitable Mapped PLO (from PLO-1 to PLO-11) and Bloom's Taxonomy level (e.g., C1, C2, C3, C4, C5, C6, P1-P7, A1-A5).

Respond strictly with valid JSON:
{
  "courseName": "Full Course Code and Title (e.g. EE-312: Microcontroller & Embedded Systems)",
  "courseDescription": "Extracted or summarized course description",
  "coursePlan": "Extracted weekly lecture plan or topical modules list with contact hours",
  "clos": [
    {
      "statement": "Complete CLO statement text",
      "plo": "PLO-1",
      "taxonomy": "C3"
    }
  ]
}`;

      try {
        const userPrompt = `Document: ${fileName}\n\nSyllabus Content:\n${rawText.slice(0, 18000)}`;
        const response = await this.callGeminiAPI(systemPrompt, userPrompt);
        const parsed = this.parseJSONResponse(response);
        if (parsed && (parsed.courseName || (parsed.clos && parsed.clos.length > 0) || parsed.coursePlan)) {
          return parsed;
        }
      } catch (err) {
        console.warn('Gemini text extraction failed, falling back to client-side extraction:', err);
      }
    }

    // 2. If API key is present and file is binary image or PDF (and no rawText)
    if (this.hasApiKey() && fileData && (mimeType.startsWith('image/') || mimeType === 'application/pdf')) {
      const systemPrompt = `You are an automated curriculum extraction engine. 
Extract the Course Name (including BOTH the Course Code and Course Title, e.g. "EE-312: Microcontroller & Embedded Systems"), Course Description, Course Plan / Weekly Topical Outline, and all Course Learning Outcomes (CLOs) from the provided syllabus document.
For each CLO, identify or infer the most suitable Mapped PLO (from PLO-1 to PLO-11 as defined by PEC) and Bloom's Taxonomy level (e.g., C1, C2, C3, C4, C5, C6, P1-P7, A1-A5).

Respond strictly with valid JSON:
{
  "courseName": "Full Course Code and Title (e.g. EE-312: Microcontroller & Embedded Systems)",
  "courseDescription": "Extracted or summarized course description",
  "coursePlan": "Extracted weekly lecture plan or topical modules list with contact hours",
  "clos": [
    {
      "statement": "Complete CLO statement text",
      "plo": "PLO-1",
      "taxonomy": "C4"
    }
  ]
}`;

      try {
        const response = await this.callGeminiAPIWithFile(systemPrompt, 'Extract course syllabus data from this document.', fileData, mimeType);
        const parsed = this.parseJSONResponse(response);
        if (parsed) return parsed;
      } catch (err) {
        console.warn('Gemini file extraction error, falling back to local extractor:', err);
      }
    }

    // 3. Client-side extraction via parseSyllabusText (works offline & without API key)
    if (rawText && rawText.trim().length > 10) {
      const localExtracted = parseSyllabusText(rawText, fileName);
      if (localExtracted && (localExtracted.courseName || localExtracted.coursePlan || (localExtracted.clos && localExtracted.clos.length > 0))) {
        return localExtracted;
      }
    }

    // 4. Fallback if file was empty or unparseable
    const defaultName = (fileName || 'Course Syllabus').replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ');
    return {
      courseName: defaultName,
      courseDescription: `Syllabus document for ${defaultName}. Please review and enter course details.`,
      coursePlan: '',
      clos: []
    };
  }

  /**
   * Low-level HTTP call to Gemini REST API
   */
  async callGeminiAPI(systemInstruction, userContent) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.primaryModel}:generateContent?key=${this.apiKey}`;
    const payload = {
      system_instruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [{
        role: 'user',
        parts: [{ text: userContent }]
      }],
      generationConfig: {
        temperature: 0.2,
        response_mime_type: 'application/json'
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Gemini API returned ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
  }

  /**
   * Multimodal file upload call to Gemini API
   */
  async callGeminiAPIWithFile(systemInstruction, promptText, fileDataBase64, mimeType) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.primaryModel}:generateContent?key=${this.apiKey}`;
    const cleanBase64 = fileDataBase64.replace(/^data:.*?;base64,/, '');

    const payload = {
      system_instruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [{
        role: 'user',
        parts: [
          { text: promptText },
          {
            inline_data: {
              mime_type: mimeType,
              data: cleanBase64
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        response_mime_type: 'application/json'
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Gemini Multimodal API returned ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
  }

  parseJSONResponse(rawText) {
    if (!rawText) throw new Error('Empty response from AI engine');
    // Remove markdown code fences if present
    const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  }

  /**
   * Robust Simulated Evaluator for testing without API Key (Dynamic & Domain-Aware)
   */
  simulateCLOEvaluation({ courseName, courseDescription, clos, coursePlan = '', topics = [], errorNote }) {
    const unmeasurable = ['understand', 'know', 'learn', 'study', 'appreciate', 'comprehend', 'be familiar', 'gain knowledge', 'be aware'];
    
    // Stopwords for keyword extraction
    const stopWords = new Set(['the', 'and', 'for', 'with', 'from', 'into', 'under', 'over', 'between', 'using', 'through', 'about', 'across', 'after', 'before', 'course', 'system', 'systems', 'basic', 'basics', 'introduction', 'intro', 'week', 'module', 'lecture', 'chapter', 'outline']);

    const results = clos.map((clo, idx) => {
      const text = (clo.statement || '').trim();
      const textLower = text.toLowerCase();
      const startsWithUnmeasurable = unmeasurable.some(verb => textLower.startsWith(verb) || textLower.includes(` ${verb} `));
      const firstWord = textLower.split(/\s+/)[0] || '';
      
      if (startsWithUnmeasurable) {
        let rewritten = text;
        if (/^understand\s+(?:the\s+)?/i.test(rewritten)) {
          rewritten = rewritten.replace(/^understand\s+(?:the\s+)?/i, 'Explain and analyze the ');
        } else if (/^know\s+(?:the\s+)?/i.test(rewritten)) {
          rewritten = rewritten.replace(/^know\s+(?:the\s+)?/i, 'Describe and evaluate the ');
        } else if (/^learn\s+(?:the\s+)?/i.test(rewritten)) {
          rewritten = rewritten.replace(/^learn\s+(?:the\s+)?/i, 'Apply and implement the ');
        } else if (/^study\s+(?:the\s+)?/i.test(rewritten)) {
          rewritten = rewritten.replace(/^study\s+(?:the\s+)?/i, 'Investigate and analyze the ');
        } else if (/^appreciate\s+(?:the\s+)?/i.test(rewritten)) {
          rewritten = rewritten.replace(/^appreciate\s+(?:the\s+)?/i, 'Assess and appraise the ');
        } else if (/^be\s+familiar\s+(?:with\s+)?/i.test(rewritten)) {
          rewritten = rewritten.replace(/^be\s+familiar\s+(?:with\s+)?/i, 'Classify and apply ');
        } else {
          rewritten = `Analyze and evaluate ${text}`;
        }

        return {
          cloId: clo.id || idx + 1,
          qualityScore: 5.4,
          verdict: 'REVISE',
          measurableVerb: firstWord || 'Understand',
          strengths: [
            `Direct topical alignment with course scope and competencies of ${clo.plo || 'mapped PLO'}`
          ],
          weaknesses: [
            `Contains passive, non-measurable cognitive verb ("${firstWord}") violating Bloom's Taxonomy and Washington Accord standards`,
            'Cannot be objectively quantified in summative exam assessments or grading rubrics',
            'Lacks observable operational performance criteria and measurable student actions'
          ],
          suggestedRevision: rewritten,
          explanation: 'Replaced passive cognitive phrasing with active, observable Bloom\'s action verbs verifiable through rubrics and summative assessments.'
        };
      }

      // Check for Cognitive Deflation: e.g. target is C5/C6 (Evaluate/Design), but statement begins with 'list', 'define', 'state', 'name'
      const lowVerbs = ['list', 'define', 'state', 'recall', 'name', 'identify', 'label'];
      if ((clo.taxonomy === 'C6' || clo.taxonomy === 'C5') && lowVerbs.includes(firstWord)) {
        return {
          cloId: clo.id || idx + 1,
          qualityScore: 5.8,
          verdict: 'REVISE',
          measurableVerb: firstWord,
          strengths: [
            'Prompt is clearly written and grammatically sound'
          ],
          weaknesses: [
            `Severe Cognitive Deflation: Target taxonomy is set to ${clo.taxonomy} (High-order synthesis/evaluation), but statement begins with "${firstWord}" (C1/C2 low-order recall)`,
            'Fails Washington Accord requirements for complex engineering problem solving (WP1-WP7)'
          ],
          suggestedRevision: text.replace(new RegExp(`^${firstWord}\\s+`, 'i'), clo.taxonomy === 'C6' ? 'Design and formulate ' : 'Evaluate and critique '),
          explanation: `Elevated cognitive demand to authentic ${clo.taxonomy} level matching accredited engineering outcomes.`
        };
      }

      if (clo.taxonomy === 'C6' || clo.taxonomy === 'C5' || ['design', 'develop', 'formulate', 'synthesize', 'construct', 'optimize', 'evaluate'].includes(firstWord)) {
        return {
          cloId: clo.id || idx + 1,
          qualityScore: 9.3,
          verdict: 'RETAIN',
          measurableVerb: firstWord || 'Design',
          strengths: [
            `Exemplary high-order cognitive action verb (${clo.taxonomy || 'C6'} Synthesis/Evaluation)`,
            'Strict adherence to SMART criteria with unambiguous operational deliverables',
            `Strong constructive alignment with ${clo.plo || 'PLO'} and engineering capstone competencies`,
            'Directly supports Washington Accord complex engineering problem criteria'
          ],
          weaknesses: [
            'Minor: Ensure assessment rubric provides explicit scoring dimensions for operational constraints'
          ],
          suggestedRevision: clo.statement,
          explanation: 'Outcome exhibits high academic rigor, student-centric phrasing, and direct measurability. Retain in official Board of Studies syllabus.'
        };
      } else {
        return {
          cloId: clo.id || idx + 1,
          qualityScore: 8.7,
          verdict: 'RETAIN',
          measurableVerb: firstWord || 'Analyze',
          strengths: [
            `Solid alignment with ${clo.taxonomy || 'C3/C4'} cognitive domain`,
            'Employs active, observable diagnostic criteria',
            `Appropriately mapped to ${clo.plo || 'target PLO'}`
          ],
          weaknesses: [
            'Minor: Consider specifying target performance thresholds or tolerance bounds in the assessment guide'
          ],
          suggestedRevision: clo.statement,
          explanation: 'Well-structured outcome meeting PEC and Washington Accord accreditation quality benchmarks.'
        };
      }
    });

    const hasRevise = results.some(r => r.verdict === 'REVISE');
    const avgCLOQuality = results.length > 0
      ? (results.reduce((acc, r) => acc + r.qualityScore, 0) / results.length).toFixed(1)
      : 8.0;
    const cloScore = parseFloat(avgCLOQuality);

    // Dynamic Course Plan & Topical Syllabus Analysis
    const planText = (coursePlan || '').trim();
    const planLines = planText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 6);
    const hasPlan = planLines.length >= 2 || (topics && topics.length > 0);
    const weekCount = (planText.match(/\bweek\s*\d+/gi) || []).length || planLines.length;

    // Detect Discipline/Domain from Course Name & Description
    const combinedCourseText = `${courseName} ${courseDescription} ${planText}`.toLowerCase();
    
    let domainLabel = 'Engineering';
    let domainModernTools = [
      'Computer-aided design & simulation platforms',
      'Automated bench instrumentation and digital data acquisition testbenches'
    ];
    let domainStandards = [
      'ISO 9001/14001 Quality & Environmental Management Benchmarks',
      'Washington Accord WP1-WP7 Complex Engineering Problem Attributes'
    ];

    if (/software|programm|python|java|algorithm|data struct|web|cloud|cyber|network|database|ai|machine learn|operating system/i.test(combinedCourseText)) {
      domainLabel = 'Computing & Software Engineering';
      domainModernTools = [
        'Automated CI/CD testing pipelines (Git Actions, pytest/JUnit)',
        'Containerized deployment and microservice testbenches (Docker, Kubernetes)'
      ];
      domainStandards = [
        'IEEE/ISO/IEC 12207 Software Life Cycle Processes',
        'OWASP Secure Coding and Software Vulnerability Standards'
      ];
    } else if (/civil|structur|concrete|steel|geotech|soil|hydraul|survey|transport|water|environ/i.test(combinedCourseText)) {
      domainLabel = 'Civil & Structural Engineering';
      domainModernTools = [
        'Finite Element Analysis & structural modeling software (ETABS, SAP2000, ANSYS)',
        'Building Information Modeling (BIM) and GIS spatial mapping platforms'
      ];
      domainStandards = [
        'ACI 318 Building Code Requirements for Structural Concrete',
        'AISC 360 Specification for Structural Steel Buildings & ASTM Standards'
      ];
    } else if (/mechanic|thermo|fluid|heat|cad|cam|robot|mechatron|solidwork|manufactur|vibrat/i.test(combinedCourseText)) {
      domainLabel = 'Mechanical & Mechatronics Engineering';
      domainModernTools = [
        'Parametric 3D CAD/CAM modeling (SolidWorks, PTC Creo, Autodesk Inventor)',
        'Computational Fluid Dynamics (CFD) and FEA testbenches (ANSYS Fluent, Abaqus)'
      ];
      domainStandards = [
        'ASME Boiler and Pressure Vessel Code (BPVC)',
        'ISO 12100 Machinery Safety & OSHA Industrial Standards'
      ];
    } else if (/electric|electron|power|circuit|signal|control|telecom|antenna|rf|microcontrol|embedded|fpga|vls/i.test(combinedCourseText)) {
      domainLabel = 'Electrical & Electronic Engineering';
      domainModernTools = [
        'Simulation testbenches (MATLAB/Simulink, LTSpice, Cadence Virtuoso)',
        'Automated digital storage oscilloscope and logic analyzer data acquisition'
      ];
      domainStandards = [
        'IEEE Standards (e.g., IEEE 1547 Grid Interconnection, IEEE 80 Grounding)',
        'IEC 61508 Functional Safety & Electromagnetic Compatibility (EMC/EMI) Standards'
      ];
    }

    // Constructive Alignment Analysis: Map CLO keywords to Course Plan
    const unaddressedCLOs = [];
    const orphanTopics = [];

    if (hasPlan && planLines.length >= 3 && clos.length > 0) {
      clos.forEach(c => {
        const cloWords = (c.statement || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 4 && !stopWords.has(w));
        const matchedLine = planLines.find(line => {
          const lLower = line.toLowerCase();
          return cloWords.some(w => lLower.includes(w));
        });
        if (!matchedLine && cloWords.length > 0) {
          unaddressedCLOs.push(`CLO-${c.id}: "${c.statement.slice(0, 48)}..." (Lacks explicit corresponding module in course plan)`);
        }
      });
    }

    if (unaddressedCLOs.length === 0) {
      unaddressedCLOs.push(`All ${clos.length} defined CLOs have dedicated instructional coverage across the syllabus modules.`);
    }

    orphanTopics.push('None detected; all instructional modules align with departmental program outcomes.');

    // Calculate dynamic outline score
    let outlineScore = 8.5;
    if (!hasPlan) {
      outlineScore = 5.2;
    } else if (planLines.length >= 10 || weekCount >= 12) {
      outlineScore = unaddressedCLOs.length > 1 ? 8.2 : 9.0;
    } else if (planLines.length >= 4) {
      outlineScore = unaddressedCLOs.length > 1 ? 7.4 : 8.1;
    } else {
      outlineScore = 6.4;
    }

    let readinessStatus = 'ACCREDITED';
    let readinessBadge = 'Accreditation Ready';
    if (cloScore < 8.0 || outlineScore < 8.0) {
      if (cloScore < 6.0 || outlineScore < 6.0) {
        readinessStatus = 'MAJOR_RESTRUCTURING_REQUIRED';
        readinessBadge = 'Major Restructuring Required';
      } else {
        readinessStatus = 'MINOR_REVISIONS_NEEDED';
        readinessBadge = 'Minor Revisions Recommended';
      }
    }

    const outlineAnalysis = {
      outlineScore: outlineScore,
      summary: hasPlan
        ? `The topical syllabus outline for "${courseName}" demonstrates structured modular progression in ${domainLabel}. The curriculum progresses logically through fundamental principles, analytical methods, and practical application.`
        : `The topical syllabus outline for "${courseName}" is missing or underspecified. A detailed weekly breakdown with contact hours is essential for accreditation approval.`,
      topicalBreadth: hasPlan
        ? `Coverage spans core ${domainLabel} principles to advanced engineering application. Includes ${weekCount} distinct instructional segments satisfying Washington Accord complex engineering benchmarks.`
        : `Deficient in topical breakdown. Recommend supplying weekly modules with contact hour allocations.`,
      pacingAssessment: hasPlan
        ? (weekCount >= 12
          ? `Well-balanced ${weekCount}-week pacing across the semester with adequate contact hours per module, allowing buffer for midterms and open-ended projects.`
          : `Compact ${weekCount}-module pacing. Verify that total semester contact hours meet the institutional accreditation threshold (typically 45-48 hours for 3 credit hours).`)
        : `Pacing cannot be validated due to missing weekly schedule and contact hours.`,
      alignmentSummary: hasPlan
        ? (unaddressedCLOs.length === 1 && !unaddressedCLOs[0].includes('Lacks explicit')
          ? `Strong constructive alignment: instructional modules directly support all defined CLOs (CLO-1 through CLO-${clos.length}).`
          : `Partial constructive alignment: some high-order outcomes lack explicitly designated weekly lecture/lab modules.`)
        : `Constructive alignment check pending provision of complete weekly topic schedule.`,
      alignmentStatus: hasPlan && (unaddressedCLOs.length === 1 && !unaddressedCLOs[0].includes('Lacks explicit'))
        ? 'STRONG_ALIGNMENT'
        : (hasPlan ? 'MODERATE_ALIGNMENT' : 'NEEDS_REFINEMENT'),
      unaddressedCLOs: unaddressedCLOs,
      orphanTopics: orphanTopics,
      missingModernTopics: domainModernTools,
      outlineRecommendations: [
        `Incorporate explicit coverage of ${domainStandards[0]} in the final modules to reinforce industrial compliance.`,
        'Ensure open-ended design problems or simulation benchmarks are integrated to satisfy Washington Accord complex engineering problem (WP1-WP7) criteria.',
        'Allocate dedicated contact hours for formative assessment feedback prior to major examinations.'
      ]
    };

    return {
      readinessStatus: readinessStatus,
      readinessBadge: readinessBadge,
      overallSetAnalysis: {
        summary: `The evaluated course outcome set for "${courseName}" reflects active engineering competencies, laddering from analytical diagnosis to higher-order design and validation.`,
        coverageScore: cloScore,
        progressionCheck: 'Cognitive laddering: appropriately distributes foundational analytical outcomes into higher-order design and assessment.',
        redundancyAssessment: 'No direct competency overlap detected across outcomes. Each outcome addresses a discrete engineering competency.',
        recommendations: [
          'Ensure all outcomes utilize observable Bloom action verbs (avoiding passive cognition like "understand" or "know").',
          'Align summative exam questions and rubric criteria directly to the specified Bloom taxonomy levels.',
          'Document Continuous Quality Improvement (CQI) closing-the-loop actions in the end-of-semester course folder.'
        ],
        isSimulated: true,
        simulationNotice: errorNote ? `Live API note: ${errorNote}` : 'Generated via Academic Accreditation Audit Engine (PEC / Washington Accord Standards)'
      },
      outlineAnalysis: outlineAnalysis,
      cloResults: results
    };
  }

  /**
   * Suggests / Generates accreditation-aligned CLOs based on course outline, user-specified PLOs and taxonomy levels
   */
  async suggestCLOsForCourse({ courseName, courseDescription, coursePlan, targetPLOs = ['PLO-1', 'PLO-2', 'PLO-3'], ploTaxonomyMap = {}, isLab = false }) {
    if (!this.hasApiKey()) {
      return this.simulateCLOGenerationFromOutline({ courseName, courseDescription, coursePlan, targetPLOs, ploTaxonomyMap, isLab });
    }

    const ploTaxonomyInstructions = targetPLOs.map(plo => {
      const tax = ploTaxonomyMap[plo] || (isLab ? 'P4' : 'C3');
      return `• ${plo}: Target Taxonomy Level ${tax}`;
    }).join('\n');

    const systemPrompt = `You are a Senior OBE Curriculum Specialist and Washington Accord / ABET / PEC Engineering Accreditation Auditor.
Your task is to generate high-quality, measurable Course Learning Outcomes (CLOs) for an engineering course.

Course Code & Title: ${courseName}
Course Description: ${courseDescription}
Course Plan & Weekly Topics: ${coursePlan}
Course Type: ${isLab ? 'Laboratory / Practical' : 'Theory / Lecture'}

User-Specified PLOs & Required Bloom's Taxonomy Levels:
${ploTaxonomyInstructions}

Rules:
1. Generate EXACTLY one distinct, measurable CLO for each target PLO provided.
2. For each CLO, strictly enforce the user's requested Taxonomy Level:
   - C1 (Remembering): Define, Identify, List, Recall, State
   - C2 (Understanding): Explain, Interpret, Describe, Classify, Illustrate
   - C3 (Applying): Apply, Calculate, Solve, Implement, Demonstrate
   - C4 (Analyzing): Analyze, Diagnose, Differentiate, Investigate, Compare
   - C5 (Evaluating): Evaluate, Critique, Assess, Appraise, Justify
   - C6 (Creating/Design): Design, Formulate, Synthesize, Develop, Devise
   - P3-P7 (Psychomotor/Lab): Assemble, Calibrate, Conduct, Construct, Troubleshoot, Measure
   - A1-A5 (Affective/Ethics/Teamwork): Collaborate, Present, Practice ethics, Respect, Coordinate
3. Ground the CLO statements directly in the specific technical topics, concepts, and weekly modules provided in the Course Plan.
4. Each outcome must satisfy SMART criteria and align with Washington Accord engineering problem solving attributes.

Respond strictly with valid JSON matching this schema:
{
  "clos": [
    {
      "id": 1,
      "statement": "Actionable CLO statement starting with an active Bloom's verb...",
      "plo": "PLO-1",
      "taxonomy": "C2"
    }
  ]
}`;

    const userPrompt = `Please synthesize ${targetPLOs.length} accreditation-aligned CLOs for ${courseName} using the specified PLOs and taxonomy levels:\n${ploTaxonomyInstructions}\n\nWeekly Course Topics:\n${coursePlan}`;

    try {
      const response = await this.callGeminiAPI(systemPrompt, userPrompt);
      const parsed = this.parseJSONResponse(response);
      if (parsed && parsed.clos && parsed.clos.length > 0) {
        return parsed.clos;
      }
    } catch (err) {
      console.warn('Gemini CLO suggestion failed, using simulated curriculum synthesis:', err);
    }

    return this.simulateCLOGenerationFromOutline({ courseName, courseDescription, coursePlan, targetPLOs, ploTaxonomyMap, isLab });
  }

  /**
   * Domain-aware engineering topic extractor to ensure synthesized CLOs are 100% relevant to the specific course
   */
  getDomainTopicsForCourse(courseName = '', courseDescription = '') {
    const text = `${(courseName || '').toLowerCase()} ${(courseDescription || '').toLowerCase()}`;
    const cleanCourse = (courseName || 'Course').replace(/^[A-Z]{2,5}[ -]?\d{3,4}[:\-–\s]*/i, '').trim() || courseName;

    // 1. Civil / Structural / Environmental
    if (text.includes('fluid') || text.includes('hydraul') || text.includes('hydro')) {
      return [
        'fluid properties, manometry, and hydrostatic pressure forces on submerged bodies',
        'fluid kinematics, continuity, and Bernoulli energy conservation equations',
        'Navier-Stokes differential formulations and viscous boundary layer flows',
        'dimensional analysis, similitude, and closed-conduit pipe flow head losses',
        'open-channel hydraulics, hydraulic jumps, and turbomachinery pumps and turbines'
      ];
    }
    if (text.includes('concrete') || text.includes('reinforced concrete')) {
      return [
        'mechanical properties of concrete, reinforcing steel, and limit state design criteria',
        'flexural behavior and ultimate moment capacity of singly and doubly reinforced beams',
        'shear stresses, diagonal tension, and bar development and anchorage requirements',
        'structural behavior and deflection control of one-way and two-way reinforced slabs',
        'axial and eccentric load capacity of reinforced concrete short and slender columns'
      ];
    }
    if (text.includes('structural analysis') || text.includes('mechanics of structure')) {
      return [
        'determinacy, stability, and influence lines for statically determinate trusses and beams',
        'deflection calculations using virtual work, energy methods, and moment-area theorems',
        'analysis of indeterminate structures using the force method of consistent deformations',
        'slope deflection and moment distribution displacement methods for frame systems',
        'direct stiffness matrix formulation and computer-aided skeletal structural modeling'
      ];
    }
    if (text.includes('soil') || text.includes('geotech') || text.includes('foundation')) {
      return [
        'soil index properties, phase relationships, and geotechnical soil classification systems',
        'permeability, Darcy law, and two-dimensional seepage flow net analysis',
        'effective stress principles and one-dimensional consolidation settlement kinetics',
        'shear strength characteristics and Mohr-Coulomb failure criteria in soils',
        'lateral earth pressure distributions and shallow foundation bearing capacity'
      ];
    }
    if (text.includes('survey') || text.includes('geomatics')) {
      return [
        'linear distance measurement, systematic error theory, and traverse computations',
        'differential and profile leveling, benchmark adjustments, and contour mapping',
        'theodolite and total station angular observations and coordinate geometry',
        'horizontal circular curves and transition vertical alignment geometry',
        'GNSS satellite positioning, remote sensing, and GIS geospatial mapping'
      ];
    }

    // 2. Mechanical / Mechatronics / Materials
    if (text.includes('thermodynamic') || text.includes('thermal')) {
      return [
        'pure substance phase equilibria, state equations, and thermodynamic property charts',
        'first law energy balances for closed systems and open steady-flow control volumes',
        'second law of thermodynamics, Carnot efficiency limits, and entropy generation analysis',
        'gas power cycles including air-standard Otto, Diesel, and Brayton cycle evaluations',
        'steam Rankine power cycles, vapor-compression refrigeration, and psychrometric processes'
      ];
    }
    if (text.includes('heat transfer')) {
      return [
        'steady-state one-dimensional conduction and thermal resistance network modeling',
        'transient conduction formulations and lumped thermal capacitance dynamics',
        'forced and natural convection boundary layers and empirical Nusselt correlations',
        'thermal radiation physics, blackbody emissive laws, and surface view factor geometry',
        'heat exchanger thermal rating and sizing using LMTD and NTU-effectiveness methods'
      ];
    }
    if (text.includes('mechanics of materials') || text.includes('strength of materials')) {
      return [
        'axial stress-strain relationships, Hooke law, and indeterminate thermal deformations',
        'torsional shear stress, angle of twist, and power transmission in circular shafts',
        'transverse shear flow and flexural bending stress distributions in beams',
        'plane stress transformation, principal stress axes, and Mohr circle representations',
        'elastic beam deflections and Euler buckling instability in slender columns'
      ];
    }
    if (text.includes('dynamics') || text.includes('kinematics') || text.includes('machine design')) {
      return [
        'kinematics of planar particles and rigid bodies under relative motion constraints',
        'kinetics of rigid bodies using Newton-Euler, work-energy, and impulse-momentum principles',
        'mechanism synthesis, mobility degrees of freedom, and linkage velocity polygons',
        'power transmission drive elements including spur gearing, shafting, and belts',
        'fatigue failure criteria under fluctuating cyclic stresses using Goodman diagrams'
      ];
    }

    // 3. Computing / Software Engineering / IT
    if (text.includes('data structure') || text.includes('algorithm')) {
      return [
        'asymptotic Big-O time and space complexity, dynamic arrays, and linked lists',
        'stacks, queues, recursive data manipulation, and binary search tree topologies',
        'priority queues, binary min/max heaps, and hash table collision resolution schemes',
        'graph representations, breadth-first and depth-first searches, and shortest path algorithms',
        'divide-and-conquer, greedy optimization, and dynamic programming paradigms'
      ];
    }
    if (text.includes('database') || text.includes('sql')) {
      return [
        'relational data modeling, entity-relationship schemas, and relational algebra',
        'complex SQL query formulations, table joins, aggregations, and correlated subqueries',
        'relational functional dependencies and schema normalization from 1NF through BCNF',
        'transaction processing, ACID compliance, and concurrency locking mechanisms',
        'B+ tree indexing topologies, query execution plans, and document data stores'
      ];
    }
    if (text.includes('operating system')) {
      return [
        'operating system kernel architecture, dual-mode protection, and interrupt handlers',
        'process scheduling algorithms, thread synchronization, and CPU dispatching policies',
        'mutual exclusion primitives, semaphores, mutexes, and deadlock avoidance models',
        'virtual memory architectures, paging translation, and page replacement policies',
        'hierarchical file system management, disk block allocation, and I/O scheduling'
      ];
    }
    if (text.includes('network') || text.includes('communication network')) {
      return [
        'layered network communication architectures and OSI/TCP-IP reference models',
        'application layer protocols, socket programming, and transport layer UDP/TCP dynamics',
        'TCP flow control, window management, and network congestion collapse avoidance',
        'IP packet routing, subnet addressing, and interior/exterior gateway protocols',
        'data link framing, medium access control, Ethernet switching, and wireless security'
      ];
    }
    if (text.includes('artificial intelligence') || text.includes('machine learning') || text.includes(' ai ') || text.endsWith(' ai')) {
      return [
        'intelligent agent frameworks, state-space representations, and heuristic search algorithms',
        'supervised machine learning classification and regression model formulations',
        'unsupervised clustering algorithms, feature reduction, and principal component analysis',
        'neural network forward propagation, backpropagation gradient descent, and activation functions',
        'machine learning performance validation, bias-variance trade-offs, and ethical governance'
      ];
    }
    if (text.includes('programming') || text.includes('object-oriented') || text.includes('oop')) {
      return [
        'structured program execution, control structures, and procedural decomposition',
        'object-oriented encapsulation, class architectures, and resource constructors',
        'inheritance hierarchies, polymorphism, and dynamic interface dispatching',
        'exception handling, template abstractions, and container library algorithms',
        'dynamic memory pointers, file streams, and modular software packaging'
      ];
    }

    // 4. Electrical / Power / Electronics
    if (text.includes('circuit') || text.includes('network analysis')) {
      return [
        'Kirchhoff voltage and current laws, node-voltage, and mesh-current circuit analysis',
        'Thevenin, Norton, superposition, and maximum power transfer network theorems',
        'transient step and natural responses in dynamic first and second-order RLC circuits',
        'sinusoidal AC steady-state phasors, impedance, and complex real/reactive power',
        'three-phase balanced power networks, mutual inductance, and resonant frequency response'
      ];
    }
    if (text.includes('power system') || text.includes('high voltage')) {
      return [
        'power system network representations, single-line diagrams, and per-unit normalization',
        'transmission line distributed parameters, surge impedance loading, and ABCD matrices',
        'numerical power flow formulations and iterative Gauss-Seidel and Newton-Raphson solvers',
        'symmetrical and unsymmetrical fault analysis using symmetrical component sequence networks',
        'rotor angle power system transient stability, swing dynamics, and protective relaying'
      ];
    }
    if (text.includes('power electronic') || text.includes('drives')) {
      return [
        'power semiconductor switching characteristics and thermal safe operating area criteria',
        'non-isolated DC-DC converter topologies in continuous and discontinuous conduction',
        'isolated switch-mode power supplies, high-frequency magnetics, and snubber circuits',
        'DC-AC inverter circuits and sinusoidal and space-vector pulse-width modulation',
        'harmonic filtering standards, total harmonic distortion, and closed-loop motor drive control'
      ];
    }
    if (text.includes('control system') || text.includes('automation') || text.includes('feedback')) {
      return [
        'dynamic physical system differential equations and Laplace transfer function models',
        'transient response specifications, steady-state error coefficients, and damping behavior',
        'closed-loop stability evaluation via Routh-Hurwitz criteria and root locus construction',
        'frequency response Bode plots, Nyquist stability margins, and resonance peaks',
        'feedback controller synthesis including lead-lag compensators and tuned PID controllers'
      ];
    }
    if (text.includes('signal') || text.includes('dsp') || text.includes('digital signal')) {
      return [
        'continuous and discrete-time signals, LTI systems, and discrete convolution operations',
        'z-transform representations, pole-zero stability mapping, and system transfer functions',
        'discrete Fourier transform, FFT computation algorithms, and spectral leakage analysis',
        'finite impulse response (FIR) filter design using optimal windowing formulations',
        'infinite impulse response (IIR) filter synthesis via bilinear transformation and quantization'
      ];
    }
    if (text.includes('electromagnet') || text.includes('antenna') || text.includes('microwave')) {
      return [
        'static electric and magnetic fields, Gauss and Ampere laws, and boundary conditions',
        'time-varying electromagnetic fields, displacement current, and complete Maxwell equations',
        'uniform plane wave propagation in dielectric and lossy media, attenuation, and skin depth',
        'transmission line wave equations, voltage reflection coefficients, and Smith chart matching',
        'waveguide modal propagation and fundamental radiation parameters of antenna systems'
      ];
    }
    if (text.includes('embed') || text.includes('microcontroller') || text.includes('microprocessor') || text.includes('arm')) {
      return [
        'microcontroller architecture, register organization, and memory-mapped address spaces',
        'low-level hardware interfacing, GPIO configuration, and interrupt service routines',
        'timer subsystems, precision pulse-width modulation (PWM), and analog-to-digital sampling',
        'serial communication protocols including UART, SPI, and I2C peripheral arbitration',
        'real-time operating system concepts, preemptive task scheduling, and embedded power modes'
      ];
    }

    // 5. Default General Engineering Topics
    return [
      `fundamental theoretical principles, physical laws, and governing equations of ${cleanCourse}`,
      `analytical modeling, mathematical formulations, and diagnostic evaluations in ${cleanCourse}`,
      `computational simulation, experimental methodologies, and empirical validation in ${cleanCourse}`,
      `technical performance optimization, trade-off analysis, and regulatory standards for ${cleanCourse}`,
      `comprehensive engineering design synthesis, prototype formulation, and constraint management in ${cleanCourse}`
    ];
  }

  /**
   * Simulated dynamic CLO synthesis from course outline, target PLOs and user-selected taxonomy levels
   */
  simulateCLOGenerationFromOutline({ courseName, courseDescription, coursePlan, targetPLOs = ['PLO-1', 'PLO-2', 'PLO-3'], ploTaxonomyMap = {}, isLab = false }) {
    const rawLines = (coursePlan || '').split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 5);
    const cleanTopicRegex = /^(?:weeks?\s*\d+(?:\s*[-–]\s*\d+)?|wk\s*\d+|modules?\s*\d+|units?\s*\d+|lectures?\s*\d+|sessions?\s*\d+|ch(?:apter)?\s*\d+|exp(?:eriment)?\s*\d+|labs?\s*\d+|\d+[.)\-]|•|\*|-|–)[:\-–\s]*/i;
    let topics = rawLines
      .map(l => l.replace(cleanTopicRegex, '').replace(/\([^)]*(?:hours?|hrs?|marks?|weeks?|weight)[^)]*\)/gi, '').replace(/\([^)]*\)/g, '').trim())
      .filter(t => t.length > 4 && !/^(?:course\s*code|instructor|credit|prerequisite|textbook|reference|grading)/i.test(t));

    const nameLower = (courseName || '').toLowerCase();
    const isEmbeddedCourse = /embed|microcontroller|cortex|avr|stm32|arm\b/i.test(nameLower);
    const hasStaleEmbeddedTopics = rawLines.some(l => /arm cortex|nvic|systick|free_?rtos|gpio subsystems/i.test(l));

    // Stale topic check: If the course is NOT embedded but topics still contain ARM Cortex-M, discard stale topics!
    if (!isEmbeddedCourse && hasStaleEmbeddedTopics) {
      topics = [];
    }

    // If topics is empty or too short, synthesize authentic domain topics for this exact course
    if (topics.length === 0) {
      topics = this.getDomainTopicsForCourse(courseName, courseDescription);
    }

    const cleanCourse = (courseName || 'Course').replace(/^[A-Z]{2,5}[ -]?\d{3,4}[:\-–\s]*/i, '').trim() || courseName;

    return targetPLOs.map((plo, idx) => {
      const topic = topics[idx % topics.length] || `technical modules in ${cleanCourse}`;
      const defaultTax = isLab ? (['PLO-4', 'PLO-5', 'PLO-9'].includes(plo) ? 'P4' : 'C3') : (plo === 'PLO-1' ? 'C2' : plo === 'PLO-2' ? 'C4' : plo === 'PLO-3' ? 'C6' : plo === 'PLO-7' ? 'A3' : 'C4');
      const tax = (ploTaxonomyMap && ploTaxonomyMap[plo]) ? ploTaxonomyMap[plo] : defaultTax;

      let statement = '';

      switch (tax) {
        case 'C1':
          statement = `Define, recall, and identify the fundamental engineering principles, terminology, and standard configurations of ${topic}.`;
          break;
        case 'C2':
          statement = `Explain, describe, and interpret operational mechanisms, physical principles, and governing equations of ${topic}.`;
          break;
        case 'C3':
          statement = `Apply governing mathematical models, engineering formulations, and calculation procedures to solve practical problems in ${topic}.`;
          break;
        case 'C4':
          statement = `Analyze and diagnose complex technical challenges, functional characteristics, and operational parameters of ${topic} using systematic engineering models.`;
          break;
        case 'C5':
          statement = `Evaluate, critique, and validate engineering performance metrics, design trade-offs, and compliance specifications for ${topic}.`;
          break;
        case 'C6':
          statement = `Design, formulate, and synthesize comprehensive engineering components, systems, or prototype implementations for ${topic} meeting operational and safety constraints.`;
          break;
        case 'P1':
        case 'P2':
        case 'P3':
          statement = `Assemble, calibrate, and set up experimental test apparatus and measurement instruments to investigate ${topic}.`;
          break;
        case 'P4':
          statement = `Conduct systematic laboratory experiments and measure physical parameters, signal responses, and empirical behaviors of ${topic}.`;
          break;
        case 'P5':
        case 'P6':
        case 'P7':
          statement = `Construct, troubleshoot, and execute integrated hardware, software, or experimental testbenches to verify the performance of ${topic}.`;
          break;
        case 'A1':
        case 'A2':
          statement = `Collaborate effectively as a contributing team member in multidisciplinary tasks and communicate technical evaluations of ${topic} through formal engineering documentation.`;
          break;
        case 'A3':
        case 'A4':
        case 'A5':
          statement = `Apply professional engineering ethics, regulatory safety standards, and sustainable environmental practices during the analysis and design of ${topic}.`;
          break;
        default:
          statement = `Apply specialized engineering methodologies to investigate and evaluate technical performance in ${topic}.`;
      }

      return {
        id: idx + 1,
        statement,
        plo,
        taxonomy: tax
      };
    });
  }

  simulateAssessmentEvaluation({ courseName, clos, questions, errorNote }) {
    const questionAudits = questions.map((q, idx) => {
      const isQ3RecallDeflation = q.text.toLowerCase().includes('list') && q.targetTaxonomy === 'C6';
      
      if (isQ3RecallDeflation) {
        return {
          qId: q.id || idx + 1,
          score: 4.0,
          alignmentVerdict: 'MISALIGNED',
          cognitiveMatch: 'Severe Cognitive Deflation: Question requires simple C1/C2 listing, but is mapped to C6 (Design).',
          strengths: [
            'Clear and grammatically sound question prompt'
          ],
          weaknesses: [
            'Tests basic memory retrieval rather than high-order synthesis or design.',
            `Allocates ${q.marks} marks (50% of assessment) to a low-level recall task.`,
            `Directly misaligned with target outcome (${q.mappedCLO})`
          ],
          suggestedRevision: 'Design an interrupt-handling architecture for a battery-powered sensor node. Provide the complete C initialization routine for SysTick and GPIO edge triggers, and calculate the worst-case interrupt latency under 16 MHz clock constraints.'
        };
      } else {
        return {
          qId: q.id || idx + 1,
          score: 8.8,
          alignmentVerdict: 'ALIGNED',
          cognitiveMatch: `Question cognitive demand matches target level (${q.targetTaxonomy}) and evaluates ${q.mappedCLO}.`,
          strengths: [
            'Demands analytical reasoning and technical calculation.',
            'Uses realistic oscilloscope/bus waveforms for problem context.',
            'Well-calibrated mark distribution.'
          ],
          weaknesses: [
            'Include specific tolerance parameters for boundary calculations.'
          ],
          suggestedRevision: q.text
        };
      }
    });

    return {
      totalAlignmentScore: 7.2,
      overallSummary: `Assessment for "${courseName}" contains high-quality analytical questions, but exhibits significant cognitive misalignment in Q3 where a C6 design CLO was tested through low-level recall.`,
      marksDistribution: 'C1/C2 (30 marks / 60%), C4 (15 marks / 30%), C6 (0 marks actual depth / inflated mapping).',
      questions: questionAudits,
      isSimulated: true,
      simulationNotice: errorNote ? `Live API note: ${errorNote}` : 'Generated via Academic Accreditation Audit Engine (Demo Mode)'
    };
  }
  /**
   * Generates accreditation-aligned CLOs, modular topics / lab experiments, and mapping matrix
   */
  async generateCurriculumAndCLOs({ courseName, courseScope, targetPLOs, cloPLOMap = {}, cloCount = 4, durationWeeks = 16, hoursPerWeek = 3, courseType = 'theory' }) {
    const dWeeks = Math.max(1, parseInt(durationWeeks) || 16);
    const hWeek = Math.max(1, parseInt(hoursPerWeek) || 3);
    const totalHours = dWeeks * hWeek;
    const isLab = (courseType || '').toLowerCase() === 'lab';

    if (!this.hasApiKey()) {
      return this.simulateCurriculumGeneration({ courseName, courseScope, targetPLOs, cloPLOMap, cloCount, durationWeeks: dWeeks, hoursPerWeek: hWeek, courseType });
    }

    const mappingInstruction = (cloPLOMap && Object.keys(cloPLOMap).length > 0)
      ? `Strict CLO-to-PLO Mapping Requirements: ${Object.entries(cloPLOMap).map(([k, v]) => `CLO-${k} MUST map to ${v}`).join(', ')}.`
      : `Distribute the ${cloCount} CLOs strictly across the user's selected target PLOs: ${targetPLOs.join(', ')}.`;

    const systemPrompt = isLab
      ? `You are a Senior OBE Laboratory Curriculum Designer and Accreditation Specialist for Pakistan Engineering Council (PEC) and Washington Accord accredited Electrical Engineering programs.
Your task is to design a high-quality, accreditation-ready Practical Laboratory Course specification with Course Learning Outcomes (CLOs) and a sequential list of hands-on Laboratory Experiments.

Design Rules:
1. Generate EXACTLY ${cloCount} Laboratory Course Learning Outcomes (CLOs).
2. Each CLO MUST strictly satisfy SMART criteria and emphasize psychomotor manipulation, experimental precision, testbench debugging, or laboratory safety (e.g., P2 Manipulation, P3 Precision, P4 Articulation, C4 Analysis, C5 Evaluation, A2 Teamwork/Ethics). DO NOT use passive verbs like "understand" or "know".
3. ${mappingInstruction} Every suggested CLO MUST map to one of the course's mapped PLOs (${targetPLOs.join(', ')}).
4. The course duration is EXACTLY ${dWeeks} weeks with ${hWeek} laboratory contact hours per week, yielding a total instruction budget of ${totalHours} contact hours.
5. Generate a comprehensive sequence of hands-on Laboratory Experiments (e.g. 8 to 14 discrete experiments or weekly modules) covering fundamental measurements up to complex system testbenches.
6. For each experiment, provide:
   - moduleNumber: Experiment # (1, 2, 3...)
   - title: Clear technical experiment title (e.g., "Exp 1: Oscilloscope Calibration & Passive Filter Frequency Response")
   - weekRange: e.g., "Week 1", "Week 2", or "Weeks 3–4"
   - subtopics: 2-4 items specifying experimental tasks, apparatus/hardware required, simulation tools, and expected deliverable (e.g. ["Apparatus: Digital Storage Oscilloscope, Function Generator", "Procedure: Measure cutoff frequency and phase response", "Deliverable: Bode plot validation & lab report"])
   - contactHours: Hours dedicated to this experiment (summing to approximately ${totalHours} hours)
7. Generate an Experiment-to-CLO Mapping Matrix specifying which experiments directly instruct and evaluate each CLO, with week range, delivery mode (e.g., "Hands-on Hardware Lab", "Software Simulation Testbench", "Hardware-in-the-Loop") and contact hours.

Respond strictly with valid JSON matching this schema:
{
  "courseSummary": "Executive summary of the practical laboratory course...",
  "courseType": "lab",
  "durationWeeks": ${dWeeks},
  "hoursPerWeek": ${hWeek},
  "totalContactHours": ${totalHours},
  "clos": [
    {
      "id": 1,
      "statement": "Actionable, measurable CLO statement starting with an active verb...",
      "plo": "PLO-4",
      "taxonomy": "P3",
      "rationale": "Why this outcome satisfies laboratory accreditation requirements..."
    }
  ],
  "topics": [
    {
      "moduleNumber": 1,
      "title": "Exp 1: Experiment Title",
      "weekRange": "Week 1",
      "subtopics": ["Apparatus: ...", "Procedure: ...", "Deliverable: ..."],
      "contactHours": 3
    }
  ],
  "topicCLOMatrix": [
    {
      "topicTitle": "Exp 1: Experiment Title",
      "weekRange": "Week 1",
      "mappedCLOs": ["CLO-1"],
      "contactHours": 3,
      "deliveryMode": "Hands-on Hardware Lab"
    }
  ]
}`
      : `You are a Senior OBE Curriculum Designer and Accreditation Specialist for Pakistan Engineering Council (PEC) and Washington Accord accredited Electrical Engineering programs.
Your task is to design a high-quality, accreditation-ready Course Learning Outcome (CLO) set and an aligned topical syllabus for a Theory Course.

Design Rules:
1. Generate EXACTLY ${cloCount} Course Learning Outcomes (CLOs).
2. Each CLO MUST strictly satisfy SMART criteria and begin with an active, measurable Bloom's Taxonomy verb (e.g., C2 Explain/Classify, C3 Calculate/Solve, C4 Analyze/Differentiate, C5 Evaluate, C6 Design/Formulate). DO NOT use passive verbs like "understand" or "know".
3. ${mappingInstruction} Every suggested CLO MUST map to one of the course's mapped PLOs (${targetPLOs.join(', ')}).
4. The course duration is EXACTLY ${dWeeks} weeks with ${hWeek} contact hours per week, yielding a total instruction budget of ${totalHours} contact hours.
5. Generate a comprehensive list of course topics/modules covering fundamental concepts up to complex engineering problems.
6. Allocate week spans (e.g., "Weeks 1–3", "Weeks 4–7") and contact hours to each module such that the total contact hours across all modules sum to approximately ${totalHours} hours.
7. Generate a Topic-to-CLO Mapping Matrix specifying which topics directly instruct and evaluate each CLO, along with week range, delivery mode (Lecture, Lab, Problem-Based Learning) and contact hours.

Respond strictly with valid JSON matching this schema:
{
  "courseSummary": "Executive summary of the designed course...",
  "courseType": "theory",
  "durationWeeks": ${dWeeks},
  "hoursPerWeek": ${hWeek},
  "totalContactHours": ${totalHours},
  "clos": [
    {
      "id": 1,
      "statement": "Actionable, measurable CLO statement starting with an active verb...",
      "plo": "PLO-1",
      "taxonomy": "C3",
      "rationale": "Why this outcome satisfies accreditation requirements..."
    }
  ],
  "topics": [
    {
      "moduleNumber": 1,
      "title": "Module Title",
      "weekRange": "Weeks 1–3",
      "subtopics": ["Subtopic 1", "Subtopic 2", "Subtopic 3"],
      "contactHours": 9
    }
  ],
  "topicCLOMatrix": [
    {
      "topicTitle": "Module Title",
      "weekRange": "Weeks 1–3",
      "mappedCLOs": ["CLO-1", "CLO-2"],
      "contactHours": 9,
      "deliveryMode": "Lecture & Simulation"
    }
  ]
}`;

    const userPrompt = `Course Title: ${courseName}
Course Type: ${isLab ? 'Practical Laboratory Course (Hands-on experiments)' : 'Theory Course (Classroom lecture topics)'}
Scope / Context: ${courseScope || 'Standard Electrical Engineering Core Curriculum'}
Course Mapped PLOs: ${targetPLOs.join(', ')}
${(cloPLOMap && Object.keys(cloPLOMap).length > 0) ? `Requested CLO-to-PLO Allocations: ${Object.entries(cloPLOMap).map(([k, v]) => `CLO-${k} -> ${v}`).join(', ')}` : ''}
Number of CLOs requested: ${cloCount}
Course Duration: ${dWeeks} Weeks
Instruction Hours Per Week: ${hWeek} Hours/Week
Total Contact Hours: ${totalHours} Hours`;

    try {
      const response = await this.callGeminiAPI(systemPrompt, userPrompt);
      const parsed = this.parseJSONResponse(response);
      parsed.courseType = courseType;
      parsed.courseMappedPLOs = targetPLOs;
      parsed.durationWeeks = parsed.durationWeeks || dWeeks;
      parsed.hoursPerWeek = parsed.hoursPerWeek || hWeek;
      parsed.totalContactHours = parsed.totalContactHours || totalHours;
      return parsed;
    } catch (err) {
      console.warn('Gemini API curriculum generation failed, using simulator:', err);
      return this.simulateCurriculumGeneration({ courseName, courseScope, targetPLOs, cloPLOMap, cloCount, durationWeeks: dWeeks, hoursPerWeek: hWeek, courseType, errorNote: err.message });
    }
  }

  /**
   * High-fidelity simulated curriculum and CLO generator (Theory & Lab support)
   */
  simulateCurriculumGeneration({ courseName, courseScope, targetPLOs, cloPLOMap = {}, cloCount = 4, durationWeeks = 16, hoursPerWeek = 3, courseType = 'theory', errorNote }) {
    const isLab = (courseType || '').toLowerCase() === 'lab';
    const defaultPLOs = targetPLOs && targetPLOs.length > 0 
      ? targetPLOs 
      : (isLab ? ['PLO-4', 'PLO-5', 'PLO-9', 'PLO-10'] : ['PLO-1', 'PLO-2', 'PLO-3', 'PLO-5']);
    const nameLower = (courseName || '').toLowerCase();
    const dWeeks = Math.max(1, parseInt(durationWeeks) || 16);
    const hWeek = Math.max(1, parseInt(hoursPerWeek) || 3);
    const totHours = dWeeks * hWeek;

    let domainData;

    if (isLab) {
      // Laboratory Course Simulation Data
      if (nameLower.includes('dsp') || nameLower.includes('signal')) {
        domainData = {
          summary: `Practical laboratory course reinforcing discrete-time signal processing principles through MATLAB/Python simulation algorithms and real-time DSP hardware implementation on embedded testbenches (${dWeeks} weeks, ${hWeek} hrs/week, ${totHours} contact hours total).`,
          cloTemplates: [
            { verb: 'Operate', taxonomy: 'P3', text: 'computational software (MATLAB/Python) and DSP testbenches to synthesize and visualize discrete-time signals.', ploFallback: 'PLO-5' },
            { verb: 'Implement', taxonomy: 'P4', text: 'linear convolution, DFT/FFT algorithms, and digital FIR/IIR filter routines on real-time hardware platforms.', ploFallback: 'PLO-3' },
            { verb: 'Investigate', taxonomy: 'C4', text: 'spectral leakage, aliasing, and coefficient quantization effects through systematic empirical measurements.', ploFallback: 'PLO-4' },
            { verb: 'Document', taxonomy: 'C5', text: 'experimental methodology, comparative error analyses, and filter performance metrics in formal technical laboratory reports.', ploFallback: 'PLO-10' },
            { verb: 'Collaborate', taxonomy: 'A2', text: 'effectively in experimental groups while adhering to professional code ethics and data integrity standards.', ploFallback: 'PLO-9' }
          ],
          moduleTemplates: [
            { title: 'Exp 1: Discrete-Time Signal Generation & Convolution Testbench', subtopics: ['Software: MATLAB / Python NumPy', 'Procedure: Generate unit impulse, step, sinusoidal sequences; compute linear vs circular convolution', 'Deliverable: Convolution verification script & timing analysis'], mode: 'Simulation Lab', weight: 0.16 },
            { title: 'Exp 2: Sampling Theorem, Aliasing & Multirate Processing', subtopics: ['Apparatus: Audio interface & function generator', 'Procedure: Demonstrate Nyquist criteria, observe frequency foldover during undersampling', 'Deliverable: Audio reconstruction fidelity report'], mode: 'Hands-on Hardware Lab', weight: 0.16 },
            { title: 'Exp 3: Spectral Analysis via DFT and Fast Fourier Transform (FFT)', subtopics: ['Software: MATLAB Signal Processing Toolbox', 'Procedure: Compute FFT of composite audio signals; analyze windowing effects (Hamming, Hanning)', 'Deliverable: High-resolution spectrum plot and leakage analysis'], mode: 'Simulation Lab', weight: 0.17 },
            { title: 'Exp 4: FIR Digital Filter Design by Windowing & Quantization', subtopics: ['Apparatus: DSP Starter Kit / Cortex-M4 CMSIS-DSP', 'Procedure: Implement low-pass FIR filter; evaluate 16-bit fixed-point coefficient rounding', 'Deliverable: Frequency response Bode measurement'], mode: 'Embedded Hardware Lab', weight: 0.17 },
            { title: 'Exp 5: IIR Butterworth & Chebyshev Filter Hardware Synthesis', subtopics: ['Apparatus: Function generator, DSO, DSP evaluation board', 'Procedure: Apply bilinear transformation; test passband ripple and stopband attenuation', 'Deliverable: Real-time oscillogram verification report'], mode: 'Hands-on Hardware Lab', weight: 0.17 },
            { title: 'Exp 6: Open-Ended Capstone: Real-Time Audio Noise Canceller', subtopics: ['Apparatus: Stereo audio codec, microphone, speaker, DSP kit', 'Procedure: Implement LMS adaptive filtering to cancel 50 Hz acoustic hum', 'Deliverable: Live hardware demonstration and peer review report'], mode: 'Capstone Project Lab', weight: 0.17 }
          ]
        };
      } else if (nameLower.includes('control') || nameLower.includes('automation')) {
        domainData = {
          summary: `Hands-on laboratory investigations into dynamic physical systems, servomechanisms, PID controller tuning, and compensator hardware validation (${dWeeks} weeks, ${hWeek} hrs/week, ${totHours} contact hours total).`,
          cloTemplates: [
            { verb: 'Measure', taxonomy: 'P3', text: 'transient and steady-state responses of electromechanical plants using high-precision sensory testbenches.', ploFallback: 'PLO-4' },
            { verb: 'Construct', taxonomy: 'P4', text: 'analog and microcontroller-based PID compensator circuits to meet target damping and settling time specifications.', ploFallback: 'PLO-3' },
            { verb: 'Utilize', taxonomy: 'P4', text: 'modern CAD simulation software (Simulink/MATLAB) to validate closed-loop stability against physical hardware tests.', ploFallback: 'PLO-5' },
            { verb: 'Report', taxonomy: 'C4', text: 'system identification parameters and experimental performance trade-offs in structured engineering dossiers.', ploFallback: 'PLO-10' }
          ],
          moduleTemplates: [
            { title: 'Exp 1: DC Servomotor Plant Modeling & Parameter Extraction', subtopics: ['Apparatus: Modular DC motor testbench, tachometer, current probe', 'Procedure: Measure armature resistance, back-EMF constant, and rotor moment of inertia', 'Deliverable: Validated mathematical transfer function model'], mode: 'Hands-on Hardware Lab', weight: 0.16 },
            { title: 'Exp 2: First & Second-Order Dynamic System Response Characterization', subtopics: ['Apparatus: Function generator, digital storage oscilloscope', 'Procedure: Apply step inputs; quantify percent overshoot, rise time, and settling time', 'Deliverable: Step response metric comparison matrix'], mode: 'Hands-on Hardware Lab', weight: 0.16 },
            { title: 'Exp 3: Analog Lead-Lag Phase Compensator Circuit Design & Test', subtopics: ['Apparatus: Op-amp breadboard circuit, passive components', 'Procedure: Build lead compensator; measure phase margin enhancement on Bode analyzer', 'Deliverable: Frequency response oscillograms and report'], mode: 'Hands-on Hardware Lab', weight: 0.17 },
            { title: 'Exp 4: PID Controller Tuning via Ziegler-Nichols Experimental Method', subtopics: ['Apparatus: Closed-loop servo position rig, PID controller unit', 'Procedure: Increase proportional gain to ultimate oscillation ($K_u$); calculate $K_p, T_i, T_d$', 'Deliverable: Closed-loop stability and disturbance rejection report'], mode: 'Hands-on Hardware Lab', weight: 0.17 },
            { title: 'Exp 5: Digital State-Feedback Control on Microcontroller Testbench', subtopics: ['Apparatus: 32-bit MCU board, rotary optical encoder, motor driver', 'Procedure: Implement pole-placement control law; evaluate sampling delay effects', 'Deliverable: Real-time firmware source code and step plot'], mode: 'Hardware-in-the-Loop Lab', weight: 0.17 },
            { title: 'Exp 6: Capstone Lab: Inverted Pendulum / Balance Robot Stabilization', subtopics: ['Apparatus: Linear cart inverted pendulum testbench', 'Procedure: Design and tune state estimator and LQR controller under disturbance forces', 'Deliverable: Live stabilization demo & formal group report'], mode: 'Capstone Project Lab', weight: 0.17 }
          ]
        };
      } else if (nameLower.includes('embed') || nameLower.includes('micro')) {
        domainData = {
          summary: `Hands-on firmware development, peripheral bus interfacing (UART, SPI, I2C), ADC acquisition, and RTOS task scheduling on 32-bit ARM microcontrollers (${dWeeks} weeks, ${hWeek} hrs/week, ${totHours} contact hours total).`,
          cloTemplates: [
            { verb: 'Operate', taxonomy: 'P3', text: 'logic analyzers, oscilloscopes, and hardware debuggers (JTAG/SWD) to trace embedded bus transactions.', ploFallback: 'PLO-5' },
            { verb: 'Develop', taxonomy: 'P4', text: 'interrupt-driven C drivers for timer, PWM, and communication peripherals on microcontroller evaluation boards.', ploFallback: 'PLO-3' },
            { verb: 'Troubleshoot', taxonomy: 'C4', text: 'timing violations, buffer overflows, and race conditions across multi-sensor hardware testbenches.', ploFallback: 'PLO-4' },
            { verb: 'Collaborate', taxonomy: 'A2', text: 'safely and professionally in group design assignments conforming to industrial laboratory practices.', ploFallback: 'PLO-9' }
          ],
          moduleTemplates: [
            { title: 'Exp 1: ARM Cortex-M GPIO Control & Push-Button Interrupt Handling', subtopics: ['Apparatus: STM32 / Tiva C development board, DSO, logic analyzer', 'Procedure: Configure clock gating, input pull-ups, and nested vector interrupt controller (NVIC)', 'Deliverable: Debounced switch driver code & latency log'], mode: 'Hands-on Hardware Lab', weight: 0.16 },
            { title: 'Exp 2: Hardware Timer Subsystems & Precision Waveform Synthesis', subtopics: ['Apparatus: Digital Storage Oscilloscope (DSO), frequency counter', 'Procedure: Configure prescalers and compare registers for exact 1 kHz PWM waveform', 'Deliverable: Measured duty cycle and jitter analysis'], mode: 'Hands-on Hardware Lab', weight: 0.16 },
            { title: 'Exp 3: Multi-Channel ADC Sensor Interfacing & DMA Data Transfer', subtopics: ['Apparatus: LM35 temperature sensor, potentiometer, logic probe', 'Procedure: Configure ADC sequence register; enable Direct Memory Access (DMA) streaming', 'Deliverable: Sensor calibration curves and telemetry report'], mode: 'Hands-on Hardware Lab', weight: 0.17 },
            { title: 'Exp 4: Serial Communication: UART Telemetry & SPI OLED Display', subtopics: ['Apparatus: USB-to-UART bridge, PC terminal, SPI OLED module', 'Procedure: Transmit packets at 115200 baud; write high-speed graphical display driver', 'Deliverable: Logic analyzer timing snapshot and source code'], mode: 'Hands-on Hardware Lab', weight: 0.17 },
            { title: 'Exp 5: I2C Digital Accelerometer Interfacing & Motion Detection', subtopics: ['Apparatus: MPU-6050 6-DOF IMU, I2C bus pull-up testbench', 'Procedure: Execute register read/write cycles; extract real-time roll/pitch tilt angles', 'Deliverable: Real-time attitude graphing demonstration'], mode: 'Hands-on Hardware Lab', weight: 0.17 },
            { title: 'Exp 6: Capstone Lab: FreeRTOS Preemptive Multi-Tasking Embedded System', subtopics: ['Apparatus: Complete sensor node kit, FreeRTOS kernel', 'Procedure: Create telemetry task, sensor task, and display task with mutex/semaphore sync', 'Deliverable: Task execution trace & final laboratory report'], mode: 'Capstone Project Lab', weight: 0.17 }
          ]
        };
      } else {
        // Generic Electrical Engineering Laboratory
        domainData = {
          summary: `Experimental investigations, empirical circuit validation, instrumentation mastery, and technical reporting for ${courseName} (${dWeeks} weeks, ${hWeek} hrs/week, ${totHours} contact hours total).`,
          cloTemplates: [
            { verb: 'Operate', taxonomy: 'P3', text: 'standard laboratory test and measurement equipment with accuracy, precision, and adherence to electrical safety.', ploFallback: 'PLO-5' },
            { verb: 'Assemble', taxonomy: 'P4', text: 'experimental circuit configurations and testbenches to validate analytical principles and component ratings.', ploFallback: 'PLO-3' },
            { verb: 'Analyze', taxonomy: 'C4', text: 'empirical measurement data against theoretical calculations to isolate component tolerances and parasitic losses.', ploFallback: 'PLO-4' },
            { verb: 'Compile', taxonomy: 'C5', text: 'comprehensive engineering laboratory reports documenting procedures, error margins, and conclusions.', ploFallback: 'PLO-10' }
          ],
          moduleTemplates: [
            { title: 'Exp 1: Laboratory Safety, Instrumentation Familiarization & DMM Calibration', subtopics: ['Apparatus: Digital Multimeter, regulated DC power supply', 'Procedure: Verify measurement precision, probe loading effects, and laboratory emergency shutdowns', 'Deliverable: Equipment calibration worksheet'], mode: 'Hands-on Hardware Lab', weight: 0.16 },
            { title: 'Exp 2: Network Theorems Validation: Thevenin, Norton & Maximum Power Transfer', subtopics: ['Apparatus: Precision resistor decade boxes, breadboard rig', 'Procedure: Measure open-circuit voltage, short-circuit current; plot power transfer curve', 'Deliverable: Experimental verification dossier'], mode: 'Hands-on Hardware Lab', weight: 0.16 },
            { title: 'Exp 3: Transient Response of First-Order RC and RL Circuits on Oscilloscope', subtopics: ['Apparatus: Dual-channel DSO, function generator', 'Procedure: Measure time constant ($\tau$), capacitor charging curves, and phase differences', 'Deliverable: Oscillogram captures and time-constant calculation'], mode: 'Hands-on Hardware Lab', weight: 0.17 },
            { title: 'Exp 4: RLC Resonant Circuits: Quality Factor (Q) & Bandwidth Determination', subtopics: ['Apparatus: AC signal source, frequency counter, LCR meter', 'Procedure: Sweep frequencies to identify series and parallel resonance peaks', 'Deliverable: Resonance curve plot and Q-factor report'], mode: 'Hands-on Hardware Lab', weight: 0.17 },
            { title: 'Exp 5: Active Operational Amplifier Filters & Frequency Response Measurement', subtopics: ['Apparatus: Sallen-Key low-pass filter circuit, Bode plotter', 'Procedure: Measure roll-off rate (-40 dB/decade) and cutoff frequency', 'Deliverable: Bode plot validation vs simulation model'], mode: 'Hands-on Hardware Lab', weight: 0.17 },
            { title: 'Exp 6: Capstone Lab Investigation: Subsystem Performance Verification', subtopics: ['Apparatus: Multi-instrument engineering testbench', 'Procedure: Team-based troubleshooting and verification of end-to-end signal chain', 'Deliverable: Complete laboratory project report and oral defense'], mode: 'Capstone Project Lab', weight: 0.17 }
          ]
        };
      }
    } else {
      // Theory Course Simulation Data
      domainData = {
        summary: `This course develops rigorous analytical, modeling, and design capabilities in ${courseName}, preparing students to tackle complex engineering problems. Structured for a ${dWeeks}-week semester at ${hWeek} hours/week (${totHours} contact hours total).`,
        cloTemplates: [
          { verb: 'Apply', taxonomy: 'C3', text: 'fundamental mathematical and physical laws governing circuit, system, or field behaviors to solve parametric problems.', ploFallback: 'PLO-1' },
          { verb: 'Analyze', taxonomy: 'C4', text: 'frequency responses, state-space representations, or operating characteristics to identify operational limits and instability.', ploFallback: 'PLO-2' },
          { verb: 'Design', taxonomy: 'C6', text: 'a subsystem meeting specified performance criteria under practical engineering constraints (thermal, power, and bandwidth).', ploFallback: 'PLO-3' },
          { verb: 'Investigate', taxonomy: 'C4', text: 'performance trade-offs and signal integrity using modern simulation and diagnostic test equipment.', ploFallback: 'PLO-4' },
          { verb: 'Implement', taxonomy: 'P4', text: 'hardware-software interfacing routines or control algorithms to execute real-time operational benchmarks.', ploFallback: 'PLO-5' },
          { verb: 'Evaluate', taxonomy: 'C5', text: 'system energy efficiency and environmental sustainability according to relevant regulatory standards.', ploFallback: 'PLO-6' }
        ],
        moduleTemplates: [
          { title: 'Foundational Principles & Mathematical Formulations', subtopics: ['System representations and governing differential equations', 'Transforms, frequency domain characterization, and boundary conditions', 'Linearity, time-invariance, and conservation theorems'], mode: 'Interactive Lecture', weight: 0.20 },
          { title: 'Modeling, Simulation & Parametric Analysis', subtopics: ['Computational modeling and CAD tool synthesis', 'Frequency response, Bode analysis, and stability metrics', 'Sensitivity analysis and component tolerances'], mode: 'Lecture & Simulation Lab', weight: 0.20 },
          { title: 'Hardware Interfacing & System Implementation', subtopics: ['Sensor transduction, signal conditioning, and ADC/DAC quantization', 'Filter design and active compensation topologies', 'Noise reduction, grounding, and shielding techniques'], mode: 'Hands-on Laboratory', weight: 0.20 },
          { title: 'Optimization & Design Under Complex Constraints', subtopics: ['Multi-objective optimization: power dissipation vs performance', 'Thermal management and semiconductor safe operating area (SOA)', 'Regulatory compliance, safety margins, and reliability'], mode: 'Design Workshop & Case Studies', weight: 0.20 },
          { title: 'Capstone Verification & Practical Case Studies', subtopics: ['Hardware-in-the-loop (HIL) testing and diagnostic debugging', 'Measurement verification using oscilloscopes and spectrum analyzers', 'Accreditation documentation and engineering reporting'], mode: 'Project-Based Learning', weight: 0.20 }
        ]
      };

      if (nameLower.includes('signal') || nameLower.includes('dsp')) {
        domainData.summary = `Comprehensive treatment of discrete-time signals, z-transforms, DFT/FFT algorithms, FIR/IIR digital filter design, and real-time DSP implementations. Structured across ${dWeeks} weeks (${hWeek} hrs/week, ${totHours} total contact hours).`;
        domainData.cloTemplates = [
          { verb: 'Apply', taxonomy: 'C3', text: 'sampling theorem, discrete Fourier transforms (DFT), and z-transforms to characterize discrete-time signals and systems.', ploFallback: 'PLO-1' },
          { verb: 'Analyze', taxonomy: 'C4', text: 'filter frequency responses and pole-zero constellations to detect phase distortion and aliasing in multirate processing.', ploFallback: 'PLO-2' },
          { verb: 'Design', taxonomy: 'C6', text: 'linear-phase FIR and optimum IIR digital filters satisfying passband ripple and stopband attenuation specifications.', ploFallback: 'PLO-3' },
          { verb: 'Implement', taxonomy: 'P4', text: 'real-time audio and biomedical signal filtering algorithms on floating-point DSP processors or MATLAB/Simulink platforms.', ploFallback: 'PLO-5' }
        ];
      } else if (nameLower.includes('control') || nameLower.includes('automation')) {
        domainData.summary = `Classical and modern feedback control theory, root locus, frequency domain design, state-space representations, and PID controller tuning. Structured across ${dWeeks} weeks (${hWeek} hrs/week, ${totHours} total contact hours).`;
        domainData.cloTemplates = [
          { verb: 'Calculate', taxonomy: 'C3', text: 'transfer functions and state-space models from physical dynamic models of electromechanical systems.', ploFallback: 'PLO-1' },
          { verb: 'Analyze', taxonomy: 'C4', text: 'transient response, steady-state errors, and closed-loop stability using Routh-Hurwitz and Nyquist criteria.', ploFallback: 'PLO-2' },
          { verb: 'Design', taxonomy: 'C6', text: 'lead-lag compensators and tuned PID controllers to achieve desired phase margins and settling times.', ploFallback: 'PLO-3' },
          { verb: 'Simulate', taxonomy: 'P4', text: 'nonlinear plant responses and disturbance rejection using modern computational software.', ploFallback: 'PLO-5' }
        ];
      }
    }

    // Comprehensive PLO-specific competency definitions to guarantee 100% constructive alignment
    const ploCompetencies = {
      'PLO-1': { domain: 'Cognitive', taxonomy: 'C3', verb: 'Apply', text: 'fundamental mathematical, scientific, and engineering principles to formulate and solve technical problems.' },
      'PLO-2': { domain: 'Cognitive', taxonomy: 'C4', verb: 'Analyze', text: 'complex engineering characteristics and parameters to substantiate system stability and operational conclusions.' },
      'PLO-3': { domain: 'Cognitive', taxonomy: 'C6', verb: 'Design', text: 'a functional subsystem, component, or algorithm satisfying technical specifications within realistic engineering constraints.' },
      'PLO-4': { domain: 'Cognitive/Psychomotor', taxonomy: isLab ? 'P4' : 'C4', verb: 'Investigate', text: 'empirical behaviors, physical responses, and system tolerances through systematic experimental testbenches and error analysis.' },
      'PLO-5': { domain: 'Psychomotor', taxonomy: isLab ? 'P4' : 'P3', verb: 'Utilize', text: 'modern computational CAD modeling software, simulation tools, and testbench instrumentation to validate system performance.' },
      'PLO-6': { domain: 'Cognitive', taxonomy: 'C5', verb: 'Evaluate', text: 'the societal, health, environmental sustainability, and economic impacts associated with engineered solutions.' },
      'PLO-7': { domain: 'Affective', taxonomy: 'A3', verb: 'Adhere to', text: 'professional ethical responsibilities, engineering safety standards, and intellectual integrity throughout technical practice.' },
      'PLO-8': { domain: 'Affective', taxonomy: 'A2', verb: 'Function', text: 'collaboratively as an effective team member and technical contributor in multidisciplinary engineering group settings.' },
      'PLO-9': { domain: 'Affective', taxonomy: 'A2', verb: 'Communicate', text: 'technical findings, comparative design trade-offs, and engineering conclusions effectively in written reports and presentations.' },
      'PLO-10': { domain: 'Cognitive', taxonomy: 'C5', verb: 'Apply', text: 'engineering management principles, economic decision-making, and project scheduling to technical deliverables.' },
      'PLO-11': { domain: 'Affective', taxonomy: 'A3', verb: 'Engage in', text: 'self-directed, lifelong inquiry to evaluate, adapt, and integrate emerging engineering technologies and tools.' }
    };

    // Build the requested count of CLOs strictly matching target PLOs
    const count = Math.min(Math.max(parseInt(cloCount) || 4, 2), 6);
    const generatedCLOs = [];

    for (let i = 0; i < count; i++) {
      const cloNum = i + 1;
      const assignedPLO = (cloPLOMap && cloPLOMap[cloNum]) || defaultPLOs[i % defaultPLOs.length] || 'PLO-1';
      
      // Look for a template in domainData matching this PLO, or synthesize from domain & ploCompetencies
      const domainMatch = domainData.cloTemplates.find(t => t.ploFallback === assignedPLO);
      let verb, taxonomy, text;

      if (domainMatch) {
        verb = domainMatch.verb;
        taxonomy = domainMatch.taxonomy;
        text = domainMatch.text;
      } else if (ploCompetencies[assignedPLO]) {
        const comp = ploCompetencies[assignedPLO];
        verb = comp.verb;
        taxonomy = comp.taxonomy;
        text = comp.text;
      } else {
        const fallback = domainData.cloTemplates[i % domainData.cloTemplates.length];
        verb = fallback.verb;
        taxonomy = fallback.taxonomy;
        text = fallback.text;
      }

      generatedCLOs.push({
        id: cloNum,
        statement: `${verb} ${text}`,
        plo: assignedPLO,
        taxonomy: taxonomy,
        rationale: `Formulated to directly instruct and evaluate competencies of ${assignedPLO} using measurable ${taxonomy} action verbs in compliance with PEC OBE standards.`
      });
    }

    // Distribute weeks and hours across modules / experiments
    const numMods = domainData.moduleTemplates.length;
    let accumulatedWeeks = 0;
    let accumulatedHours = 0;

    const topics = domainData.moduleTemplates.map((m, idx) => {
      const isLast = idx === numMods - 1;
      const modWeeks = isLast ? Math.max(1, dWeeks - accumulatedWeeks) : Math.max(1, Math.round(dWeeks * m.weight));
      const startWk = accumulatedWeeks + 1;
      const endWk = isLast ? dWeeks : Math.min(dWeeks, accumulatedWeeks + modWeeks);
      accumulatedWeeks = endWk;

      const modHours = isLast ? Math.max(1, totHours - accumulatedHours) : Math.round(totHours * m.weight);
      accumulatedHours += modHours;

      const weekRange = startWk === endWk ? `Week ${startWk}` : `Weeks ${startWk}–${endWk}`;

      return {
        moduleNumber: idx + 1,
        title: m.title,
        weekRange: weekRange,
        subtopics: m.subtopics,
        contactHours: modHours,
        mode: m.mode
      };
    });

    // Build Topic/Experiment-to-CLO Mapping Matrix
    const matrix = topics.map((t, idx) => {
      const clo1 = `CLO-${(idx % count) + 1}`;
      const clo2 = `CLO-${((idx + 1) % count) + 1}`;
      const mapped = Array.from(new Set([clo1, clo2]));

      return {
        topicTitle: isLab ? t.title : `Module ${t.moduleNumber}: ${t.title}`,
        weekRange: t.weekRange,
        mappedCLOs: mapped,
        contactHours: t.contactHours,
        deliveryMode: t.mode
      };
    });

    return {
      courseSummary: domainData.summary,
      courseType: courseType,
      courseMappedPLOs: defaultPLOs,
      durationWeeks: dWeeks,
      hoursPerWeek: hWeek,
      totalContactHours: totHours,
      clos: generatedCLOs,
      topics: topics,
      topicCLOMatrix: matrix,
      isSimulated: true,
      simulationNotice: errorNote ? `Live API note: ${errorNote}` : `Generated via Academic ${isLab ? 'Laboratory' : 'Curriculum'} Designer Engine (PEC Standards)`
    };
  }

  /**
   * Generates an AI-Resilient Assessment based on the AI-RLI Framework (P1, P2, P3, Bloom diagnosis)
   */
  async generateResilientAssessment({
    courseName = 'Electrical Engineering Course',
    cloStatement = '',
    plo = 'PLO-2',
    taxonomy = 'C4',
    assessmentType = 'assignment',
    conceptTopic = '',
    localContext = '',
    pillars = { p1: true, p2: true, p3: true }
  }) {
    if (!this.hasApiKey()) {
      return this.simulateResilientAssessment({
        courseName,
        cloStatement,
        plo,
        taxonomy,
        assessmentType,
        conceptTopic,
        localContext,
        pillars
      });
    }

    const safeCLO = (cloStatement || '').replace(/"/g, "'");
    const systemPrompt = `You are a Senior Academic Integrity Consultant and AI-Resilience Assessment Architect specializing in engineering higher education (PEC, Washington Accord).
You design assessments based on the official AI-Resilient Learning Initiative (AI-RLI) Framework (Spring 2026), utilizing the Three Pillars of AI Resilience:
1. P1: Process > Product (Requires visible cognitive process: drafts, intermediate calculation steps, logic analyzer/oscilloscope traces, error logs, reflective margin notes showing struggle and breakthrough).
2. P2: Contextualization (Grounds task in a specific, personally observed, or laboratory-specific physical scenario, measured tolerances, real local hardware anomalies, and dated telemetry).
3. P3: Conceptual Depth & AI Critique (Tests minimal non-negotiable structural components vs incidental features, and includes the AI Critique Strategy where students must prompt AI, identify oversimplifications/flaws, and submit a deep critique).

Also analyze the Bloom Cognitive level (C1 to C6), identify the "Assessment Fracture" (why a conventional prompt on this CLO fails under AI assistance), and formulate the complete redesigned assessment brief and grading rubric.

Respond ONLY with valid JSON matching this exact structure:
{
  "assessmentType": "${assessmentType}",
  "assessmentTitle": "string",
  "courseName": "${courseName}",
  "clo": {
    "statement": "${safeCLO}",
    "plo": "${plo}",
    "taxonomy": "${taxonomy}"
  },
  "conceptTopic": "string",
  "vulnerabilityDiagnosis": {
    "spectrumLevel": "string (e.g. C4 Analyse - Threshold Level)",
    "vulnerabilityRating": "string (e.g. High / Threshold Level / Resilient)",
    "assessmentFracture": "string (Detailed explanation of where AI can substitute for genuine student learning in a conventional prompt)",
    "whyConventionalFails": "string (Why LLMs produce surface fluency on this topic with zero student thinking)"
  },
  "threePillarArchitecture": {
    "p1Process": {
      "pillar": "P1: Process > Product",
      "requiredEvidence": ["array of 3 specific visible cognitive process artifacts required"]
    },
    "p2Context": {
      "pillar": "P2: Contextualization",
      "traceableContextDetails": "string (detailed physical bench, circuit parameters, or local constraints)"
    },
    "p3ConceptualDepth": {
      "pillar": "P3: Conceptual Depth & AI Critique",
      "loadbearingStructure": "string (minimal non-negotiable structural components vs incidental ones)",
      "aiCritiquePrompt": "string (exact prompt student must feed to an AI model)",
      "expectedStudentCritique": "string (what nuances/flaws the student must identify in the AI output)"
    }
  },
  "comparisonView": {
    "vulnerablePrompt": "string (conventional AI-vulnerable phrasing)",
    "resilientPrompt": "string (redesigned AI-resilient phrasing requiring the 3 pillars)"
  },
  "studentFacingBrief": {
    "title": "string",
    "scenario": "string",
    "tasks": ["array of 3-4 numbered actionable tasks"],
    "deliverables": ["array of 3 required student submission artifacts"]
  },
  "markingRubric": [
    { "criteria": "string", "marks": number, "descriptor": "string" },
    { "criteria": "string", "marks": number, "descriptor": "string" },
    { "criteria": "string", "marks": number, "descriptor": "string" },
    { "criteria": "string", "marks": number, "descriptor": "string" }
  ],
  "totalMarks": 100,
  "moderationNotes": "string (advice for examiners and OBE moderation committee)"
}`;

    const userPrompt = `Create an AI-resilient engineering assessment with the following specifications:
Course: ${courseName}
Assessment Instrument Type: ${assessmentType} (e.g., assignment, quiz, exam_question, lab_practical)
CLO Statement: "${safeCLO}"
Mapped PLO: ${plo}
Bloom's Taxonomy Level: ${taxonomy}
Specific Concept / Topic Focus: ${conceptTopic || 'Core engineering concept from the CLO'}
Local Hardware Bench / Context: ${localContext || 'Department laboratory environment with specific hardware tolerances'}
Active Pillars: Process>Product (${pillars.p1 ? 'YES' : 'NO'}), Contextualization (${pillars.p2 ? 'YES' : 'NO'}), Conceptual Depth & AI Critique (${pillars.p3 ? 'YES' : 'NO'})`;

    try {
      const responseText = await this.callGeminiAPI(systemPrompt, userPrompt);
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (err) {
      console.warn('Gemini AI-Resilience API call failed, falling back to Academic Simulator:', err);
      return this.simulateResilientAssessment({
        courseName,
        cloStatement,
        plo,
        taxonomy,
        assessmentType,
        conceptTopic,
        localContext,
        pillars,
        errorNote: err.message
      });
    }
  }

  /**
   * High-Fidelity Academic Simulation Fallback for AI-Resilience Assessment Generation
   */
  simulateResilientAssessment({
    courseName,
    cloStatement,
    plo,
    taxonomy,
    assessmentType = 'assignment',
    conceptTopic = '',
    localContext = '',
    pillars = { p1: true, p2: true, p3: true },
    errorNote = null
  }) {
    const text = `${courseName} ${cloStatement} ${conceptTopic}`.toLowerCase();

    // Type Title Map
    const typeTitles = {
      assignment: 'Design & Diagnostic Engineering Assignment',
      quiz: 'In-Class Conceptual Audit & AI-Critique Quiz',
      exam_question: 'Examination Analytical Problem & Design Question',
      lab_practical: 'Laboratory Hardware Audit & Practical Task'
    };
    const instrumentTitle = typeTitles[assessmentType] || 'AI-Resilient Engineering Assessment';

    // Domain detection
    let domain = 'embedded';
    if (text.includes('power') || text.includes('inverter') || text.includes('converter') || text.includes('smps') || text.includes('pwm') || text.includes('motor')) {
      domain = 'power';
    } else if (text.includes('dsp') || text.includes('signal') || text.includes('filter') || text.includes('fft') || text.includes('discrete') || text.includes('fourier')) {
      domain = 'dsp';
    } else if (text.includes('control') || text.includes('stability') || text.includes('pid') || text.includes('root locus') || text.includes('feedback') || text.includes('transfer')) {
      domain = 'control';
    } else if (text.includes('comm') || text.includes('wireless') || text.includes('telecom') || text.includes('antenna') || text.includes('modulation')) {
      domain = 'telecom';
    }

    // Domain data presets
    const domainModels = {
      embedded: {
        concept: conceptTopic || 'I2C Bus Clock Stretching & Arbitration Failure under High Capacitive Load',
        context: localContext || 'Department Hardware Laboratory Bench #3; STM32F401RE Nucleo board connected to DS3231 RTC and 24C32 EEPROM; 2.2kΩ pull-up resistors on 3.3V bus with 180pF stray bus capacitance measured on Rigol DS1054Z oscilloscope.',
        fracture: 'A conventional question asking "Explain I2C bus arbitration and calculate pull-up resistors" is trivially answered by LLMs with high surface fluency. The student produces zero evidence of knowing how physical bus capacitance, ground bounce, or slave clock-hold delays cause real-world communication hangs.',
        whyFails: 'LLMs reproduce textbook timing specs instantly, concealing whether the student understands non-ideal hardware realities.',
        p1Evidence: [
          'Logic Analyzer / Oscilloscope Waveform Capture: Timestamped screenshot of SCL/SDA during arbitration loss with active cursors measuring 10%-90% rise time t_r.',
          'Engineering Decision & Debug Log: A 4-entry table showing attempted pull-up resistor adjustments (10kΩ, 4.7kΩ, 2.2kΩ) and observing bus clock degradation.',
          'Reflective Margin Notes: Hand-written margin annotations on the logic trace explaining the exact microsecond when the slave held SCL low, causing master timeout.'
        ],
        loadbearing: 'Loadbearing essentials: Open-drain output driver with external pull-up establishing passive high logic; wired-AND contention resolution. (Incidental: library baud-rate macro helpers, pin multiplexer numbers).',
        aiPrompt: 'Prompt an AI model with: "Provide C code and circuit schematic to interface an STM32 with two I2C slaves and calculate the pull-up resistor values."',
        aiCritique: 'Students must identify that the AI model failed to check maximum pin sink current (I_OL = 3mA on STM32) and assumed ideal zero bus capacitance, which causes waveform rounding and bus freeze on physical hardware.'
      },
      power: {
        concept: conceptTopic || 'Space Vector PWM vs SPWM Dead-Time Shoot-Through & Thermal Budget',
        context: localContext || 'Power Systems Laboratory Bench #2; 10kW 3-phase SiC MOSFET inverter prototype; 400V DC link voltage; 50kHz switching frequency; heatsink thermal resistance R_th = 0.85 °C/W under 40°C ambient room conditions.',
        fracture: 'Asking "Differentiate between SPWM and SVPWM modulation index" is completely answered by AI models with clean LaTeX formulas and textbook vector hexagons. The student bypasses physical dead-time insertion calculations and thermal runaway prevention.',
        whyFails: 'Generative AI produces immaculate mathematical derivations but cannot verify whether the calculated dead-time prevents shoot-through during inductive reverse recovery.',
        p1Evidence: [
          'Gate-Drive Timing Verification Waveform: Annotated oscilloscope trace showing complementary PWM gate signals with measured dead-time t_dead (min 250ns).',
          'Thermal Calculation Scratchpad: Step-by-step mathematical sheet showing conduction loss P_cond vs switching loss P_sw balance across switching frequencies.',
          'Decision Log on Gate Resistor Selection: Justification of turn-on resistor R_g(on) vs turn-off resistor R_g(off) to suppress parasitic dV/dt turn-on.'
        ],
        loadbearing: 'Loadbearing essentials: Non-overlapping complementary switching states with mandatory dead-band insertion, and volt-second balance across phase inductors. (Incidental: software lookup table array format).',
        aiPrompt: 'Prompt an AI model with: "Write a complete Space Vector PWM algorithm in C for a 3-phase inverter with 50kHz switching and calculate thermal heatsink requirements."',
        aiCritique: 'Students must prove the AI omitted parasitic body-diode reverse recovery losses Q_rr and assumed infinite gate-drive current, which would destroy the upper MOSFETs in a physical inverter test.'
      },
      dsp: {
        concept: conceptTopic || 'Fixed-Point Quantization Limit Cycles & Coefficient Rounding in Biquad Filters',
        context: localContext || 'DSP Simulation & Hardware Suite; TMS320C6748 starter kit; 16-bit Q15 signed arithmetic; real-time electromyogram (EMG) biological signal input sampled at 8kHz with 50Hz mains hum.',
        fracture: 'Asking "Design a 4th order Butterworth notch filter and plot its frequency response" allows AI to spit out MATLAB/Python code in 3 seconds. The student never grapples with coefficient sensitivity, pole migration outside the unit circle, or overflow limit cycles.',
        whyFails: 'AI assumes 64-bit double precision floating-point mathematics where quantization noise does not exist, hiding the student lack of finite wordlength understanding.',
        p1Evidence: [
          'Direct-Form I vs Direct-Form II Flowgraph Scratchpad: Hand-sketched pole-zero constellation with circled sensitive poles closest to unit circle |z| = 1.',
          'Quantization Error Spectrum: FFT plot comparing theoretical floating-point notch depth against 16-bit fixed-point Q15 output with visible noise floor rise.',
          'Overflow Mitigation Log: Code walk-through with comments showing where headroom scaling bits were inserted to eliminate limit-cycle oscillation.'
        ],
        loadbearing: 'Loadbearing essentials: Pole positions determining stability (|p_i| < 1), quantization noise feedback, and internal accumulator saturation arithmetic. (Incidental: MATLAB butter() function syntax).',
        aiPrompt: 'Prompt an AI model with: "Generate C code for an IIR biquad notch filter to remove 50Hz noise from an 8kHz sampled signal on an embedded DSP processor."',
        aiCritique: 'Students must demonstrate that the AI generated Direct-Form II code using float variables that causes catastrophic overflow and limit cycles when deployed on a fixed-point DSP without intermediate scaling.'
      },
      control: {
        concept: conceptTopic || 'Root Locus Right-Half Plane Migration under Actuator Saturation & Transport Delay',
        context: localContext || 'Control Systems Lab Bench #5; Quanser rotary inverted pendulum system; motor torque saturation at ±10V; 25ms communication transport delay across CAN-bus feedback loop.',
        fracture: 'Asking "Sketch the root locus for a given open-loop transfer function and find the gain for 10% overshoot" is instantly solved by AI math engines. The student completely avoids understanding non-linear actuator windup and phase margin erosion from delay.',
        whyFails: 'AI solves linear unconstrained s-domain formulas perfectly but misses physical non-linearities like integrator windup and discrete transport delay.',
        p1Evidence: [
          'Hand-Drawn Root Locus Construction Sketch: Step-by-step asymptote angles, breakaway points, and jω-axis crossing calculations before any software verification.',
          'Anti-Windup Diagnostic Log: Comparison of step response with standard PID vs PID with back-calculation anti-windup clamping under saturation.',
          'Delay Margin Derivation Sheet: Bode plot calculation demonstrating phase lag margin drop Δφ = ω_gc · T_delay.'
        ],
        loadbearing: 'Loadbearing essentials: Closed-loop pole trajectory dependence on open-loop poles/zeros; phase margin degradation due to pure time delay e^(-sT). (Incidental: GUI PID tuning slider values).',
        aiPrompt: 'Prompt an AI model with: "Design a lead-lag controller for an unstable pendulum system to achieve 1.5s settling time and zero steady-state error."',
        aiCritique: 'Students must show that the AI suggested excessive high-frequency controller gain that demands 45V from an amplifier with a ±10V rail limit, driving the physical motor into deep saturation and instability.'
      },
      telecom: {
        concept: conceptTopic || 'Bit Error Rate Degradation under Multi-Path Rayleigh Fading & Doppler Spread',
        context: localContext || 'Wireless Communications Bench #1; USRP B210 Software Defined Radio; QPSK modulation at 2.4GHz carrier; simulated vehicle Doppler shift of 120Hz with 3-tap multipath channel.',
        fracture: 'Asking "Derive the theoretical BER formula for QPSK over an AWGN channel" is generated with zero cognitive involvement by LLMs.',
        whyFails: 'AI recites textbook equations from Proakis without testing whether the student can reconcile carrier frequency offset (CFO) and timing recovery slips in real RF.',
        p1Evidence: [
          'Constellation Diagram Capture: IQ scatter plot before and after Costas loop phase lock, showing constellation rotation and phase noise.',
          'BER Measurement Sheet: Logarithmic plot of SNR vs BER with plotted experimental dots against theoretical AWGN curve.',
          'Reflective Notes on Timing Slip: Diagnostic description of why the Gardner timing error detector failed under low SNR.'
        ],
        loadbearing: 'Loadbearing essentials: Orthogonal phase quadrature demodulation, matched filtering for ISI minimization, and phase synchronization loop bandwidth. (Incidental: GNU Radio block arrangement).',
        aiPrompt: 'Prompt an AI model with: "Design a complete digital receiver in Python to demodulate QPSK with Rayleigh fading and carrier frequency offset."',
        aiCritique: 'Students must identify that the AI model assumed ideal channel state information (CSI) and perfect symbol synchronization, which fails completely when Doppler shift exceeds the loop filter bandwidth.'
      }
    };

    const model = domainModels[domain];
    const vulnSpectrum = {
      C1: { rating: 'Very High', label: 'C1 Remember - High AI Exposure' },
      C2: { rating: 'Very High', label: 'C2 Understand - High AI Exposure' },
      C3: { rating: 'High', label: 'C3 Apply - Moderate/High AI Exposure' },
      C4: { rating: 'Threshold Level', label: 'C4 Analyse - AI-RLI Primary Operational Zone' },
      C5: { rating: 'Resilient with Evidence', label: 'C5 Evaluate - Defended Judgment' },
      C6: { rating: 'Most Resilient', label: 'C6 Create - Original Synthesis' }
    };
    const currentTax = (taxonomy || 'C4').toUpperCase();
    const vulnInfo = vulnSpectrum[currentTax] || vulnSpectrum.C4;

    const resilientPromptText = `[AI-Resilient ${instrumentTitle}]\n` +
      `Anchored Context: In ${model.context}, investigate ${model.concept}.\n\n` +
      `Mandatory Deliverables (AI-RLI 3-Pillar Protocol):\n` +
      `1. Visible Process Evidence (P1): Submit your intermediate development notes and diagnostics: ${model.p1Evidence[0]}.\n` +
      `2. Traceable Real-World Grounding (P2): Conduct measurements on your assigned laboratory bench, recording equipment serial numbers, ambient tolerances, and physical waveform anomalies.\n` +
      `3. Structural Analysis & AI Critique (P3): ${model.loadbearing} Then, feed the following prompt to an LLM: "${model.aiPrompt}". Submit a detailed 200-word critique pinpointing where the AI output broke down, oversimplified engineering constraints, or gave physically hazardous advice.`;

    const vulnerablePromptText = `[Conventional AI-Vulnerable Prompt]\n` +
      `Explain the technical principles of ${model.concept}. Discuss how it operates in electrical engineering systems and calculate the ideal values using standard formulas. Provide relevant examples.`;

    return {
      assessmentType: assessmentType,
      assessmentTitle: `${model.concept} — ${instrumentTitle}`,
      courseName: courseName,
      clo: {
        statement: cloStatement || `Analyze engineering principles related to ${model.concept}`,
        plo: plo || 'PLO-2',
        taxonomy: taxonomy || 'C4'
      },
      conceptTopic: model.concept,
      vulnerabilityDiagnosis: {
        spectrumLevel: vulnInfo.label,
        vulnerabilityRating: vulnInfo.rating,
        assessmentFracture: model.fracture,
        whyConventionalFails: model.whyFails
      },
      threePillarArchitecture: {
        p1Process: {
          pillar: 'P1: Process > Product',
          requiredEvidence: model.p1Evidence
        },
        p2Context: {
          pillar: 'P2: Contextualization',
          traceableContextDetails: model.context
        },
        p3ConceptualDepth: {
          pillar: 'P3: Conceptual Depth & AI Critique',
          loadbearingStructure: model.loadbearing,
          aiCritiquePrompt: model.aiPrompt,
          expectedStudentCritique: model.aiCritique
        }
      },
      comparisonView: {
        vulnerablePrompt: vulnerablePromptText,
        resilientPrompt: resilientPromptText
      },
      studentFacingBrief: {
        title: `${instrumentTitle}: ${model.concept}`,
        scenario: `You are serving as the lead test and verification engineer responsible for validating hardware performance and diagnosing non-ideal operational anomalies in a safety-critical engineering subsystem.`,
        tasks: [
          `Task 1 (Contextual Setup & Empirical Capture): Configure the testing setup on your assigned laboratory hardware bench (${model.context.slice(0, 80)}...). Capture raw waveform or signal telemetry.`,
          `Task 2 (Process Artifact - Engineering Decision Log): Maintain a chronological scratchpad/log documenting your iterative adjustments, parameter sweeps, and how unexpected hardware deviations were resolved.`,
          `Task 3 (Structural Analysis): Distil the core phenomenon to its minimal non-negotiable physical laws vs incidental software artifacts.`,
          `Task 4 (AI Critique Challenge): Execute the AI interrogation prompt (${model.aiPrompt.slice(0, 60)}...). Highlight at least two critical omissions or misleading assumptions in the generated response.`
        ],
        deliverables: [
          'PDF Technical Brief with verified laboratory telemetry, bench serial numbers, and equipment photos',
          'Chronological Engineering Decision Log detailing trial adjustments and cognitive problem-solving path',
          '1-Page AI Critical Appraisal detailing discrepancies between theoretical AI assumptions and live bench realities'
        ]
      },
      markingRubric: [
        {
          criteria: 'P1: Visible Cognitive Process & Decision Log',
          marks: 25,
          descriptor: 'Clear evidence of authentic problem-solving: intermediate calculation drafts, debug iterations, and annotated reflection on obstacles.'
        },
        {
          criteria: 'P2: Traceable Contextual & Empirical Grounding',
          marks: 25,
          descriptor: 'Explicitly anchored to live bench equipment, specific tolerances, and verifiable local measurements that cannot be generated by remote LLMs.'
        },
        {
          criteria: 'P3: Conceptual Depth & Structural Rigor',
          marks: 25,
          descriptor: 'Articulates the minimal non-negotiable physical elements of the concept and distinguishes them from incidental implementation details.'
        },
        {
          criteria: 'P3: AI Critique & Flaw Detection Rigor',
          marks: 25,
          descriptor: 'Thoroughly exposes where generative AI outputs hallucinate, omit critical real-world constraints, or provide unrealistic engineering recommendations.'
        }
      ],
      totalMarks: 100,
      moderationNotes: `Accreditation QA Note: This assessment format fulfills Washington Accord WP1-WP7 criteria by evaluating real physical constraints, non-ideal tolerances, and human evaluative judgment over generative AI surrogates.`,
      isSimulated: true,
      simulationNotice: errorNote ? `Live API note: ${errorNote}` : 'Generated via Academic AI-RLI Assessment Architect (PEC Framework)'
    };
  }

  /**
   * Evaluates & Redesigns Course Syllabus and Assessment under the Learning Beyond AI (LBAI) Framework
   * Learning Innovation Center (LIC) - Student Pedagogy Partnership (SPP) Model
   */
  async evaluateLBAI({ courseName, courseDescription, targetCLO, topic, assessmentTasks = [] }) {
    if (!this.hasApiKey()) {
      return this.simulateLBAI({ courseName, courseDescription, targetCLO, topic });
    }

    const systemPrompt = `You are a Senior Academic Pedagogy Specialist and Curriculum Architect specializing in the "Learning Beyond AI (LBAI)" framework from the Learning Innovation Center (LIC).
The core philosophy is: "The long-term response to generative AI is not to restrict its use, but to establish classrooms and assessments that strengthen human intelligence."

Framework Architecture:
1. Three Pillars:
   - Pillar 1: Visible Thinking (Harvard Project Zero 9 Core Routines, Ritchhart et al., 2011; makes reasoning observable, builds mental muscles).
   - Pillar 2: Relational Application (Fink's Integration & Application; connects theory to authentic, lived, local, or community challenges).
   - Pillar 3: Conceptual Mastery (Fink's Foundational Knowledge & Integration; requires students to explain, justify, critique, synthesize, transfer, and critique AI outputs).
2. The Two-Lane Assessment Model (Bridgeman, Liu & Weeks, 2024):
   - Secured Lane: Observed, invigilated, or dialogic (examinations, in-class concept mapping, interactive oral viva voce, observed practicals).
   - Open Lane: Unsupervised tasks with declared AI use on the AI Assessment Scale (AIAS Levels 1 to 4).
3. Permitted Use Scale (AIAS):
   - Level 0: No AI (Secured lane only)
   - Level 1: AI for Planning (Brainstorming/structure; disclosure of tools/prompts)
   - Level 2: AI Collaboration (Drafting with substantial student revision; disclosure + annotated log)
   - Level 3: AI Evaluation (Student generates AI output & critiques it against standards; the critique is the assessed artifact)
   - Level 4: AI Exploration (Student designs AI workflow; reflective portfolio)

Evaluate the given course, target CLO, and technical topic, and generate an actionable LBAI Redesign Dossier.

Respond strictly with valid JSON:
{
  "courseOverview": {
    "courseName": "string",
    "topic": "string",
    "targetCLO": "string",
    "pedagogicalVerdict": "string (1-2 sentences summarizing transformation)"
  },
  "pillar1VisibleThinking": {
    "recommendedRoutine": "Name of Harvard PZ Routine (e.g., Claim-Support-Question / See-Think-Wonder)",
    "routineCategory": "string",
    "classroomInstruction": "Specific, step-by-step prompt for students to externalize their cognitive reasoning",
    "rationale": "Why this routine prevents passive cognitive offloading to AI in this topic"
  },
  "pillar2RelationalApplication": {
    "authenticContext": "Real-world engineering, industrial, or local community scenario",
    "taskDesign": "Hands-on or project-based challenge requiring students to apply theory to messy, non-ideal conditions",
    "finkDimension": "Application / Integration"
  },
  "pillar3ConceptualMastery": {
    "depthQuestion": "Probing conceptual question testing fundamental physical principles vs procedural steps",
    "aiCritiqueTask": {
      "promptForAI": "Exact prompt student instructs AI to generate",
      "critiqueCriteria": "Specific technical flaws, omissions, or unrealistic assumptions students must identify"
    }
  },
  "twoLaneAssessmentPlan": [
    {
      "task": "string",
      "lane": "Secured or Open",
      "aiLevel": 0,
      "aiLabel": "Level 0: No AI / Level 1..4",
      "weight": 10,
      "evidence": "string"
    }
  ],
  "weightingSummary": {
    "securedSubtotal": 55,
    "openSubtotal": 45,
    "total": 100,
    "pedagogicalBalanceComment": "string"
  },
  "finkTaxonomyAlignment": [
    { "dimension": "Foundational Knowledge", "alignmentAction": "string" },
    { "dimension": "Application Skills", "alignmentAction": "string" },
    { "dimension": "Integration", "alignmentAction": "string" },
    { "dimension": "Human Dimension", "alignmentAction": "string" },
    { "dimension": "Caring", "alignmentAction": "string" },
    { "dimension": "Learning How to Learn", "alignmentAction": "string" }
  ]
}`;

    const userContent = `Course Title: ${courseName}
Course Description: ${courseDescription}
Target CLO: ${targetCLO}
Technical Topic: ${topic}`;

    try {
      const response = await this.callGeminiAPI(systemPrompt, userContent);
      const parsed = this.parseJSONResponse(response);
      parsed.isSimulated = false;
      return parsed;
    } catch (err) {
      console.warn('Live LBAI evaluation failed, using simulation engine:', err);
      return this.simulateLBAI({ courseName, courseDescription, targetCLO, topic, errorNote: err.message });
    }
  }

  /**
   * Offline / Simulation Generator for Learning Beyond AI Framework
   */
  simulateLBAI({ courseName = 'EE-312 Microcontroller & Embedded Systems', courseDescription = '', targetCLO = '', topic = '', errorNote = null }) {
    const isPower = courseName.toLowerCase().includes('power') || courseName.toLowerCase().includes('415');
    
    if (isPower) {
      return {
        courseOverview: {
          courseName: courseName || 'EE-415 Power Electronics & Drives',
          topic: topic || 'Multi-Level PWM Inverter Harmonics & Heat Sink Thermal Budgeting',
          targetCLO: targetCLO || 'Evaluate the total harmonic distortion (THD) and thermal dissipation in multi-level PWM inverter topologies for grid-tied photovoltaic systems.',
          pedagogicalVerdict: 'Transforms a traditional theoretical circuit calculation into a multi-layered investigation of physical thermal limits, IEEE-519 grid standards, and critical AI code audits.'
        },
        pillar1VisibleThinking: {
          recommendedRoutine: 'What Makes You Say That? (Interpretation with Justification)',
          routineCategory: 'Reasoning with Evidence',
          classroomInstruction: 'Present thermal camera captures of an IGBT bridge under unexpected thermal runaway. Before consulting formulas, students must write 3 observable cues and defend why they indicate junction overheating vs gate-drive ringing.',
          rationale: 'Forces students to ground assertions in physical evidence before querying AI, establishing independent cognitive observation.'
        },
        pillar2RelationalApplication: {
          authenticContext: 'Rooftop 10kW commercial grid-tied PV inverter operating in high ambient temperature (Lahore 45°C ambient summer environment) with dusty heatsink fins.',
          taskDesign: 'Calculate actual heat sink thermal resistance R_th required when ambient derating factors and switching frequency losses (50 kHz SiC MOSFETs) are factored into IEEE-519 harmonic standards.',
          finkDimension: 'Application & Integration'
        },
        pillar3ConceptualMastery: {
          depthQuestion: 'Why does increasing switching frequency reduce filter inductor size while simultaneously precipitating thermal destruction in semiconductor junctions?',
          aiCritiqueTask: {
            promptForAI: 'Write an optimized SPWM modulation algorithm in C for an H-bridge inverter switching at 50kHz.',
            critiqueCriteria: 'Students must audit the AI code for missing dead-time shoot-through prevention delays, omitted gate-charge current limitations, and unrealistic switching rise times.'
          }
        },
        twoLaneAssessmentPlan: [
          { id: 1, task: 'Assignment 1: Inverter Topology Concept Map', lane: 'Secured', aiLevel: 0, aiLabel: 'Level 0: In-Class Hand Draft', weight: 5, evidence: 'In-class sketch with handwritten justification' },
          { id: 2, task: 'Assignment 2: Harmonic Standard Comparative Analysis', lane: 'Open', aiLevel: 1, aiLabel: 'Level 1: AI for Planning', weight: 5, evidence: 'Disclosure statement of prompt prompts and literature search' },
          { id: 3, task: 'Assignment 3: Thermal Budgeting Case Study', lane: 'Open', aiLevel: 2, aiLabel: 'Level 2: AI Collaboration', weight: 10, evidence: 'Annotated simulation model with changelog' },
          { id: 4, task: 'Assignment 4: AI Modulation Code Security Audit', lane: 'Open', aiLevel: 3, aiLabel: 'Level 3: AI Evaluation', weight: 10, evidence: 'The code flaw critique report is the assessed artifact' },
          { id: 5, task: 'Assignment 5: Reflection Portfolio on Non-Idealities', lane: 'Open', aiLevel: 4, aiLabel: 'Level 4: AI Exploration', weight: 10, evidence: 'Engineering log detailing iterative decisions' },
          { id: 6, task: 'Midterm Examination (In-depth derivations)', lane: 'Secured', aiLevel: 0, aiLabel: 'Level 0: Invigilated', weight: 20, evidence: 'Closed-book invigilated exam hall' },
          { id: 7, task: 'Comprehensive Final Examination', lane: 'Secured', aiLevel: 0, aiLabel: 'Level 0: Invigilated', weight: 25, evidence: 'Comprehensive invigilated exam hall' },
          { id: 8, task: 'Hardware Inverter Prototype / Simulation Artefact', lane: 'Open', aiLevel: 2, aiLabel: 'Level 2: AI Collaboration', weight: 10, evidence: 'Working model with hardware measurement logs' },
          { id: 9, task: 'Interactive Oral Defence (Viva Voce)', lane: 'Secured', aiLevel: 0, aiLabel: 'Level 0: Observed', weight: 5, evidence: 'Individual questioning on design trade-offs' }
        ],
        weightingSummary: {
          securedSubtotal: 55,
          openSubtotal: 45,
          total: 100,
          pedagogicalBalanceComment: 'Optimal 55/45 distribution: Secured Lane verifies core electromagnetic & semiconductor physics mastery; Open Lane develops rigorous AI critique and real-world synthesis.'
        },
        finkTaxonomyAlignment: [
          { dimension: 'Foundational Knowledge', alignmentAction: 'Mastery of semiconductor switching characteristics, Fourier harmonic analysis, and thermal impedance laws.' },
          { dimension: 'Application Skills', alignmentAction: 'Designing heat sinks, sizing LC filters, and configuring microcontroller PWM registers.' },
          { dimension: 'Integration', alignmentAction: 'Connecting power conversion with solar PV intermittency, grid code compliance, and climate impacts.' },
          { dimension: 'Human Dimension', alignmentAction: 'Recognizing the engineer responsibility for public electrical safety and grid stability.' },
          { dimension: 'Caring', alignmentAction: 'Valuing energy efficiency, equipment longevity, and renewable energy adoption.' },
          { dimension: 'Learning How to Learn', alignmentAction: 'Developing habits of validating AI circuit suggestions against fundamental semiconductor datasheets.' }
        ],
        isSimulated: true,
        simulationNotice: errorNote ? `Live API note: ${errorNote}` : 'Generated via Learning Beyond AI (LBAI) Pedagogical Engine (LIC Framework)'
      };
    }

    // Default: Embedded Systems
    return {
      courseOverview: {
        courseName: courseName || 'EE-312 Microcontroller & Embedded Systems',
        topic: topic || 'I2C Bus Contention, Clock Stretching & Interrupt Prioritization',
        targetCLO: targetCLO || 'Analyze timing diagrams and register configurations for high-speed serial peripherals (SPI and I2C) to diagnose data transmission bottlenecks.',
        pedagogicalVerdict: 'Transforms low-level peripheral programming from rote syntax memorization into deep diagnostic inquiry, physical hardware grounding, and critical verification of AI-generated firmware.'
      },
      pillar1VisibleThinking: {
        recommendedRoutine: 'Claim - Support - Question (Harvard Project Zero)',
        routineCategory: 'Critical AI Evaluation & Evidence',
        classroomInstruction: 'Display an I2C logic analyzer waveform showing an unexpected 400µs low pulse on SCL. 1. Students formulate a CLAIM on why the bus froze. 2. SUPPORT it with timing calculations. 3. Formulate a QUESTION regarding register interrupt priorities.',
        rationale: 'Forces students to make reasoning visible on paper and debate with peers before looking for automated AI diagnostic answers.'
      },
      pillar2RelationalApplication: {
        authenticContext: 'Department Embedded IoT Testbench: Multi-sensor health telemetry node where a high-bandwidth IMU and slow EEPROM share the same physical I2C bus under battery power.',
        taskDesign: 'Connect STM32 Nucleo hardware to physical sensors on the lab bench. Intentionally introduce bus capacitance and measure clock-stretching latency on an oscilloscope, resolving bus lockups without AI shortcuts.',
        finkDimension: 'Application & Integration'
      },
      pillar3ConceptualMastery: {
        depthQuestion: 'Explain why software polling of an I2C status flag inside a high-priority Timer ISR causes complete system deadlock, even if the bus speed is set to 400 kHz.',
        aiCritiqueTask: {
          promptForAI: 'Write an interrupt-driven I2C master transmit function for STM32 using HAL libraries.',
          critiqueCriteria: 'Students critique the AI code for blocking while loops inside callbacks, lack of bus timeout recovery, and unhandled arbitration loss flags.'
        }
      },
      twoLaneAssessmentPlan: [
        { id: 1, task: 'Assignment 1: Peripheral Architecture Concept Map', lane: 'Secured', aiLevel: 0, aiLabel: 'Level 0: In-Class Hand Draft', weight: 5, evidence: 'Completed in class under observation' },
        { id: 2, task: 'Assignment 2: Sensor Protocol Comparative Review', lane: 'Open', aiLevel: 1, aiLabel: 'Level 1: AI for Planning', weight: 5, evidence: 'Disclosure statement naming AI brainstorming prompts' },
        { id: 3, task: 'Assignment 3: Telemetry Device Case Study', lane: 'Open', aiLevel: 2, aiLabel: 'Level 2: AI Collaboration', weight: 10, evidence: 'Annotated firmware with change tracking and explanation' },
        { id: 4, task: 'Assignment 4: AI Firmware Flaw Audit & Critique', lane: 'Open', aiLevel: 3, aiLabel: 'Level 3: AI Evaluation', weight: 10, evidence: 'The critique document itself is the graded artifact' },
        { id: 5, task: 'Assignment 5: Embedded Engineering Decision Journal', lane: 'Open', aiLevel: 4, aiLabel: 'Level 4: AI Exploration', weight: 10, evidence: 'Reflective portfolio with complete workflow trail' },
        { id: 6, task: 'Midterm Examination (Timing & Register Analysis)', lane: 'Secured', aiLevel: 0, aiLabel: 'Level 0: Invigilated', weight: 20, evidence: 'Invigilated exam hall' },
        { id: 7, task: 'Comprehensive Final Examination', lane: 'Secured', aiLevel: 0, aiLabel: 'Level 0: Invigilated', weight: 25, evidence: 'Comprehensive invigilated exam hall' },
        { id: 8, task: 'Hardware Telemetry Prototype Project', lane: 'Open', aiLevel: 2, aiLabel: 'Level 2: AI Collaboration', weight: 10, evidence: 'Working embedded prototype with oscilloscope logs' },
        { id: 9, task: 'Interactive Oral Defence (Viva Voce on Bench)', lane: 'Secured', aiLevel: 0, aiLabel: 'Level 0: Observed', weight: 5, evidence: 'Live bench questioning on hardware faults' }
      ],
      weightingSummary: {
        securedSubtotal: 55,
        openSubtotal: 45,
        total: 100,
        pedagogicalBalanceComment: 'Balanced 55% Secured (independent competence) / 45% Open (authentic AI partnership), meeting both PEC accreditation rigor and modern AI literacy.'
      },
      finkTaxonomyAlignment: [
        { dimension: 'Foundational Knowledge', alignmentAction: 'Understanding register-level bitfields, bus protocols (SPI/I2C/UART), and interrupt vectors.' },
        { dimension: 'Application Skills', alignmentAction: 'Configuring peripherals, writing non-blocking drivers, and operating digital logic analyzers.' },
        { dimension: 'Integration', alignmentAction: 'Connecting microcontroller timing constraints to real-world sensor specifications and physical bus parasitics.' },
        { dimension: 'Human Dimension', alignmentAction: 'Collaborating in firmware review teams and understanding safety-critical implications in medical/automotive devices.' },
        { dimension: 'Caring', alignmentAction: 'Developing pride in robust, fail-safe code architecture and battery conservation.' },
        { dimension: 'Learning How to Learn', alignmentAction: 'Developing the capability to consult microchip reference manuals to rigorously critique AI code suggestions.' }
      ],
      isSimulated: true,
      simulationNotice: errorNote ? `Live API note: ${errorNote}` : 'Generated via Learning Beyond AI (LBAI) Pedagogical Engine (LIC Framework)'
    };
  }
}


export const geminiEngine = new GeminiOBEEvaluator();

