// Clean Accreditation PDF Generator & Print Formatter
// Builds vector-clean official reports for Departmental QA & Visiting Accreditation Teams

import { PLO_LIST, TAXONOMY_LEVELS } from './constants.js';

export class PDFReportGenerator {
  /**
   * Generates a formal, printable CLO Quality Audit Dossier
   */
  static generateCLOReport({ courseName, courseDescription, coursePlan, clos, evaluation }) {
    // Generate clean printable window or trigger jsPDF if loaded
    const printContainer = document.createElement('div');
    printContainer.id = 'print-dossier-root';
    printContainer.className = 'print-dossier';

    const timestamp = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const overall = evaluation.overallSetAnalysis || {};
    const cloResults = evaluation.cloResults || [];

    printContainer.innerHTML = `
      <div style="font-family: 'Inter', system-ui, sans-serif; color: #0f172a; max-width: 800px; margin: 0 auto; padding: 24px;">
        <!-- Official Institutional Header -->
        <div style="border-bottom: 2px solid #f27d26; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <img src="./public/assets/FOE_Logo_WBG.png" style="height: 44px; width: auto; object-fit: contain;" alt="Faculty of Engineering" />
            <div style="border-left: 2px solid #f27d26; padding-left: 12px;">
              <h1 style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">FACULTY OF ENGINEERING</h1>
              <h2 style="margin: 2px 0 0; font-size: 13px; font-weight: 700; color: #f27d26; text-transform: uppercase;">Department of Electrical Engineering</h2>
              <p style="margin: 3px 0 0; font-size: 10px; color: #64748b;">OBE Quality Assurance • PEC 11 PLO Accreditation Framework</p>
            </div>
          </div>
          <div style="text-align: right;">
            <span style="display: inline-block; background: #fff7ed; border: 1px solid #fdba74; color: #c2410c; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px;">
              ACCREDITATION AUDIT DOSSIER
            </span>
            <p style="margin: 4px 0 0; font-size: 10px; color: #94a3b8;">Ref: PEC-EED-${Date.now().toString().slice(-6)}</p>
          </div>
        </div>

        <!-- Course Metadata Box -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 4px 8px; font-weight: 700; color: #475569; width: 140px;">Course Title:</td>
              <td style="padding: 4px 8px; font-weight: 600; color: #0f172a;">${courseName || 'N/A'}</td>
              <td style="padding: 4px 8px; font-weight: 700; color: #475569; width: 140px;">Date of Audit:</td>
              <td style="padding: 4px 8px; color: #334155;">${timestamp}</td>
            </tr>
            <tr>
              <td style="padding: 4px 8px; font-weight: 700; color: #475569; vertical-align: top;">Course Scope:</td>
              <td colspan="3" style="padding: 4px 8px; color: #334155; line-height: 1.4;">${courseDescription || 'N/A'}</td>
            </tr>
            ${coursePlan ? `
            <tr>
              <td style="padding: 4px 8px; font-weight: 700; color: #475569; vertical-align: top;">Course Plan:</td>
              <td colspan="3" style="padding: 4px 8px; color: #334155; line-height: 1.4; font-family: monospace; font-size: 11px; white-space: pre-line;">${coursePlan.length > 220 ? coursePlan.slice(0, 220) + '...' : coursePlan}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 4px 8px; font-weight: 700; color: #475569;">Accreditation Index:</td>
              <td colspan="3" style="padding: 4px 8px;">
                <span style="font-size: 14px; font-weight: 800; color: #c2410c;">CLO Quality: ${overall.coverageScore || '8.5'}/10</span>
                <span style="margin: 0 8px; color: #cbd5e1;">|</span>
                <span style="font-size: 14px; font-weight: 800; color: #059669;">Outline Quality: ${evaluation.outlineAnalysis?.outlineScore || '8.2'}/10</span>
                <span style="margin: 0 8px; color: #cbd5e1;">|</span>
                <span style="font-size: 11px; font-weight: 800; background: #ecfdf5; color: #065f46; padding: 2px 8px; border-radius: 4px; border: 1px solid #a7f3d0;">
                  ${evaluation.readinessBadge || 'Accreditation Compliant'}
                </span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Executive Summary & Coherence Analysis -->
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px;">
            1. Executive Evaluation & Cognitive Laddering
          </h3>
          <p style="font-size: 12px; line-height: 1.6; color: #334155; margin: 0 0 10px;">${overall.summary || 'Course learning outcomes reflect technical depth and alignment with departmental educational goals.'}</p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 11px;">
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
              <strong style="color: #0f172a; display: block; margin-bottom: 4px;">Cognitive Progression:</strong>
              <span style="color: #475569;">${overall.progressionCheck || 'Adequate distribution across Bloom cognitive domains.'}</span>
            </div>
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
              <strong style="color: #0f172a; display: block; margin-bottom: 4px;">Competency Redundancy:</strong>
              <span style="color: #475569;">${overall.redundancyAssessment || 'No redundant outcomes detected.'}</span>
            </div>
          </div>
        </div>

        <!-- Detailed Outcome-by-Outcome Audit Table -->
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px;">
            2. Individual Outcome Auditing & Recommendations
          </h3>

          ${cloResults.map((res, i) => {
            const rawCLO = clos[i] || {};
            const isRetain = (res.verdict || 'RETAIN').toUpperCase() === 'RETAIN';
            const badgeBg = isRetain ? '#ecfdf5' : '#fffbeb';
            const badgeColor = isRetain ? '#047857' : '#b45309';
            const badgeBorder = isRetain ? '#a7f3d0' : '#fde68a';

            return `
              <div style="border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 16px; padding: 14px; background: #ffffff; break-inside: avoid;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
                  <div>
                    <span style="font-weight: 800; font-size: 13px; color: #0f172a;">CLO-${res.cloId || i+1}</span>
                    <span style="margin-left: 8px; font-size: 11px; background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 4px; font-weight: 600;">
                      Mapped: ${rawCLO.plo || 'PLO-1'} | Level: ${rawCLO.taxonomy || 'C2'}
                    </span>
                  </div>
                  <div>
                    <span style="font-size: 11px; font-weight: 700; color: #334155; margin-right: 8px;">Score: ${res.qualityScore}/10</span>
                    <span style="background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder}; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 4px;">
                      ${res.verdict || (isRetain ? 'RETAIN' : 'REVISE')}
                    </span>
                  </div>
                </div>

                <div style="font-size: 12px; margin-bottom: 8px;">
                  <span style="font-weight: 700; color: #64748b;">Current Statement:</span>
                  <p style="margin: 2px 0 0; color: #1e293b; font-style: italic;">"${rawCLO.statement || ''}"</p>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 11px; margin-bottom: 8px;">
                  <div style="background: #f0fdf4; border: 1px solid #dcfce7; padding: 8px; border-radius: 4px;">
                    <strong style="color: #166534; display: block; margin-bottom: 3px;">✓ Strengths:</strong>
                    <ul style="margin: 0; padding-left: 16px; color: #15803d; line-height: 1.4;">
                      ${(res.strengths || []).map(s => `<li>${s}</li>`).join('')}
                    </ul>
                  </div>
                  <div style="background: #fffbeb; border: 1px solid #fef3c7; padding: 8px; border-radius: 4px;">
                    <strong style="color: #92400e; display: block; margin-bottom: 3px;">⚠ Areas for Improvement:</strong>
                    <ul style="margin: 0; padding-left: 16px; color: #b45309; line-height: 1.4;">
                      ${(res.weaknesses || []).map(w => `<li>${w}</li>`).join('')}
                    </ul>
                  </div>
                </div>

                ${!isRetain || res.suggestedRevision !== rawCLO.statement ? `
                  <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 8px 12px; font-size: 11px; border-radius: 0 4px 4px 0;">
                    <strong style="color: #1e40af; display: block;">Suggested CQI Revision:</strong>
                    <span style="color: #1e3a8a; font-weight: 600;">"${res.suggestedRevision || ''}"</span>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>

        <!-- Section 3: Course Plan & Topical Outline Evaluation -->
        ${evaluation.outlineAnalysis ? `
          <div style="margin-bottom: 24px; break-inside: avoid;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 10px;">
              <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em; margin: 0;">
                3. Course Plan & Topical Syllabus Audit
              </h3>
              <span style="font-size: 12px; font-weight: 800; color: #059669; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 2px 8px; border-radius: 4px;">
                Outline Score: ${evaluation.outlineAnalysis.outlineScore || '8.0'} / 10
              </span>
            </div>

            <p style="font-size: 12px; line-height: 1.5; color: #334155; margin: 0 0 10px;">
              ${evaluation.outlineAnalysis.summary || ''}
            </p>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 11px; margin-bottom: 10px;">
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px;">
                <strong style="color: #0f172a; display: block; margin-bottom: 3px;">Topical Breadth & Rigor:</strong>
                <span style="color: #475569;">${evaluation.outlineAnalysis.topicalBreadth || 'Satisfactory engineering depth.'}</span>
              </div>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px;">
                <strong style="color: #0f172a; display: block; margin-bottom: 3px;">Pacing & Contact Hours:</strong>
                <span style="color: #475569;">${evaluation.outlineAnalysis.pacingAssessment || 'Appropriate semester distribution.'}</span>
              </div>
            </div>

            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 10px; font-size: 11px; margin-bottom: 10px;">
              <strong style="color: #166534; display: block; margin-bottom: 3px;">Topic-to-CLO Constructive Alignment:</strong>
              <p style="margin: 0 0 4px; color: #15803d;">${evaluation.outlineAnalysis.alignmentSummary || ''}</p>
              ${evaluation.outlineAnalysis.unaddressedCLOs && evaluation.outlineAnalysis.unaddressedCLOs.length > 0 ? `
                <div style="color: #92400e; font-size: 10px; margin-top: 4px;">
                  <strong>Coverage Notes:</strong> ${evaluation.outlineAnalysis.unaddressedCLOs.join('; ')}
                </div>
              ` : ''}
            </div>

            ${evaluation.outlineAnalysis.outlineRecommendations && evaluation.outlineAnalysis.outlineRecommendations.length > 0 ? `
              <div style="background: #fafafa; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; font-size: 11px;">
                <strong style="color: #0f172a; display: block; margin-bottom: 3px;">Recommended Outline Improvements:</strong>
                <ul style="margin: 0; padding-left: 18px; color: #475569; line-height: 1.4;">
                  ${evaluation.outlineAnalysis.outlineRecommendations.map(r => `<li>${r}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        ` : ''}

        <!-- Official Sign-off Footer -->
        <div style="border-top: 1px solid #cbd5e1; padding-top: 20px; margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; text-align: center; font-size: 11px; color: #475569;">
          <div>
            <div style="border-bottom: 1px dashed #94a3b8; height: 35px; margin-bottom: 6px;"></div>
            <strong>Course Instructor</strong>
          </div>
          <div>
            <div style="border-bottom: 1px dashed #94a3b8; height: 35px; margin-bottom: 6px;"></div>
            <strong>OBE Coordinator (EED)</strong>
          </div>
          <div>
            <div style="border-bottom: 1px dashed #94a3b8; height: 35px; margin-bottom: 6px;"></div>
            <strong>Head of Department (EED)</strong>
          </div>
        </div>

        <div style="margin-top: 20px; text-align: center; font-size: 10px; color: #64748b; line-height: 1.5;">
          OBE-ICAS EED Platform • System Architecture & Implementation: <strong>Engr. Dr. Nabeel Khalid</strong><br/>
          Department of Electrical Engineering • Faculty of Engineering • Compliant with Washington Accord Rubrics • © 2026
        </div>
      </div>
    `;

    return printContainer;
  }

  /**
   * Generates a formal, printable Assessment Alignment Audit Dossier
   */
  static generateAssessmentReport({ courseName, questions, evaluation }) {
    const printContainer = document.createElement('div');
    printContainer.id = 'print-assessment-dossier';
    printContainer.className = 'print-dossier';

    const timestamp = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const qResults = evaluation.questions || [];

    printContainer.innerHTML = `
      <div style="font-family: 'Inter', system-ui, sans-serif; color: #0f172a; max-width: 800px; margin: 0 auto; padding: 24px;">
        <div style="border-bottom: 2px solid #f27d26; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <img src="./public/assets/FOE_Logo_WBG.png" style="height: 44px; width: auto; object-fit: contain;" alt="Faculty of Engineering" />
            <div style="border-left: 2px solid #f27d26; padding-left: 12px;">
              <h1 style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a;">FACULTY OF ENGINEERING</h1>
              <h2 style="margin: 2px 0 0; font-size: 13px; font-weight: 700; color: #f27d26; text-transform: uppercase;">Department of Electrical Engineering</h2>
              <p style="margin: 3px 0 0; font-size: 10px; color: #64748b;">Assessment Instrument Alignment • PEC 11 PLO Accreditation</p>
            </div>
          </div>
          <div style="text-align: right;">
            <span style="display: inline-block; background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px;">
              EXAM ALIGNMENT AUDIT
            </span>
            <p style="margin: 4px 0 0; font-size: 10px; color: #94a3b8;">Ref: EXAM-EED-${Date.now().toString().slice(-6)}</p>
          </div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 4px 8px; font-weight: 700; color: #475569; width: 140px;">Course Title:</td>
              <td style="padding: 4px 8px; font-weight: 600; color: #0f172a;">${courseName || 'N/A'}</td>
              <td style="padding: 4px 8px; font-weight: 700; color: #475569; width: 140px;">Audit Timestamp:</td>
              <td style="padding: 4px 8px; color: #334155;">${timestamp}</td>
            </tr>
            <tr>
              <td style="padding: 4px 8px; font-weight: 700; color: #475569;">Total Alignment:</td>
              <td colspan="3" style="padding: 4px 8px;">
                <span style="font-size: 15px; font-weight: 800; color: #0f172a;">${evaluation.totalAlignmentScore || '7.5'} / 10</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 4px 8px; font-weight: 700; color: #475569; vertical-align: top;">Weight Distribution:</td>
              <td colspan="3" style="padding: 4px 8px; color: #334155;">${evaluation.marksDistribution || 'Balanced distribution'}</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 8px;">
            Assessment Instrument Summary
          </h3>
          <p style="font-size: 12px; line-height: 1.6; color: #334155; margin: 0;">${evaluation.overallSummary || ''}</p>
        </div>

        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 12px;">
            Question-Level Alignment Analysis
          </h3>
          ${qResults.map((q, i) => {
            const rawQ = questions[i] || {};
            const isAligned = q.alignmentVerdict === 'ALIGNED';
            return `
              <div style="border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 14px; padding: 12px; background: #ffffff; break-inside: avoid;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <span style="font-weight: 800; font-size: 13px; color: #0f172a;">Question ${rawQ.qNumber || i+1} (${rawQ.marks || 10} Marks)</span>
                  <span style="font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: ${isAligned ? '#ecfdf5' : '#fef2f2'}; color: ${isAligned ? '#047857' : '#b91c1c'};">
                    ${q.alignmentVerdict} (${q.score}/10)
                  </span>
                </div>
                <p style="font-size: 12px; color: #1e293b; margin: 0 0 6px; font-style: italic;">"${rawQ.text || ''}"</p>
                <div style="font-size: 11px; color: #475569; background: #f8fafc; padding: 6px 10px; border-radius: 4px; margin-bottom: 6px;">
                  <strong>Cognitive Match:</strong> ${q.cognitiveMatch || 'Verified'}
                </div>
                ${q.suggestedRevision && q.suggestedRevision !== rawQ.text ? `
                  <div style="font-size: 11px; color: #1e3a8a; background: #eff6ff; padding: 6px 10px; border-left: 3px solid #3b82f6; border-radius: 0 4px 4px 0;">
                    <strong>Recommended Question Upgrade:</strong> "${q.suggestedRevision}"
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>

        <div style="border-top: 1px solid #cbd5e1; padding-top: 20px; margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; text-align: center; font-size: 11px; color: #475569;">
          <div>
            <div style="border-bottom: 1px dashed #94a3b8; height: 35px; margin-bottom: 6px;"></div>
            <strong>Course Examiner / Instructor</strong>
          </div>
          <div>
            <div style="border-bottom: 1px dashed #94a3b8; height: 35px; margin-bottom: 6px;"></div>
            <strong>Assessment Quality Moderator (OBE Committee)</strong>
          </div>
        </div>

        <div style="margin-top: 20px; text-align: center; font-size: 10px; color: #64748b; line-height: 1.5;">
          OBE-ICAS EED Platform • System Architecture & Implementation: <strong>Engr. Dr. Nabeel Khalid</strong><br/>
          Department of Electrical Engineering • Faculty of Engineering • Compliant with PEC & Washington Accord Standards • © 2026
        </div>
      </div>
    `;

    return printContainer;
  }

  /**
   * Generates a formal, printable Course Specification & Syllabus Dossier
   */
  static generateSyllabusReport({ courseName, clos, topics, matrix, durationWeeks = 16, hoursPerWeek = 3, totalHours = 48, courseType = 'theory', courseMappedPLOs = [] }) {
    const isLab = courseType === 'lab';
    const printContainer = document.createElement('div');
    printContainer.id = 'print-syllabus-dossier';
    printContainer.className = 'print-dossier';

    const timestamp = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const badgeText = isLab ? 'OFFICIAL LABORATORY SYLLABUS SPEC' : 'OFFICIAL SYLLABUS SPEC';
    const refCode = isLab ? `SPEC-LAB-${Date.now().toString().slice(-6)}` : `SPEC-EED-${Date.now().toString().slice(-6)}`;
    const subtitle = isLab ? 'Laboratory Specification & Experiment-to-CLO Mapping Dossier (PEC Standards)' : 'Course Specification & Topic-to-CLO Mapping Dossier (PEC Standards)';
    const sec1Title = isLab ? '1. Formulated Laboratory Learning Outcomes (CLOs)' : '1. Formulated Course Learning Outcomes (CLOs)';
    const sec2Title = isLab ? '2. List of Laboratory Experiments & Contact Hours' : '2. Modular Curriculum Topics & Weekly Breakdown';
    const sec3Title = isLab ? '3. Experiment-to-CLO Constructive Alignment Matrix' : '3. Topic-to-CLO Constructive Alignment Matrix';
    const firstColTitle = isLab ? 'Laboratory Experiment / Apparatus' : 'Module / Topic Title';
    const firstColSign = isLab ? 'Lab Engineer / Course Instructor' : 'Curriculum Designer / Faculty';
    const weeklyLabel = isLab ? 'Weekly Lab Work:' : 'Weekly Instruction:';

    printContainer.innerHTML = `
      <div style="font-family: 'Inter', system-ui, sans-serif; color: #0f172a; max-width: 800px; margin: 0 auto; padding: 24px;">
        <!-- Official Institutional Header -->
        <div style="border-bottom: 2px solid #f27d26; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <img src="./public/assets/FOE_Logo_WBG.png" style="height: 44px; width: auto; object-fit: contain;" alt="Faculty of Engineering" />
            <div style="border-left: 2px solid #f27d26; padding-left: 12px;">
              <h1 style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">FACULTY OF ENGINEERING</h1>
              <h2 style="margin: 2px 0 0; font-size: 13px; font-weight: 700; color: #f27d26; text-transform: uppercase;">Department of Electrical Engineering</h2>
              <p style="margin: 3px 0 0; font-size: 10px; color: #64748b;">${subtitle}</p>
            </div>
          </div>
          <div style="text-align: right;">
            <span style="display: inline-block; background: ${isLab ? '#fff7ed' : '#ecfdf5'}; border: 1px solid ${isLab ? '#fed7aa' : '#a7f3d0'}; color: ${isLab ? '#c2410c' : '#065f46'}; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px;">
              ${badgeText}
            </span>
            <p style="margin: 4px 0 0; font-size: 10px; color: #94a3b8;">Ref: ${refCode}</p>
          </div>
        </div>

        <!-- Course Metadata -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 20px; font-size: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div>
              <strong style="color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; display: block;">${isLab ? 'Laboratory Course Title & Code' : 'Course Title & Code'}</strong>
              <span style="font-size: 14px; font-weight: 800; color: #0f172a;">${courseName}</span>
            </div>
            <div style="text-align: right;">
              <strong style="color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; display: block;">Approved Date</strong>
              <span style="font-size: 12px; font-weight: 600; color: #0f172a;">${timestamp}</span>
            </div>
          </div>
          <div style="display: flex; gap: 24px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 11px;">
            <div>
              <span style="color: #64748b;">Semester Duration:</span>
              <strong style="color: #0f172a; margin-left: 4px;">${durationWeeks} Weeks</strong>
            </div>
            <div>
              <span style="color: #64748b;">${weeklyLabel}</span>
              <strong style="color: #0f172a; margin-left: 4px;">${hoursPerWeek} Hours / Week</strong>
            </div>
            <div>
              <span style="color: #64748b;">Total Contact Hours:</span>
              <strong style="color: #059669; margin-left: 4px;">${totalHours} Hours</strong>
            </div>
          </div>
          ${courseMappedPLOs && courseMappedPLOs.length > 0 ? `
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 11px;">
              <span style="color: #64748b;">Course Mapped Program Learning Outcomes (PLOs):</span>
              <strong style="color: #0369a1; margin-left: 6px;">${courseMappedPLOs.join(', ')}</strong>
            </div>
          ` : ''}
        </div>

        <!-- Section 1: Course Learning Outcomes -->
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
            ${sec1Title}
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left;">
            <thead>
              <tr style="background: #f1f5f9; color: #475569; font-weight: 700;">
                <th style="padding: 6px 8px; border: 1px solid #cbd5e1; width: 60px;">CLO #</th>
                <th style="padding: 6px 8px; border: 1px solid #cbd5e1;">Learning Outcome Statement</th>
                <th style="padding: 6px 8px; border: 1px solid #cbd5e1; width: 80px;">Mapped PLO</th>
                <th style="padding: 6px 8px; border: 1px solid #cbd5e1; width: 70px;">Taxonomy</th>
              </tr>
            </thead>
            <tbody>
              ${clos.map(c => `
                <tr>
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-weight: 700;">CLO-${c.id}</td>
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0;">${c.statement}</td>
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-weight: 600; color: #0369a1;">${c.plo}</td>
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-weight: 600; color: #c2410c;">${c.taxonomy}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Section 2: Modular Syllabus Topics / Lab Experiments -->
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
            ${sec2Title}
          </h3>
          <div style="font-size: 11px; line-height: 1.5;">
            ${topics.map(t => `
              <div style="margin-bottom: 10px; padding: 8px; background: #fafafa; border: 1px solid #f1f5f9; border-radius: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <strong style="color: #0f172a;">${isLab ? `Experiment ${t.moduleNumber}: ${t.title}` : `Module ${t.moduleNumber}: ${t.title}`}</strong>
                  <div>
                    ${t.weekRange ? `<span style="background: #e2e8f0; color: #334155; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-right: 6px;">${t.weekRange}</span>` : ''}
                    <span style="color: #059669; font-weight: 700;">${t.contactHours || (isLab ? 3 : 6)} Contact Hours</span>
                  </div>
                </div>
                ${t.apparatus ? `<p style="margin: 4px 0 2px; font-size: 10.5px; color: #c2410c;"><strong>Required Apparatus:</strong> ${t.apparatus}</p>` : ''}
                <div style="margin: 3px 0 0; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">
                  ${isLab ? 'Experimental Tasks & Deliverables:' : 'Key Topics Covered:'}
                </div>
                <ul style="margin: 2px 0 0; padding-left: 18px; color: #475569;">
                  ${(t.subtopics || []).map(st => `<li>${st}</li>`).join('')}
                </ul>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Section 3: Topic-to-CLO Mapping Matrix -->
        <div style="margin-bottom: 24px; break-inside: avoid;">
          <h3 style="font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
            ${sec3Title}
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left;">
            <thead>
              <tr style="background: #f1f5f9; color: #475569; font-weight: 700;">
                <th style="padding: 6px 8px; border: 1px solid #cbd5e1;">${firstColTitle}</th>
                <th style="padding: 6px 8px; border: 1px solid #cbd5e1; width: 85px;">Week Span</th>
                <th style="padding: 6px 8px; border: 1px solid #cbd5e1; width: 95px;">Aligned CLOs</th>
                <th style="padding: 6px 8px; border: 1px solid #cbd5e1; width: 55px;">Hours</th>
                <th style="padding: 6px 8px; border: 1px solid #cbd5e1; width: 130px;">Instructional Mode</th>
              </tr>
            </thead>
            <tbody>
              ${matrix.map(m => `
                <tr>
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-weight: 600;">${m.topicTitle}</td>
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0; color: #475569; font-size: 10px;">${m.weekRange || '-'}</td>
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-weight: 700; color: #c2410c;">${(m.mappedCLOs || []).join(', ')}</td>
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-weight: 600;">${m.contactHours} hrs</td>
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0; color: #475569;">${m.deliveryMode}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Sign-off Block -->
        <div style="border-top: 1px solid #cbd5e1; padding-top: 20px; margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; text-align: center; font-size: 11px; color: #475569;">
          <div>
            <div style="border-bottom: 1px dashed #94a3b8; height: 35px; margin-bottom: 6px;"></div>
            <strong>${firstColSign}</strong>
          </div>
          <div>
            <div style="border-bottom: 1px dashed #94a3b8; height: 35px; margin-bottom: 6px;"></div>
            <strong>OBE Coordinator (EED)</strong>
          </div>
          <div>
            <div style="border-bottom: 1px dashed #94a3b8; height: 35px; margin-bottom: 6px;"></div>
            <strong>Convener, Board of Studies</strong>
          </div>
        </div>

        <div style="margin-top: 20px; text-align: center; font-size: 10px; color: #64748b; line-height: 1.5;">
          OBE-ICAS EED Platform • System Architecture & Implementation: <strong>Engr. Dr. Nabeel Khalid</strong><br/>
          Department of Electrical Engineering • Faculty of Engineering • Compliant with Washington Accord & PEC Standards • © 2026
        </div>
      </div>
    `;

    return printContainer;
  }

  /**
   * Generates a formal, printable OBE Executive Framework & Accreditation Policies Summary
   */
  static generateOverviewReport() {
    const printContainer = document.createElement('div');
    printContainer.id = 'print-overview-dossier';
    printContainer.className = 'print-dossier';

    const timestamp = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    printContainer.innerHTML = `
      <div style="font-family: 'Inter', system-ui, sans-serif; color: #0f172a; max-width: 800px; margin: 0 auto; padding: 24px;">
        <!-- Institutional Header -->
        <div style="border-bottom: 2px solid #f27d26; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <img src="./public/assets/FOE_Logo_WBG.png" style="height: 44px; width: auto; object-fit: contain;" alt="Faculty of Engineering" />
            <div style="border-left: 2px solid #f27d26; padding-left: 12px;">
              <h1 style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">FACULTY OF ENGINEERING</h1>
              <h2 style="margin: 2px 0 0; font-size: 13px; font-weight: 700; color: #f27d26; text-transform: uppercase;">Department of Electrical Engineering</h2>
              <p style="margin: 3px 0 0; font-size: 10px; color: #64748b;">OBE Accreditation Framework • Washington Accord (IEA v4.0) • PEC Standard</p>
            </div>
          </div>
          <div style="text-align: right;">
            <span style="display: inline-block; background: #fff7ed; border: 1px solid #fdba74; color: #c2410c; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px;">
              EXECUTIVE OBE DOSSIER
            </span>
            <p style="margin: 4px 0 0; font-size: 10px; color: #94a3b8;">Ref: PEC-OBE-${Date.now().toString().slice(-6)}</p>
          </div>
        </div>

        <!-- Metadata Box -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 4px 8px; font-weight: 700; color: #475569; width: 140px;">Framework:</td>
              <td style="padding: 4px 8px; font-weight: 600; color: #0f172a;">Outcome-Based Education (OBE) Quality Assurance</td>
              <td style="padding: 4px 8px; font-weight: 700; color: #475569; width: 140px;">Date of Issue:</td>
              <td style="padding: 4px 8px; color: #334155;">${timestamp}</td>
            </tr>
            <tr>
              <td style="padding: 4px 8px; font-weight: 700; color: #475569;">Governing Bodies:</td>
              <td style="padding: 4px 8px; color: #334155;">Pakistan Engineering Council (PEC) • International Engineering Alliance (IEA)</td>
              <td style="padding: 4px 8px; font-weight: 700; color: #475569;">Program:</td>
              <td style="padding: 4px 8px; color: #0f172a; font-weight: 600;">B.Sc. Electrical Engineering</td>
            </tr>
            <tr>
              <td style="padding: 4px 8px; font-weight: 700; color: #475569;">Accreditation Status:</td>
              <td colspan="3" style="padding: 4px 8px;">
                <span style="font-size: 11px; font-weight: 800; background: #ecfdf5; color: #065f46; padding: 2px 8px; border-radius: 4px; border: 1px solid #a7f3d0;">
                  Level-II Accreditation Compliant (Washington Accord Substantial Equivalence)
                </span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Section 1: Executive OBE Architecture & Core Mandate -->
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
            1. Executive OBE Architecture & Quality Assurance Mandate
          </h3>
          <p style="font-size: 12px; line-height: 1.6; color: #334155; margin: 0 0 10px;">
            Outcome-Based Education (OBE) is a student-centric learning philosophy where curriculum design, instructional delivery, and assessment tasks are explicitly constructively aligned to achieve predetermined competencies. Under the Pakistan Engineering Council (PEC) accreditation criteria, engineering graduates must attain 11 Graduate Attributes / Program Learning Outcomes (PLOs) reflecting the Washington Accord (IEA Graduate Attributes v4.0).
          </p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 11px;">
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
              <strong style="color: #0f172a; display: block; margin-bottom: 4px;">Constructive Alignment Principle:</strong>
              <span style="color: #475569;">Aligning Course Learning Outcomes (CLOs), teaching-learning activities (TLAs), and assessment tasks (ATs) to foster deep learning and prevent cognitive deflation.</span>
            </div>
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
              <strong style="color: #0f172a; display: block; margin-bottom: 4px;">Continuous Quality Improvement (CQI):</strong>
              <span style="color: #475569;">A systematic closed-loop mechanism requiring direct assessment analysis, cohort attainment tracking against thresholds, and targeted remedial interventions.</span>
            </div>
          </div>
        </div>

        <!-- Section 2: Four Operational Quality Pillars -->
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
            2. Departmental Quality Assurance Pillars
          </h3>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 11px;">
            <div style="border: 1px solid #fed7aa; background: #fffaf5; border-radius: 6px; padding: 12px;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                <span style="background: #ea580c; color: #ffffff; font-weight: 800; font-size: 10px; padding: 2px 6px; border-radius: 4px;">Pillar 1</span>
                <strong style="color: #9a3412; font-size: 12px;">PEC 11 PLO Mapping</strong>
              </div>
              <p style="margin: 0; color: #431407; line-height: 1.5;">
                Every engineering course must map each Course Learning Outcome directly to one of the 11 PEC PLOs, ensuring full coverage across technical competencies (PLO-1 to PLO-5) and professional/societal attributes (PLO-6 to PLO-11).
              </p>
            </div>

            <div style="border: 1px solid #bbf7d0; background: #f0fdf4; border-radius: 6px; padding: 12px;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                <span style="background: #16a34a; color: #ffffff; font-weight: 800; font-size: 10px; padding: 2px 6px; border-radius: 4px;">Pillar 2</span>
                <strong style="color: #166534; font-size: 12px;">Bloom's Taxonomy Verification</strong>
              </div>
              <p style="margin: 0; color: #14532d; line-height: 1.5;">
                Rigorous cognitive laddering across C1 (Remembering) to C6 (Creating). Automated verb validation flags unmeasurable verbs like "understand" or "know" and replaces them with observable engineering action verbs.
              </p>
            </div>

            <div style="border: 1px solid #bfdbfe; background: #eff6ff; border-radius: 6px; padding: 12px;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                <span style="background: #2563eb; color: #ffffff; font-weight: 800; font-size: 10px; padding: 2px 6px; border-radius: 4px;">Pillar 3</span>
                <strong style="color: #1e40af; font-size: 12px;">Assessment Cognitive Match Audit</strong>
              </div>
              <p style="margin: 0; color: #1e3a8a; line-height: 1.5;">
                Midterm and final examinations are audited at the individual question level. Discrepancies between targeted CLO cognitive depth and actual question complexity are resolved to safeguard academic rigor.
              </p>
            </div>

            <div style="border: 1px solid #e9d5ff; background: #faf5ff; border-radius: 6px; padding: 12px;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                <span style="background: #9333ea; color: #ffffff; font-weight: 800; font-size: 10px; padding: 2px 6px; border-radius: 4px;">Pillar 4</span>
                <strong style="color: #6b21a8; font-size: 12px;">Curriculum & Outline Pacing</strong>
              </div>
              <p style="margin: 0; color: #581c87; line-height: 1.5;">
                AI-assisted curriculum structuring provides 16-week modular breakdowns with weekly contact hours, theory/lab mode differentiation, and explicit Topic-to-CLO Constructive Alignment matrices.
              </p>
            </div>
          </div>
        </div>

        <!-- Section 3: Summary Table of the 11 PEC PLOs -->
        <div style="margin-bottom: 24px; break-inside: avoid;">
          <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
            3. Summary of Pakistan Engineering Council (PEC) 11 PLOs
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px;">
            <thead>
              <tr style="background: #f1f5f9; color: #334155;">
                <th style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: left; width: 65px;">PLO Code</th>
                <th style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: left; width: 180px;">Title</th>
                <th style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: left;">Washington Accord Attribute & Focus</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0; font-weight: 700; color: #1d4ed8;">PLO-1</td>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0; font-weight: 600;">Engineering Knowledge</td>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0; color: #475569;">Application of math, natural science, and electrical engineering fundamentals (WA1)</td>
              </tr>
              <tr>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0; font-weight: 700; color: #1d4ed8;">PLO-2</td>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0; font-weight: 600;">Problem Analysis</td>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0; color: #475569;">Formulation and literature-backed analysis of complex engineering problems (WA2)</td>
              </tr>
              <tr>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0; font-weight: 700; color: #1d4ed8;">PLO-3</td>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0; font-weight: 600;">Design / Development</td>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0; color: #475569;">System/component design considering safety, economic, and environmental aspects (WA3)</td>
              </tr>
              <tr>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0; font-weight: 700; color: #1d4ed8;">PLO-4</td>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0; font-weight: 600;">Investigation</td>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0; color: #475569;">Experimental design, data synthesis, and laboratory investigation of complex problems (WA4)</td>
              </tr>
              <tr>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0; font-weight: 700; color: #1d4ed8;">PLO-5</td>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0; font-weight: 600;">Modern Tool Usage</td>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0; color: #475569;">Selection and application of modern EDA, simulation (MATLAB, SPICE, Altium) tools (WA5)</td>
              </tr>
              <tr>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0; font-weight: 700; color: #1d4ed8;">PLO-6</td>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0; font-weight: 600;">The Engineer & Society</td>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0; color: #475569;">Contextual societal, health, legal, and cultural responsibilities of engineering practice (WA6)</td>
              </tr>
              <tr>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0; font-weight: 700; color: #1d4ed8;">PLO-7</td>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0; font-weight: 600;">Environment & Sustainability</td>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0; color: #475569;">Impact of engineering solutions in societal and environmental contexts; sustainable design (WA7)</td>
              </tr>
              <tr>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0; font-weight: 700; color: #1d4ed8;">PLO-8</td>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0; font-weight: 600;">Ethics</td>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0; color: #475569;">Commitment to professional ethics, equity, and responsibilities of engineering practice (WA8)</td>
              </tr>
              <tr>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0; font-weight: 700; color: #1d4ed8;">PLO-9</td>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0; font-weight: 600;">Individual & Teamwork</td>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0; color: #475569;">Functioning effectively as an individual, member, or leader in multidisciplinary teams (WA9)</td>
              </tr>
              <tr>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0; font-weight: 700; color: #1d4ed8;">PLO-10</td>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0; font-weight: 600;">Communication</td>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0; color: #475569;">Effective technical writing, design reports, client communication, and oral defense (WA10)</td>
              </tr>
              <tr>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0; font-weight: 700; color: #1d4ed8;">PLO-11</td>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0; font-weight: 600;">Project Management & Finance</td>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0; color: #475569;">Management principles, cost estimation, risk mitigation, and lifelong self-learning (WA11/12)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Section 4: Academic Quality Assurance & Attainment Benchmarks -->
        <div style="margin-bottom: 24px; break-inside: avoid;">
          <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
            4. Departmental Quality Benchmarks & Assessment Policy
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 11px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
              <strong style="color: #0f172a; display: block; margin-bottom: 4px;">Direct Attainment Benchmark:</strong>
              <p style="margin: 0; color: #475569; line-height: 1.4;">
                A minimum of <strong>60% of students</strong> in any course offering must obtain <strong>≥ 50% marks</strong> in the assessment tasks directly mapped to that CLO.
              </p>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
              <strong style="color: #0f172a; display: block; margin-bottom: 4px;">CQI Closing-the-Loop Threshold:</strong>
              <p style="margin: 0; color: #475569; line-height: 1.4;">
                If attainment falls below 60%, the instructor must submit an official CQI Intervention Plan specifying supplementary laboratory sessions, remedial tutorials, or adjusted assessment instruments.
              </p>
            </div>
          </div>
        </div>

        <!-- Formal Sign-Off Footer -->
        <div style="border-top: 1px solid #cbd5e1; padding-top: 20px; margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; text-align: center; font-size: 11px; color: #475569;">
          <div>
            <div style="border-bottom: 1px dashed #94a3b8; height: 35px; margin-bottom: 6px;"></div>
            <strong>OBE Coordinator (EED)</strong>
          </div>
          <div>
            <div style="border-bottom: 1px dashed #94a3b8; height: 35px; margin-bottom: 6px;"></div>
            <strong>Convener, Board of Studies</strong>
          </div>
          <div>
            <div style="border-bottom: 1px dashed #94a3b8; height: 35px; margin-bottom: 6px;"></div>
            <strong>Dean, Faculty of Engineering</strong>
          </div>
        </div>

        <div style="margin-top: 20px; text-align: center; font-size: 10px; color: #64748b; line-height: 1.5;">
          OBE-ICAS EED Platform • System Architecture & Implementation: <strong>Engr. Dr. Nabeel Khalid</strong><br/>
          Department of Electrical Engineering • Faculty of Engineering • © 2026
        </div>
      </div>
    `;

    return printContainer;
  }

  /**
   * Generates a formal, printable PEC 11 PLOs & Bloom's Revised Taxonomy Standards Handbook
   */
  static generateStandardsReport({ plos = PLO_LIST, taxonomies = TAXONOMY_LEVELS } = {}) {
    const printContainer = document.createElement('div');
    printContainer.id = 'print-standards-dossier';
    printContainer.className = 'print-dossier';

    const timestamp = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const cognitiveTaxonomies = (taxonomies || TAXONOMY_LEVELS).filter(t => t.domain === 'Cognitive');
    const plosList = plos || PLO_LIST;

    printContainer.innerHTML = `
      <div style="font-family: 'Inter', system-ui, sans-serif; color: #0f172a; max-width: 800px; margin: 0 auto; padding: 24px;">
        <!-- Institutional Header -->
        <div style="border-bottom: 2px solid #f27d26; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <img src="./public/assets/FOE_Logo_WBG.png" style="height: 44px; width: auto; object-fit: contain;" alt="Faculty of Engineering" />
            <div style="border-left: 2px solid #f27d26; padding-left: 12px;">
              <h1 style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">FACULTY OF ENGINEERING</h1>
              <h2 style="margin: 2px 0 0; font-size: 13px; font-weight: 700; color: #f27d26; text-transform: uppercase;">Department of Electrical Engineering</h2>
              <p style="margin: 3px 0 0; font-size: 10px; color: #64748b;">Accreditation Standards Handbook • PEC 11 PLOs & Bloom's Taxonomy Reference</p>
            </div>
          </div>
          <div style="text-align: right;">
            <span style="display: inline-block; background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px;">
              STANDARDS REFERENCE HANDBOOK
            </span>
            <p style="margin: 4px 0 0; font-size: 10px; color: #94a3b8;">Ref: PEC-STD-${Date.now().toString().slice(-6)}</p>
          </div>
        </div>

        <!-- Handbook Metadata Box -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px; font-size: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="color: #0f172a;">Document Purpose:</strong>
              <span style="color: #475569; margin-left: 4px;">Official reference manual for Course Learning Outcomes (CLOs) design and taxonomy alignment.</span>
            </div>
            <div style="color: #64748b; font-size: 11px;">Date: ${timestamp}</div>
          </div>
        </div>

        <!-- Section 1: The 11 PEC Program Learning Outcomes -->
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
            1. The 11 Program Learning Outcomes (PLOs) — PEC Framework
          </h3>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${plosList.map((plo, idx) => `
              <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; background: #ffffff; break-inside: avoid;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="background: #1e40af; color: #ffffff; font-weight: 800; font-size: 11px; padding: 2px 8px; border-radius: 4px;">${plo.code}</span>
                    <strong style="color: #0f172a; font-size: 12px;">${plo.title}</strong>
                  </div>
                  <span style="font-size: 10px; color: #64748b; font-weight: 600;">Washington Accord Attribute WA-${idx + 1}</span>
                </div>
                <p style="margin: 0; font-size: 11px; color: #334155; line-height: 1.45;">${plo.description}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Section 2: Bloom's Revised Taxonomy (Cognitive Domain C1 to C6) -->
        <div style="margin-bottom: 24px; break-inside: avoid;">
          <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
            2. Bloom's Revised Taxonomy — Cognitive Domain (C1 to C6)
          </h3>

          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background: #f1f5f9; color: #334155;">
                <th style="padding: 6px 8px; border: 1px solid #cbd5e1; width: 60px; text-align: left;">Level</th>
                <th style="padding: 6px 8px; border: 1px solid #cbd5e1; width: 130px; text-align: left;">Cognitive Depth</th>
                <th style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: left;">Measurable Engineering Action Verbs</th>
                <th style="padding: 6px 8px; border: 1px solid #cbd5e1; width: 140px; text-align: left;">Typical Assessments</th>
              </tr>
            </thead>
            <tbody>
              ${cognitiveTaxonomies.map(t => {
                let assessmentDesc = '';
                if (t.level === 'C1') assessmentDesc = 'Quizzes, Objective MCQs, Terminology Tests';
                else if (t.level === 'C2') assessmentDesc = 'Conceptual Short Questions, Diagram Explanations';
                else if (t.level === 'C3') assessmentDesc = 'Numerical Computations, Standard Circuit Solving';
                else if (t.level === 'C4') assessmentDesc = 'System Parameter Analysis, Fault Diagnostics, Case Studies';
                else if (t.level === 'C5') assessmentDesc = 'Design Trade-off Critiques, IEEE Standards Verification';
                else if (t.level === 'C6') assessmentDesc = 'Complex System Synthesis, Capstone Projects, PCB Design';

                return `
                  <tr>
                    <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-weight: 800; color: #c2410c;">${t.level}</td>
                    <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">${t.title.replace(t.level + ' - ', '')}</td>
                    <td style="padding: 6px 8px; border: 1px solid #e2e8f0; color: #1e293b;">
                      ${t.verbs.map(v => `<span style="display: inline-block; background: #f8fafc; border: 1px solid #e2e8f0; padding: 1px 5px; margin: 1px; border-radius: 3px; font-size: 10px;">${v}</span>`).join(' ')}
                    </td>
                    <td style="padding: 6px 8px; border: 1px solid #e2e8f0; color: #475569; font-size: 10px;">${assessmentDesc}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- Section 3: Affective & Psychomotor Domains Overview -->
        <div style="margin-bottom: 24px; break-inside: avoid;">
          <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
            3. Affective & Psychomotor Domains Summary
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 11px;">
            <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; background: #f8fafc;">
              <strong style="color: #0f172a; display: block; margin-bottom: 4px;">Affective Domain (A1 - A5):</strong>
              <p style="margin: 0 0 6px; color: #475569; line-height: 1.4;">
                Evaluates values, ethics, and attitudes (Receiving A1, Responding A2, Valuing A3, Organization A4, Characterization A5). Essential for PLO-7 (Ethics), PLO-8 (Teamwork), and PLO-9 (Communication).
              </p>
              <span style="font-size: 10px; color: #0369a1; font-weight: 600;">Key verbs: Adopt, Commit, Conform, Exemplify, Influence, Internalize.</span>
            </div>
            <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; background: #f8fafc;">
              <strong style="color: #0f172a; display: block; margin-bottom: 4px;">Psychomotor Domain (P1 - P7):</strong>
              <p style="margin: 0 0 6px; color: #475569; line-height: 1.4;">
                Evaluates hands-on motor skills and laboratory competencies (Perception P1, Set P2, Guided Response P3, Mechanism P4, Complex Response P5, Adaptation P6, Origination P7). Critical for PLO-4 (Investigation) & PLO-5 (Tool Usage).
              </p>
              <span style="font-size: 10px; color: #059669; font-weight: 600;">Key verbs: Assemble, Calibrate, Fabricate, Measure, Operate, Troubleshoot.</span>
            </div>
          </div>
        </div>

        <!-- Section 4: Non-Measurable Verbs Blacklist -->
        <div style="margin-bottom: 24px; break-inside: avoid;">
          <h3 style="font-size: 14px; font-weight: 800; color: #92400e; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px; border-bottom: 1px solid #fde68a; padding-bottom: 6px;">
            4. Accreditation Red Flags — Non-Measurable Verbs Blacklist
          </h3>
          <p style="font-size: 11px; color: #78350f; margin: 0 0 10px; line-height: 1.5;">
            The following verbs describe internal, unobservable mental processes that cannot be evaluated through objective scoring rubrics. Using them in Course Learning Outcomes results in PEC accreditation non-compliance citations.
          </p>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background: #fef3c7; color: #92400e;">
                <th style="padding: 6px 8px; border: 1px solid #fde68a; width: 140px; text-align: left;">Prohibited Passive Verb</th>
                <th style="padding: 6px 8px; border: 1px solid #fde68a; text-align: left;">Accreditation Defect</th>
                <th style="padding: 6px 8px; border: 1px solid #fde68a; width: 220px; text-align: left;">Approved Measurable Substitutes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 5px 8px; border: 1px solid #fef3c7; font-weight: 700; color: #b91c1c; text-decoration: line-through;">Understand</td>
                <td style="padding: 5px 8px; border: 1px solid #fef3c7; color: #78350f;">Internal state; impossible to observe or score in an exam</td>
                <td style="padding: 5px 8px; border: 1px solid #fef3c7; font-weight: 600; color: #166534;">Explain, Calculate, Analyze, Differentiate</td>
              </tr>
              <tr>
                <td style="padding: 5px 8px; border: 1px solid #fef3c7; font-weight: 700; color: #b91c1c; text-decoration: line-through;">Know / Learn</td>
                <td style="padding: 5px 8px; border: 1px solid #fef3c7; color: #78350f;">Passive knowledge retention without specified application</td>
                <td style="padding: 5px 8px; border: 1px solid #fef3c7; font-weight: 600; color: #166534;">Identify, State, Classify, Implement</td>
              </tr>
              <tr>
                <td style="padding: 5px 8px; border: 1px solid #fef3c7; font-weight: 700; color: #b91c1c; text-decoration: line-through;">Be familiar with</td>
                <td style="padding: 5px 8px; border: 1px solid #fef3c7; color: #78350f;">Vague familiarity; fails SMART measurability test</td>
                <td style="padding: 5px 8px; border: 1px solid #fef3c7; font-weight: 600; color: #166534;">Describe, Operate, Contrast, Synthesize</td>
              </tr>
              <tr>
                <td style="padding: 5px 8px; border: 1px solid #fef3c7; font-weight: 700; color: #b91c1c; text-decoration: line-through;">Appreciate / Study</td>
                <td style="padding: 5px 8px; border: 1px solid #fef3c7; color: #78350f;">Subjective sentiment; cannot be proven in student artifacts</td>
                <td style="padding: 5px 8px; border: 1px solid #fef3c7; font-weight: 600; color: #166534;">Evaluate, Justify, Formulate, Measure</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Official Sign-off Footer -->
        <div style="border-top: 1px solid #cbd5e1; padding-top: 20px; margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; text-align: center; font-size: 11px; color: #475569;">
          <div>
            <div style="border-bottom: 1px dashed #94a3b8; height: 35px; margin-bottom: 6px;"></div>
            <strong>Curriculum Convener (EED)</strong>
          </div>
          <div>
            <div style="border-bottom: 1px dashed #94a3b8; height: 35px; margin-bottom: 6px;"></div>
            <strong>OBE Coordinator (EED)</strong>
          </div>
          <div>
            <div style="border-bottom: 1px dashed #94a3b8; height: 35px; margin-bottom: 6px;"></div>
            <strong>Head of Department (EED)</strong>
          </div>
        </div>

        <div style="margin-top: 20px; text-align: center; font-size: 10px; color: #64748b; line-height: 1.5;">
          OBE-ICAS EED Platform • System Architecture & Implementation: <strong>Engr. Dr. Nabeel Khalid</strong><br/>
          Department of Electrical Engineering • Faculty of Engineering • © 2026
        </div>
      </div>
    `;

    return printContainer;
  }

  /**
   * Generates a formal, printable Departmental Accreditation & CQI Guide Dossier
   */
  static generateCQIGuideReport() {
    const printContainer = document.createElement('div');
    printContainer.id = 'print-cqi-dossier';
    printContainer.className = 'print-dossier';

    const timestamp = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    printContainer.innerHTML = `
      <div style="font-family: 'Inter', system-ui, sans-serif; color: #0f172a; max-width: 800px; margin: 0 auto; padding: 24px;">
        <!-- Institutional Header -->
        <div style="border-bottom: 2px solid #f27d26; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <img src="./public/assets/FOE_Logo_WBG.png" style="height: 44px; width: auto; object-fit: contain;" alt="Faculty of Engineering" />
            <div style="border-left: 2px solid #f27d26; padding-left: 12px;">
              <h1 style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">FACULTY OF ENGINEERING</h1>
              <h2 style="margin: 2px 0 0; font-size: 13px; font-weight: 700; color: #f27d26; text-transform: uppercase;">Department of Electrical Engineering</h2>
              <p style="margin: 3px 0 0; font-size: 10px; color: #64748b;">Accreditation Protocols • Continuous Quality Improvement (CQI) & Closing the Loop</p>
            </div>
          </div>
          <div style="text-align: right;">
            <span style="display: inline-block; background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px;">
              ACCREDITATION CQI GUIDE
            </span>
            <p style="margin: 4px 0 0; font-size: 10px; color: #94a3b8;">Ref: PEC-CQI-${Date.now().toString().slice(-6)}</p>
          </div>
        </div>

        <!-- Metadata Box -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px; font-size: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="color: #0f172a;">Quality Standard:</strong>
              <span style="color: #475569; margin-left: 4px;">PEC Manual of Accreditation 2019 (Clause 2.4 CQI Loop & Clause 3.2 Course Folders)</span>
            </div>
            <div style="color: #64748b; font-size: 11px;">Date: ${timestamp}</div>
          </div>
        </div>

        <!-- Section 1: Course Review Folder (CRF) Mandatory Checklist -->
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
            1. Course Review Folder (CRF) Mandatory Accreditation Checklist
          </h3>
          <p style="font-size: 11px; color: #475569; margin: 0 0 10px;">
            Every course instructor must compile an audit-ready Course Review Folder (CRF) at the end of each semester containing the following documented artifacts:
          </p>

          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background: #f1f5f9; color: #334155;">
                <th style="padding: 6px 8px; border: 1px solid #cbd5e1; width: 40px; text-align: center;">Item</th>
                <th style="padding: 6px 8px; border: 1px solid #cbd5e1; width: 170px; text-align: left;">Artifact Description</th>
                <th style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: left;">Compliance & Quality Requirement</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: 800; color: #059669;">✓ 01</td>
                <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">Approved Course Syllabus</td>
                <td style="padding: 6px 8px; border: 1px solid #e2e8f0; color: #334155;">Specifies measurable CLOs, mapped PEC PLOs, Bloom's cognitive domain (C1-C6), weekly topic distribution, and contact hours.</td>
              </tr>
              <tr>
                <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: 800; color: #059669;">✓ 02</td>
                <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">Assessment Alignment Matrix</td>
                <td style="padding: 6px 8px; border: 1px solid #e2e8f0; color: #334155;">Table detailing mapping of every question in quizzes, assignments, midterm, and final exams to intended CLOs and cognitive levels without cognitive deflation.</td>
              </tr>
              <tr>
                <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: 800; color: #059669;">✓ 03</td>
                <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">Graded Student Work Samples</td>
                <td style="padding: 6px 8px; border: 1px solid #e2e8f0; color: #334155;">Three graded student samples (High, Medium, Low scoring scripts) for every assessment instrument, demonstrating objective rubric scoring.</td>
              </tr>
              <tr>
                <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: 800; color: #059669;">✓ 04</td>
                <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">Direct Attainment Sheet</td>
                <td style="padding: 6px 8px; border: 1px solid #e2e8f0; color: #334155;">Spreadsheet or automated software report displaying cohort score distribution and percentage of students achieving the ≥50% benchmark for each CLO.</td>
              </tr>
              <tr>
                <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: 800; color: #059669;">✓ 05</td>
                <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">CQI Closing-the-Loop Report</td>
                <td style="padding: 6px 8px; border: 1px solid #e2e8f0; color: #334155;">Instructor reflection report documenting root cause analysis for any underperforming CLOs and actionable interventions executed in the current or planned for the subsequent semester.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Section 2: The 3-Stage OBE CQI Operational Cycle -->
        <div style="margin-bottom: 24px; break-inside: avoid;">
          <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
            2. The 3-Stage OBE Continuous Quality Improvement (CQI) Cycle
          </h3>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; font-size: 11px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
              <div style="font-weight: 800; color: #ea580c; margin-bottom: 4px; font-size: 12px;">Stage 1: Plan & Design</div>
              <p style="margin: 0; color: #475569; line-height: 1.45;">
                Formulate measurable CLOs with active engineering verbs. Perform constructive alignment with curriculum topics, weekly hours, and laboratory hands-on experiments.
              </p>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
              <div style="font-weight: 800; color: #2563eb; margin-bottom: 4px; font-size: 12px;">Stage 2: Execute & Audit</div>
              <p style="margin: 0; color: #475569; line-height: 1.45;">
                Conduct formative quizzes and midterm/final examinations. Audit exam questions to guarantee that targeted cognitive levels (e.g. C4 Analysis, C6 Design) are authentically assessed.
              </p>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
              <div style="font-weight: 800; color: #16a34a; margin-bottom: 4px; font-size: 12px;">Stage 3: Close the Loop</div>
              <p style="margin: 0; color: #475569; line-height: 1.45;">
                Compute cohort attainment. Compare against departmental target (60% cohort achieving ≥50%). Document remedial interventions for deficient outcomes and track semester-over-semester progress.
              </p>
            </div>
          </div>
        </div>

        <!-- Section 3: Washington Accord Complex Engineering Problems (WP1-WP7) -->
        <div style="margin-bottom: 24px; break-inside: avoid;">
          <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
            3. Complex Engineering Problem (CEP) Attributes (WP1 to WP7)
          </h3>
          <p style="font-size: 11px; color: #475569; margin: 0 0 8px;">
            To qualify as Washington Accord level engineering under PEC guidelines, higher-level courses (300/400 level) must embed open-ended Complex Engineering Problems satisfying several of the following WP attributes:
          </p>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 10.5px;">
            <div style="padding: 6px 10px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px;">
              <strong style="color: #0f172a;">WP1: Depth of Knowledge Required:</strong> Cannot be resolved without in-depth engineering fundamentals and research-based knowledge.
            </div>
            <div style="padding: 6px 10px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px;">
              <strong style="color: #0f172a;">WP2: Conflicting Requirements:</strong> Involves wide-ranging or conflicting technical, economic, or environmental constraints.
            </div>
            <div style="padding: 6px 10px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px;">
              <strong style="color: #0f172a;">WP3: Depth of Analysis:</strong> Has no obvious solution and requires abstract thinking and original modeling.
            </div>
            <div style="padding: 6px 10px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px;">
              <strong style="color: #0f172a;">WP4: Infrequently Encountered:</strong> Involves unfamiliar issues or infrequently encountered scenarios in electrical engineering.
            </div>
            <div style="padding: 6px 10px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px;">
              <strong style="color: #0f172a;">WP5: Outside Standard Codes:</strong> Extends beyond standard design codes, datasheets, or routine formulas.
            </div>
            <div style="padding: 6px 10px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px;">
              <strong style="color: #0f172a;">WP6: Diverse Stakeholders:</strong> Involves diverse groups of stakeholders with differing societal and economic needs.
            </div>
          </div>
        </div>

        <!-- Section 4: Assessment Moderation Guidelines -->
        <div style="margin-bottom: 24px; break-inside: avoid;">
          <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
            4. Assessment Moderation & Pre-Exam Vetting Checklist
          </h3>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; font-size: 11px;">
            <ul style="margin: 0; padding-left: 18px; color: #334155; line-height: 1.55;">
              <li><strong>Cognitive Level Consistency:</strong> Verify that question action verbs match the designated CLO level (e.g., C4 questions must require comparative analysis, not mere textbook definition).</li>
              <li><strong>Marks Distribution Proportionality:</strong> Marks allocated must reflect cognitive effort and time budget (typically 1.5 to 2 minutes per mark in engineering exams).</li>
              <li><strong>Rubric Objectivity:</strong> Design questions with multi-part solutions must provide explicit sub-marking rubrics to guarantee transparent and repeatable grading.</li>
              <li><strong>Clarity of Problem Statements:</strong> Boundary conditions, input signals, component assumptions, and allowable formulas must be explicitly stated.</li>
            </ul>
          </div>
        </div>

        <!-- Official Sign-off Footer -->
        <div style="border-top: 1px solid #cbd5e1; padding-top: 20px; margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; text-align: center; font-size: 11px; color: #475569;">
          <div>
            <div style="border-bottom: 1px dashed #94a3b8; height: 35px; margin-bottom: 6px;"></div>
            <strong>Director, Quality Enhancement Cell</strong>
          </div>
          <div>
            <div style="border-bottom: 1px dashed #94a3b8; height: 35px; margin-bottom: 6px;"></div>
            <strong>OBE Coordinator (EED)</strong>
          </div>
          <div>
            <div style="border-bottom: 1px dashed #94a3b8; height: 35px; margin-bottom: 6px;"></div>
            <strong>Head of Department (EED)</strong>
          </div>
        </div>

        <div style="margin-top: 20px; text-align: center; font-size: 10px; color: #64748b; line-height: 1.5;">
          OBE-ICAS EED Platform • System Architecture & Implementation: <strong>Engr. Dr. Nabeel Khalid</strong><br/>
          Department of Electrical Engineering • Faculty of Engineering • © 2026
        </div>
      </div>
    `;

    return printContainer;
  }

  /**
   * Generates a formal, printable AI-Resilient Assessment Specification & Moderation Dossier
   */
  static generateResilienceReport({ assessmentData, courseName, clo, plo, taxonomy }) {
    const printContainer = document.createElement('div');
    printContainer.id = 'print-resilience-dossier';
    printContainer.className = 'print-dossier';

    const timestamp = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const data = assessmentData || {};
    const cloData = clo || data.clo || (data.assessmentMetadata ? { statement: data.assessmentMetadata.cloStatement, plo: data.assessmentMetadata.plo, taxonomy: data.assessmentMetadata.taxonomy } : {});
    const vuln = data.vulnerabilityDiagnosis || data.bloomVulnerability || {};
    const pillars = data.threePillarArchitecture || {};
    const p1 = pillars.p1Process || {};
    const p2 = pillars.p2Context || {};
    const p3 = pillars.p3ConceptualDepth || {};
    const comp = data.comparisonView || {};
    const brief = data.studentFacingBrief || {};
    const rubric = data.markingRubric || [];

    printContainer.innerHTML = `
      <div style="font-family: 'Inter', system-ui, sans-serif; color: #0f172a; max-width: 800px; margin: 0 auto; padding: 24px;">
        <!-- Official Institutional Header -->
        <div style="border-bottom: 2px solid #f27d26; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <img src="./public/assets/FOE_Logo_WBG.png" style="height: 44px; width: auto; object-fit: contain;" alt="Faculty of Engineering" />
            <div style="border-left: 2px solid #f27d26; padding-left: 12px;">
              <h1 style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">FACULTY OF ENGINEERING</h1>
              <h2 style="margin: 2px 0 0; font-size: 13px; font-weight: 700; color: #f27d26; text-transform: uppercase;">Department of Electrical Engineering</h2>
              <p style="margin: 3px 0 0; font-size: 10px; color: #64748b;">AI-Resilient Learning Initiative (AI-RLI) • Assessment Integrity Dossier</p>
            </div>
          </div>
          <div style="text-align: right;">
            <span style="display: inline-block; background: #faf5ff; border: 1px solid #d8b4fe; color: #7e22ce; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px;">
              AI-RESILIENT ASSESSMENT
            </span>
            <p style="margin: 4px 0 0; font-size: 10px; color: #94a3b8;">Ref: AI-RLI-EED-${Date.now().toString().slice(-6)}</p>
          </div>
        </div>

        <!-- Assessment Metadata Box -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 4px 8px; font-weight: 700; color: #475569; width: 140px;">Course Title:</td>
              <td style="padding: 4px 8px; font-weight: 600; color: #0f172a;">${courseName || data.courseName || 'Electrical Engineering Course'}</td>
              <td style="padding: 4px 8px; font-weight: 700; color: #475569; width: 140px;">Date Generated:</td>
              <td style="padding: 4px 8px; color: #334155;">${timestamp}</td>
            </tr>
            <tr>
              <td style="padding: 4px 8px; font-weight: 700; color: #475569;">Instrument Type:</td>
              <td style="padding: 4px 8px; font-weight: 600; color: #7e22ce; text-transform: uppercase;">${(data.assessmentType || 'Assignment').replace('_', ' ')}</td>
              <td style="padding: 4px 8px; font-weight: 700; color: #475569;">Target PLO & Level:</td>
              <td style="padding: 4px 8px; font-weight: 700; color: #1d4ed8;">${plo || cloData.plo || 'PLO-2'} (${taxonomy || cloData.taxonomy || 'C4'})</td>
            </tr>
            <tr>
              <td style="padding: 4px 8px; font-weight: 700; color: #475569; vertical-align: top;">Tested CLO Statement:</td>
              <td colspan="3" style="padding: 4px 8px; color: #1e293b; font-style: italic;">"${cloData.statement || ''}"</td>
            </tr>
            <tr>
              <td style="padding: 4px 8px; font-weight: 700; color: #475569;">AI-RLI Architecture:</td>
              <td colspan="3" style="padding: 4px 8px;">
                <span style="font-size: 11px; font-weight: 800; background: #fff7ed; color: #c2410c; padding: 2px 8px; border-radius: 4px; border: 1px solid #fed7aa; margin-right: 6px;">P1: Process > Product</span>
                <span style="font-size: 11px; font-weight: 800; background: #ecfdf5; color: #065f46; padding: 2px 8px; border-radius: 4px; border: 1px solid #a7f3d0; margin-right: 6px;">P2: Contextualization</span>
                <span style="font-size: 11px; font-weight: 800; background: #eff6ff; color: #1e40af; padding: 2px 8px; border-radius: 4px; border: 1px solid #bfdbfe;">P3: Conceptual Depth & AI Critique</span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Section 1: AI Vulnerability Spectrum & Assessment Fracture Diagnosis -->
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
            1. AI Vulnerability Spectrum & Assessment Fracture Diagnosis
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 11px; margin-bottom: 10px;">
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 10px;">
              <strong style="color: #991b1b; display: block; margin-bottom: 4px;">Assessment Fracture Point (Why Conventional Fails):</strong>
              <p style="margin: 0; color: #7f1d1d; line-height: 1.45;">${vuln.assessmentFracture || ''}</p>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
              <strong style="color: #0f172a; display: block; margin-bottom: 4px;">Bloom Spectrum Diagnosis:</strong>
              <div style="color: #1d4ed8; font-weight: 700; margin-bottom: 4px;">${vuln.spectrumLevel || ''}</div>
              <p style="margin: 0; color: #475569; line-height: 1.4;">${vuln.whyConventionalFails || ''}</p>
            </div>
          </div>
        </div>

        <!-- Section 2: Before & After Redesign Comparison -->
        <div style="margin-bottom: 24px; break-inside: avoid;">
          <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
            2. Task Transformation: AI-Vulnerable vs AI-Resilient Design
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 11px;">
            <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 6px; padding: 10px;">
              <strong style="color: #be123c; display: block; margin-bottom: 4px;">Conventional Vulnerable Phrasing (Zero Cognitive Trail):</strong>
              <p style="margin: 0; color: #881337; font-style: italic; line-height: 1.4;">"${comp.vulnerablePrompt || ''}"</p>
            </div>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 10px;">
              <strong style="color: #15803d; display: block; margin-bottom: 4px;">AI-Resilient Redesign (3-Pillar Enforced):</strong>
              <p style="margin: 0; color: #14532d; font-weight: 600; line-height: 1.4;">"${comp.resilientPrompt || ''}"</p>
            </div>
          </div>
        </div>

        <!-- Section 3: The Three AI-Resilience Pillars Architecture -->
        <div style="margin-bottom: 24px; break-inside: avoid;">
          <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
            3. Three-Pillar AI-RLI Implementation Detail
          </h3>
          <div style="display: flex; flex-direction: column; gap: 8px; font-size: 11px;">
            <div style="border: 1px solid #fed7aa; background: #fffaf5; border-radius: 6px; padding: 10px;">
              <strong style="color: #c2410c; display: block; margin-bottom: 4px;">Pillar 1: Process > Product (Cognitive Arc Evidence)</strong>
              <ul style="margin: 0; padding-left: 18px; color: #431407; line-height: 1.4;">
                ${(p1.requiredEvidence || []).map(e => `<li>${e}</li>`).join('')}
              </ul>
            </div>
            <div style="border: 1px solid #bbf7d0; background: #f0fdf4; border-radius: 6px; padding: 10px;">
              <strong style="color: #15803d; display: block; margin-bottom: 4px;">Pillar 2: Contextualization (Traceable Real-World Grounding)</strong>
              <p style="margin: 0; color: #14532d; line-height: 1.4;">${p2.traceableContextDetails || ''}</p>
            </div>
            <div style="border: 1px solid #bfdbfe; background: #eff6ff; border-radius: 6px; padding: 10px;">
              <strong style="color: #1d4ed8; display: block; margin-bottom: 4px;">Pillar 3: Conceptual Depth & AI Critique Strategy</strong>
              <p style="margin: 0 0 6px; color: #1e3a8a; line-height: 1.4;"><strong>Loadbearing Structure:</strong> ${p3.loadbearingStructure || ''}</p>
              <div style="background: #ffffff; border: 1px dashed #93c5fd; padding: 6px 8px; border-radius: 4px; margin-bottom: 4px;">
                <strong style="color: #1e40af;">Mandatory Student AI Query:</strong>
                <span style="color: #1e293b; font-style: italic;">"${p3.aiCritiquePrompt || ''}"</span>
              </div>
              <p style="margin: 0; color: #1e3a8a; line-height: 1.4;"><strong>Expected Student Critique:</strong> ${p3.expectedStudentCritique || ''}</p>
            </div>
          </div>
        </div>

        <!-- Section 4: Student-Facing Assessment Brief & Tasks -->
        <div style="margin-bottom: 24px; break-inside: avoid;">
          <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
            4. Student-Facing Assessment Brief & Deliverables
          </h3>
          <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; background: #ffffff; margin-bottom: 8px; font-size: 11px;">
            <div style="font-weight: 800; font-size: 12px; color: #0f172a; margin-bottom: 4px;">${brief.title || data.assessmentTitle || ''}</div>
            <p style="margin: 0 0 8px; color: #475569; line-height: 1.4;">${brief.scenario || ''}</p>
            
            <strong style="color: #0f172a; display: block; margin-bottom: 3px;">Assigned Tasks:</strong>
            <ol style="margin: 0 0 8px; padding-left: 18px; color: #334155; line-height: 1.45;">
              ${(brief.tasks || []).map(t => `<li>${t}</li>`).join('')}
            </ol>

            <strong style="color: #0f172a; display: block; margin-bottom: 3px;">Required Student Deliverables:</strong>
            <ul style="margin: 0; padding-left: 18px; color: #334155; line-height: 1.4;">
              ${(brief.deliverables || []).map(d => `<li>${d}</li>`).join('')}
            </ul>
          </div>
        </div>

        <!-- Section 5: Assessment Scoring Rubric -->
        <div style="margin-bottom: 24px; break-inside: avoid;">
          <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
            5. Assessment Rubric (100 Marks Total)
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background: #f1f5f9; color: #334155;">
                <th style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: left;">Evaluation Dimension</th>
                <th style="padding: 6px 8px; border: 1px solid #cbd5e1; width: 60px; text-align: center;">Marks</th>
                <th style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: left;">Performance Descriptor</th>
              </tr>
            </thead>
            <tbody>
              ${rubric.map(r => `
                <tr>
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">${r.criteria}</td>
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: 800; color: #7e22ce;">${r.marks}</td>
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0; color: #334155;">${r.descriptor}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Sign-Off Block -->
        <div style="border-top: 1px solid #cbd5e1; padding-top: 20px; margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; text-align: center; font-size: 11px; color: #475569;">
          <div>
            <div style="border-bottom: 1px dashed #94a3b8; height: 35px; margin-bottom: 6px;"></div>
            <strong>Course Instructor</strong>
          </div>
          <div>
            <div style="border-bottom: 1px dashed #94a3b8; height: 35px; margin-bottom: 6px;"></div>
            <strong>Assessment Quality Moderator</strong>
          </div>
          <div>
            <div style="border-bottom: 1px dashed #94a3b8; height: 35px; margin-bottom: 6px;"></div>
            <strong>OBE Coordinator (EED)</strong>
          </div>
        </div>

        <div style="margin-top: 20px; text-align: center; font-size: 10px; color: #64748b; line-height: 1.5;">
          OBE-ICAS EED Platform • AI-Resilient Learning Initiative (AI-RLI) • System Architecture & Implementation: <strong>Engr. Dr. Nabeel Khalid</strong><br/>
          Department of Electrical Engineering • Faculty of Engineering • © 2026
        </div>
      </div>
    `;

    return printContainer;
  }

  /**
   * Triggers clean PDF download / print without any UI leakage
   */
  static triggerPrint(dossierElement) {
    // Check if jsPDF and html2canvas exist on window, or use dedicated print frame
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';

    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow.document;
    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>OBE Accreditation Audit Report</title>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap">
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>
        <body>
          ${dossierElement.outerHTML}
        </body>
      </html>
    `);
    frameDoc.close();

    // Give browser time to load fonts then print
    setTimeout(() => {
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 2000);
    }, 500);
  }
}
