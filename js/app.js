// OBE-ICAS Application Controller - Outcome Integrity & Cognitive Alignment Suite
// System Architecture & Implementation: Engr. Dr. Nabeel Khalid
// Faculty of Engineering - Department of Electrical Engineering

import { PLO_LIST, TAXONOMY_LEVELS, UNMEASURABLE_VERBS_WARNING, SAMPLE_COURSES, SAMPLE_ASSESSMENT, SAMPLE_RESILIENCE_PRESETS } from './constants.js';
import { geminiEngine } from './gemini.js';
import { PDFReportGenerator } from './pdf-export.js';

class OBEApp {
  constructor() {
    this.currentTab = 'overview';
    this.clos = [
      { id: 1, statement: 'Understand the internal architecture of 32-bit ARM microcontrollers including memory mapping and interrupt priority structures.', plo: 'PLO-1', taxonomy: 'C2' },
      { id: 2, statement: 'Analyze timing diagrams and register configurations for high-speed serial peripherals (SPI and I2C) to diagnose data transmission bottlenecks.', plo: 'PLO-2', taxonomy: 'C4' },
      { id: 3, statement: 'Design an interrupt-driven embedded data acquisition system that interfaces multi-sensor inputs and transmits real-time telemetry within strict power constraints.', plo: 'PLO-3', taxonomy: 'C6' }
    ];
    this.questions = [...SAMPLE_ASSESSMENT.questions];
    this.cloEvaluationResult = null;
    this.assessmentEvaluationResult = null;
    this.activeCLOResultIndex = 0;
    this.isEvaluating = false;

    // Course Plan & Topical Outline State
    this.coursePlanText = '';
    this.courseTopics = [];
    this.activeEvalView = 'clos';

    // AI Curriculum & CLO Generator State
    this.genCourseType = 'theory';
    this.genSelectedPLOs = ['PLO-1', 'PLO-2', 'PLO-3', 'PLO-5'];
    this.genCLOCount = 4;
    this.genCourseDuration = 16;
    this.genHoursPerWeek = 3;
    this.generatedCurriculum = null;

    // AI Resilience State
    this.resilienceAssessmentData = null;

    this.init();
  }

  init() {
    this.bindTabNavigation();
    this.bindDOM();
    this.bindGeneratorControls();
    this.bindResilienceControls();
    this.renderGenPLOCheckboxes();
    this.renderCLOInputs();
    this.populateResilienceCLODropdown();
    this.renderAssessmentQuestions();
    this.renderStandardsHub();
    this.updateApiKeyStatusBadge();
    this.registerPWA();
    this.checkStoredSample();

    // Check initial hash route
    this.handleRouteFromHash();
  }

  // --- Multi-Tab Navigation & Routing ---
  bindTabNavigation() {
    // Top tab navigation buttons
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = btn.getAttribute('data-tab');
        if (tab) this.switchTab(tab, true);
      });
    });

    // Jump buttons from Overview hero
    document.querySelectorAll('.btn-jump-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const target = btn.getAttribute('data-target');
        if (target) this.switchTab(target, true);
      });
    });

    // Window hashchange listener for browser back/forward buttons
    window.addEventListener('hashchange', () => {
      this.handleRouteFromHash();
    });
  }

  handleRouteFromHash() {
    const hash = window.location.hash.replace('#', '').trim();
    const validTabs = ['overview', 'clo-evaluator', 'assessment-audit', 'clo-generator', 'ai-resilience', 'standards-hub', 'cqi-guide'];
    
    if (validTabs.includes(hash)) {
      this.switchTab(hash, false);
    } else {
      this.switchTab('overview', false);
    }
  }

  switchTab(tabId, updateHash = true) {
    if (!tabId) return;
    this.currentTab = tabId;

    // Update nav tab buttons
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      const isTarget = btn.getAttribute('data-tab') === tabId;
      if (isTarget) {
        btn.classList.add('active-tab', 'active');
      } else {
        btn.classList.remove('active-tab', 'active');
      }
    });

    // Show selected panel, hide others
    document.querySelectorAll('.tab-panel').forEach(panel => {
      const isTarget = panel.id === `tab-panel-${tabId}`;
      if (isTarget) {
        panel.classList.add('active-panel', 'active');
        panel.style.display = 'block';
      } else {
        panel.classList.remove('active-panel', 'active');
        panel.style.display = 'none';
      }
    });

    // Sync window hash if needed
    if (updateHash && window.location.hash !== `#${tabId}`) {
      window.location.hash = tabId;
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  bindDOM() {
    // Course Plan input listener
    document.getElementById('input-course-plan')?.addEventListener('input', (e) => {
      this.coursePlanText = e.target.value;
    });

    // Dynamic CLO controls
    document.getElementById('btn-add-clo')?.addEventListener('click', () => this.addCLO());
    document.getElementById('btn-clear-clos')?.addEventListener('click', () => this.clearCLOs());
    document.getElementById('btn-load-sample-ee312')?.addEventListener('click', () => this.loadSampleCourse('embedded'));
    document.getElementById('btn-load-sample-ee415')?.addEventListener('click', () => this.loadSampleCourse('power'));

    // Dual evaluation view switcher (CLO vs Outline)
    document.getElementById('btn-view-clos-audit')?.addEventListener('click', () => this.switchEvalView('clos'));
    document.getElementById('btn-view-outline-audit')?.addEventListener('click', () => this.switchEvalView('outline'));

    // Dynamic Assessment question controls
    document.getElementById('btn-add-question')?.addEventListener('click', () => this.addQuestion());
    document.getElementById('btn-load-sample-exam')?.addEventListener('click', () => this.loadSampleAssessment());

    // Evaluator action buttons
    document.getElementById('btn-evaluate-clos')?.addEventListener('click', () => this.runCLOEvaluation());
    document.getElementById('btn-evaluate-assessment')?.addEventListener('click', () => this.runAssessmentEvaluation());

    // Export PDF buttons across all tabs
    document.getElementById('btn-export-overview-pdf')?.addEventListener('click', () => this.exportOverviewPDF());
    document.getElementById('btn-export-clo-pdf')?.addEventListener('click', () => this.exportCLOPDF());
    document.getElementById('btn-export-clo-pdf-top')?.addEventListener('click', () => this.exportCLOPDF());
    document.getElementById('btn-export-assessment-pdf')?.addEventListener('click', () => this.exportAssessmentPDF());
    document.getElementById('btn-export-assessment-pdf-top')?.addEventListener('click', () => this.exportAssessmentPDF());
    document.getElementById('btn-export-syllabus-pdf-top')?.addEventListener('click', () => this.exportSyllabusPDF());
    document.getElementById('btn-export-standards-pdf')?.addEventListener('click', () => this.exportStandardsPDF());
    document.getElementById('btn-export-cqi-pdf')?.addEventListener('click', () => this.exportCQIGuidePDF());

    // File Drag & Drop Uploads
    this.setupFileUploads();

    // API Key Modal
    document.getElementById('btn-open-settings')?.addEventListener('click', () => this.openApiModal());
    document.getElementById('btn-save-api-key')?.addEventListener('click', () => this.saveApiKey());
    document.getElementById('btn-close-modal')?.addEventListener('click', () => this.closeApiModal());

    // Bloom's Verb Guide Modal
    document.getElementById('btn-open-verbs-guide')?.addEventListener('click', () => this.openVerbsModal());
    document.getElementById('btn-close-verbs-modal')?.addEventListener('click', () => this.closeVerbsModal());
  }

  switchEvalView(view) {
    this.activeEvalView = view;
    const btnClos = document.getElementById('btn-view-clos-audit');
    const btnOutline = document.getElementById('btn-view-outline-audit');
    const viewClos = document.getElementById('eval-view-clos');
    const viewOutline = document.getElementById('eval-view-outline');
    const cloSection = document.getElementById('clo-breakdown-section');

    if (view === 'clos') {
      btnClos?.classList.add('bg-white', 'text-slate-900', 'shadow-xs');
      btnClos?.classList.remove('text-slate-600');
      btnOutline?.classList.remove('bg-white', 'text-slate-900', 'shadow-xs');
      btnOutline?.classList.add('text-slate-600');

      viewClos?.classList.remove('hidden');
      viewOutline?.classList.add('hidden');
      if (cloSection) cloSection.style.display = 'block';
    } else {
      btnOutline?.classList.add('bg-white', 'text-slate-900', 'shadow-xs');
      btnOutline?.classList.remove('text-slate-600');
      btnClos?.classList.remove('bg-white', 'text-slate-900', 'shadow-xs');
      btnClos?.classList.add('text-slate-600');

      viewOutline?.classList.remove('hidden');
      viewClos?.classList.add('hidden');
      if (cloSection) cloSection.style.display = 'none';
    }
  }

  // --- AI Curriculum & CLO Generator Controls ---
  bindGeneratorControls() {
    // CLO count buttons
    document.querySelectorAll('.btn-clo-count').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-clo-count').forEach(b => {
          b.className = 'btn-clo-count py-2 text-xs font-black rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100';
        });
        btn.className = 'btn-clo-count active-count py-2 text-xs font-black rounded-xl border border-emerald-500 bg-emerald-600 text-white shadow-xs';
        this.genCLOCount = parseInt(btn.getAttribute('data-count')) || 4;
        this.renderCLOPLODistribution();
      });
    });

    // Course Mapped PLO text entry input
    const plosTextInput = document.getElementById('input-gen-plos-text');
    plosTextInput?.addEventListener('input', (e) => {
      const parsed = this.parsePLOsFromText(e.target.value);
      if (parsed.length > 0) {
        this.genSelectedPLOs = parsed;
        this.renderGenPLOCheckboxes(false);
      }
    });
    plosTextInput?.addEventListener('blur', () => {
      this.syncGenPLOTextInput();
    });

    // PLO selection preset buttons
    document.getElementById('btn-select-core-plos')?.addEventListener('click', () => {
      this.genSelectedPLOs = ['PLO-1', 'PLO-2', 'PLO-3'];
      this.renderGenPLOCheckboxes();
    });

    document.getElementById('btn-select-lab-plos')?.addEventListener('click', () => {
      this.genSelectedPLOs = ['PLO-4', 'PLO-5', 'PLO-9', 'PLO-10'];
      this.renderGenPLOCheckboxes();
    });

    document.getElementById('btn-select-design-plos')?.addEventListener('click', () => {
      this.genSelectedPLOs = ['PLO-3', 'PLO-5'];
      this.renderGenPLOCheckboxes();
    });

    document.getElementById('btn-select-all-plos')?.addEventListener('click', () => {
      this.genSelectedPLOs = PLO_LIST.map(p => p.id);
      this.renderGenPLOCheckboxes();
    });

    document.getElementById('btn-clear-all-plos')?.addEventListener('click', () => {
      this.genSelectedPLOs = [];
      this.renderGenPLOCheckboxes();
    });

    // CLO-to-PLO Distribution Mode Buttons
    const btnDistAuto = document.getElementById('btn-dist-auto');
    const btnDistCustom = document.getElementById('btn-dist-custom');

    btnDistAuto?.addEventListener('click', () => {
      this.genCustomPLOMapping = false;
      btnDistAuto.className = 'px-3 py-1 rounded-lg bg-white text-emerald-950 shadow-2xs border border-emerald-200 transition-all';
      btnDistCustom.className = 'px-3 py-1 rounded-lg text-slate-600 hover:text-slate-900 transition-all';
      document.getElementById('gen-clo-plo-distribution-container')?.classList.add('hidden');
    });

    btnDistCustom?.addEventListener('click', () => {
      this.genCustomPLOMapping = true;
      btnDistCustom.className = 'px-3 py-1 rounded-lg bg-white text-emerald-950 shadow-2xs border border-emerald-200 transition-all';
      btnDistAuto.className = 'px-3 py-1 rounded-lg text-slate-600 hover:text-slate-900 transition-all';
      document.getElementById('gen-clo-plo-distribution-container')?.classList.remove('hidden');
      this.renderCLOPLODistribution();
    });

    // Duration and Weekly Hours Listeners
    const durInput = document.getElementById('input-gen-course-duration');
    const hrsInput = document.getElementById('input-gen-hours-per-week');
    durInput?.addEventListener('input', () => this.updateGenHoursCalculation());
    durInput?.addEventListener('change', () => this.updateGenHoursCalculation());
    hrsInput?.addEventListener('input', () => this.updateGenHoursCalculation());
    hrsInput?.addEventListener('change', () => this.updateGenHoursCalculation());

    // Course Type switchers (Theory vs Lab)
    document.getElementById('btn-gen-type-theory')?.addEventListener('click', () => this.setGenCourseType('theory'));
    document.getElementById('btn-gen-type-lab')?.addEventListener('click', () => this.setGenCourseType('lab'));

    // Theory Presets
    document.getElementById('btn-gen-preset-dsp')?.addEventListener('click', () => {
      document.getElementById('input-gen-course-name').value = 'EE-314 Digital Signal Processing';
      document.getElementById('input-gen-course-scope').value = 'Discrete-time signals, sampling theorem, Z-transform, DFT/FFT algorithms, FIR and IIR digital filter synthesis, and real-time DSP processor implementation.';
      if (durInput) durInput.value = '16';
      if (hrsInput) hrsInput.value = '3';
      this.updateGenHoursCalculation();
      this.genSelectedPLOs = ['PLO-1', 'PLO-2', 'PLO-3', 'PLO-5'];
      this.renderGenPLOCheckboxes();
    });

    document.getElementById('btn-gen-preset-control')?.addEventListener('click', () => {
      document.getElementById('input-gen-course-name').value = 'EE-315 Feedback Control Systems';
      document.getElementById('input-gen-course-scope').value = 'Mathematical modeling of electromechanical systems, block diagrams, root locus, frequency response, stability criteria, and PID compensator design.';
      if (durInput) durInput.value = '16';
      if (hrsInput) hrsInput.value = '3';
      this.updateGenHoursCalculation();
      this.genSelectedPLOs = ['PLO-1', 'PLO-2', 'PLO-3'];
      this.renderGenPLOCheckboxes();
    });

    document.getElementById('btn-gen-preset-signals')?.addEventListener('click', () => {
      document.getElementById('input-gen-course-name').value = 'EE-221 Signals and Systems';
      document.getElementById('input-gen-course-scope').value = 'Continuous and discrete-time signals, convolution, Fourier series, Fourier transforms, Laplace transforms, and frequency response analysis.';
      if (durInput) durInput.value = '16';
      if (hrsInput) hrsInput.value = '3';
      this.updateGenHoursCalculation();
      this.genSelectedPLOs = ['PLO-1', 'PLO-2'];
      this.renderGenPLOCheckboxes();
    });

    // Lab Presets
    document.getElementById('btn-gen-preset-embed-lab')?.addEventListener('click', () => {
      document.getElementById('input-gen-course-name').value = 'EE-312L Microcontroller & Embedded Systems Lab';
      document.getElementById('input-gen-course-scope').value = 'Hands-on firmware development, hardware timers, PWM motor control, multi-channel ADC sensor acquisition, SPI/I2C communication, and FreeRTOS task scheduling on 32-bit ARM testbenches.';
      if (durInput) durInput.value = '16';
      if (hrsInput) hrsInput.value = '3';
      this.updateGenHoursCalculation();
      this.genSelectedPLOs = ['PLO-4', 'PLO-5', 'PLO-9', 'PLO-10'];
      this.renderGenPLOCheckboxes();
    });

    document.getElementById('btn-gen-preset-dsp-lab')?.addEventListener('click', () => {
      document.getElementById('input-gen-course-name').value = 'EE-314L Digital Signal Processing Lab';
      document.getElementById('input-gen-course-scope').value = 'MATLAB/Python signal generation, FFT spectrum analysis, FIR/IIR filter implementation, audio signal filtering, and real-time DSP processor testbenches.';
      if (durInput) durInput.value = '16';
      if (hrsInput) hrsInput.value = '3';
      this.updateGenHoursCalculation();
      this.genSelectedPLOs = ['PLO-4', 'PLO-5', 'PLO-10'];
      this.renderGenPLOCheckboxes();
    });

    document.getElementById('btn-gen-preset-controls-lab')?.addEventListener('click', () => {
      document.getElementById('input-gen-course-name').value = 'EE-315L Control Systems Lab';
      document.getElementById('input-gen-course-scope').value = 'DC motor plant parameter extraction, transient response testing, analog lead-lag compensator design, and hardware-in-the-loop PID tuning.';
      if (durInput) durInput.value = '16';
      if (hrsInput) hrsInput.value = '3';
      this.updateGenHoursCalculation();
      this.genSelectedPLOs = ['PLO-3', 'PLO-4', 'PLO-5'];
      this.renderGenPLOCheckboxes();
    });

    // Action buttons
    document.getElementById('btn-generate-curriculum')?.addEventListener('click', () => this.runCurriculumGeneration());
    document.getElementById('btn-transfer-to-evaluator')?.addEventListener('click', () => this.transferToEvaluator());
    document.getElementById('btn-export-syllabus-pdf')?.addEventListener('click', () => this.exportSyllabusPDF());

    // Initial calculation and PLO sync
    this.updateGenHoursCalculation();
    this.syncGenPLOTextInput();
  }

  parsePLOsFromText(text) {
    if (!text || !text.trim()) return [];
    const tokens = text.split(/[,;\s]+/).map(t => t.trim()).filter(Boolean);
    const result = [];
    tokens.forEach(tok => {
      const m = tok.match(/^(?:plo[-_]?)?([1-9]|1[0-1])$/i);
      if (m) {
        const id = `PLO-${m[1]}`;
        if (!result.includes(id)) result.push(id);
      }
    });
    return result;
  }

  syncGenPLOTextInput() {
    const textInput = document.getElementById('input-gen-plos-text');
    const badgeEl = document.getElementById('gen-selected-plos-count-badge');
    if (textInput && document.activeElement !== textInput) {
      textInput.value = this.genSelectedPLOs.join(', ');
    }
    if (badgeEl) {
      if (this.genSelectedPLOs.length === 0) {
        badgeEl.textContent = '0 PLOs (Select at least 1)';
        badgeEl.className = 'text-xs font-black px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-200';
      } else {
        badgeEl.textContent = `${this.genSelectedPLOs.length} PLOs Mapped`;
        badgeEl.className = 'text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200';
      }
    }
  }

  renderCLOPLODistribution() {
    const container = document.getElementById('gen-clo-plo-distribution-container');
    if (!container) return;

    if (!this.genCustomPLOMapping) {
      container.classList.add('hidden');
      return;
    }
    container.classList.remove('hidden');

    if (this.genSelectedPLOs.length === 0) {
      container.innerHTML = `
        <div class="p-3 text-center text-xs text-rose-600 font-bold bg-rose-50 rounded-lg border border-rose-200">
          ⚠️ Please provide at least one Course-Mapped PLO above to assign to outcomes.
        </div>
      `;
      return;
    }

    let rowsHTML = `
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-black uppercase tracking-wider text-slate-800">Assign Target PLO for each requested CLO:</span>
        <span class="text-xs text-slate-600 font-semibold">Mapped from your course PLOs</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
    `;

    for (let i = 1; i <= this.genCLOCount; i++) {
      const defaultPLO = this.genCLOPLOMap[i] && this.genSelectedPLOs.includes(this.genCLOPLOMap[i])
        ? this.genCLOPLOMap[i]
        : this.genSelectedPLOs[(i - 1) % this.genSelectedPLOs.length];
      this.genCLOPLOMap[i] = defaultPLO;

      rowsHTML += `
        <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
          <span class="font-black text-xs text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">CLO #${i}</span>
          <select class="gen-clo-plo-select flex-1 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500" data-clo="${i}">
            ${this.genSelectedPLOs.map(ploId => {
              const ploObj = PLO_LIST.find(p => p.id === ploId);
              const title = ploObj ? `${ploObj.code}: ${ploObj.title.slice(0, 18)}...` : ploId;
              return `<option value="${ploId}" ${ploId === defaultPLO ? 'selected' : ''}>${title}</option>`;
            }).join('')}
          </select>
        </div>
      `;
    }

    rowsHTML += `</div>`;
    container.innerHTML = rowsHTML;

    container.querySelectorAll('.gen-clo-plo-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const cloId = parseInt(e.target.getAttribute('data-clo'));
        this.genCLOPLOMap[cloId] = e.target.value;
      });
    });
  }

  getEffectiveCLOPLOMap() {
    const map = {};
    for (let i = 1; i <= this.genCLOCount; i++) {
      if (this.genCustomPLOMapping && this.genCLOPLOMap[i] && this.genSelectedPLOs.includes(this.genCLOPLOMap[i])) {
        map[i] = this.genCLOPLOMap[i];
      } else {
        map[i] = this.genSelectedPLOs[(i - 1) % this.genSelectedPLOs.length] || 'PLO-1';
      }
    }
    return map;
  }

  setGenCourseType(type) {
    this.genCourseType = type;
    const btnTheory = document.getElementById('btn-gen-type-theory');
    const btnLab = document.getElementById('btn-gen-type-lab');
    const presetsTheory = document.getElementById('gen-presets-theory');
    const presetsLab = document.getElementById('gen-presets-lab');
    const btnGenText = document.getElementById('btn-gen-text');
    const labelCourseName = document.getElementById('label-gen-course-name');
    const durInput = document.getElementById('input-gen-course-duration');
    const hrsInput = document.getElementById('input-gen-hours-per-week');
    const nameInput = document.getElementById('input-gen-course-name');
    const scopeInput = document.getElementById('input-gen-course-scope');

    if (type === 'lab') {
      btnLab?.classList.add('bg-white', 'text-emerald-950', 'shadow-xs', 'border', 'border-emerald-300');
      btnLab?.classList.remove('text-slate-600');
      btnTheory?.classList.remove('bg-white', 'text-emerald-950', 'shadow-xs', 'border', 'border-emerald-300');
      btnTheory?.classList.add('text-slate-600');

      presetsTheory?.classList.add('hidden');
      presetsLab?.classList.remove('hidden');

      if (btnGenText) btnGenText.textContent = 'Generate Lab CLOs, Experiments & Mapping Matrix';
      if (labelCourseName) labelCourseName.textContent = 'Lab Course Code & Title';

      if (nameInput && (nameInput.value.includes('EE-314') || !nameInput.value.toLowerCase().includes('lab'))) {
        nameInput.value = 'EE-312L Microcontroller & Embedded Systems Lab';
        if (scopeInput) scopeInput.value = 'Hands-on firmware development, hardware timers, PWM motor control, multi-channel ADC sensor acquisition, SPI/I2C communication, and FreeRTOS task scheduling on 32-bit ARM testbenches.';
      }

      if (durInput) durInput.value = '16';
      if (hrsInput) hrsInput.value = '3';
      this.updateGenHoursCalculation();

      this.genSelectedPLOs = ['PLO-4', 'PLO-5', 'PLO-9', 'PLO-10'];
      this.renderGenPLOCheckboxes();
    } else {
      btnTheory?.classList.add('bg-white', 'text-emerald-950', 'shadow-xs', 'border', 'border-emerald-300');
      btnTheory?.classList.remove('text-slate-600');
      btnLab?.classList.remove('bg-white', 'text-emerald-950', 'shadow-xs', 'border', 'border-emerald-300');
      btnLab?.classList.add('text-slate-600');

      presetsLab?.classList.add('hidden');
      presetsTheory?.classList.remove('hidden');

      if (btnGenText) btnGenText.textContent = 'Generate Theory CLOs, Topics & Mapping Matrix';
      if (labelCourseName) labelCourseName.textContent = 'Course Code & Title';

      if (nameInput && nameInput.value.includes('EE-312L')) {
        nameInput.value = 'EE-314 Digital Signal Processing';
        if (scopeInput) scopeInput.value = 'Discrete-time signals, sampling theorem, Z-transform, DFT/FFT algorithms, FIR and IIR digital filter synthesis, and real-time DSP processor implementation.';
      }

      if (durInput) durInput.value = '16';
      if (hrsInput) hrsInput.value = '3';
      this.updateGenHoursCalculation();

      this.genSelectedPLOs = ['PLO-1', 'PLO-2', 'PLO-3', 'PLO-5'];
      this.renderGenPLOCheckboxes();
    }
  }

  updateGenHoursCalculation() {
    const durInput = document.getElementById('input-gen-course-duration');
    const hrsInput = document.getElementById('input-gen-hours-per-week');
    const calcEl = document.getElementById('gen-total-hours-calc');
    const badgeEl = document.getElementById('gen-duration-breakdown-badge');

    const weeks = Math.max(1, parseInt(durInput?.value) || 16);
    const hrs = Math.max(1, parseInt(hrsInput?.value) || 3);
    const total = weeks * hrs;

    this.genCourseDuration = weeks;
    this.genHoursPerWeek = hrs;

    if (calcEl) calcEl.textContent = `${total} Contact Hours`;
    if (badgeEl) badgeEl.textContent = `${weeks} wks × ${hrs} hrs`;
  }

  renderGenPLOCheckboxes(syncText = true) {
    const container = document.getElementById('gen-plo-checkboxes');
    if (!container) return;

    if (syncText) {
      this.syncGenPLOTextInput();
    }

    container.innerHTML = PLO_LIST.map(p => {
      const isChecked = this.genSelectedPLOs.includes(p.id);
      return `
        <label class="flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${isChecked ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold shadow-2xs' : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'}">
          <input 
            type="checkbox" 
            class="gen-plo-cb rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" 
            value="${p.id}" 
            ${isChecked ? 'checked' : ''}
          />
          <div class="leading-tight">
            <span class="font-extrabold text-xs text-slate-900 block">${p.code}</span>
            <span class="text-xs text-slate-600 font-medium line-clamp-1">${p.title}</span>
          </div>
        </label>
      `;
    }).join('');

    container.querySelectorAll('.gen-plo-cb').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const val = e.target.value;
        if (e.target.checked) {
          if (!this.genSelectedPLOs.includes(val)) this.genSelectedPLOs.push(val);
        } else {
          this.genSelectedPLOs = this.genSelectedPLOs.filter(p => p !== val);
        }
        this.renderGenPLOCheckboxes(true);
      });
    });

    this.renderCLOPLODistribution();
  }

  async runCurriculumGeneration() {
    const courseName = document.getElementById('input-gen-course-name').value.trim();
    const courseScope = document.getElementById('input-gen-course-scope').value.trim();
    const durationWeeks = Math.max(1, parseInt(document.getElementById('input-gen-course-duration')?.value) || 16);
    const hoursPerWeek = Math.max(1, parseInt(document.getElementById('input-gen-hours-per-week')?.value) || 3);
    const totalHours = durationWeeks * hoursPerWeek;

    this.genCourseDuration = durationWeeks;
    this.genHoursPerWeek = hoursPerWeek;

    if (!courseName) {
      alert('Please enter a Course Title before generating.');
      document.getElementById('input-gen-course-name').focus();
      return;
    }

    if (this.genSelectedPLOs.length === 0) {
      alert('Please provide at least one Course-Mapped PLO (e.g. PLO-1, PLO-2) for this course.');
      document.getElementById('input-gen-plos-text')?.focus();
      return;
    }

    this.setEvaluatingState(true, `Synthesizing ${this.genCLOCount} SMART CLOs & topical syllabus for ${durationWeeks} weeks (${totalHours} contact hrs)...`);

    try {
      const cloPLOMap = this.getEffectiveCLOPLOMap();
      const result = await geminiEngine.generateCurriculumAndCLOs({
        courseName,
        courseScope,
        targetPLOs: this.genSelectedPLOs,
        cloPLOMap,
        cloCount: this.genCLOCount,
        durationWeeks,
        hoursPerWeek,
        courseType: this.genCourseType
      });

      this.generatedCurriculum = result;
      this.renderGeneratedCurriculum(result, courseName);

      document.getElementById('gen-results-filled')?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      alert(`Curriculum Generation Error: ${err.message}`);
    } finally {
      this.setEvaluatingState(false);
    }
  }

  renderGeneratedCurriculum(data, courseName) {
    const emptyState = document.getElementById('gen-results-empty');
    const filledState = document.getElementById('gen-results-filled');

    if (emptyState) emptyState.classList.add('hidden');
    if (filledState) filledState.classList.remove('hidden');

    const isLab = this.genCourseType === 'lab';
    const dur = data.durationWeeks || this.genCourseDuration || 16;
    const hpw = data.hoursPerWeek || this.genHoursPerWeek || (isLab ? 3 : 3);
    const tot = data.totalContactHours || (dur * hpw);

    document.getElementById('gen-res-course-title').textContent = courseName || (isLab ? 'Designed Laboratory Curriculum' : 'Designed Engineering Curriculum');
    document.getElementById('gen-res-course-summary').textContent = data.courseSummary || '';
    document.getElementById('gen-res-clo-count-badge').textContent = `${(data.clos || []).length} Outcomes Defined`;

    // Dynamic type badge and headings
    const typeBadge = document.getElementById('gen-res-type-badge');
    if (typeBadge) {
      if (isLab) {
        typeBadge.textContent = 'Laboratory Course';
        typeBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-800 border border-orange-200';
      } else {
        typeBadge.textContent = 'Theory Course';
        typeBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200';
      }
    }

    const closTitle = document.getElementById('gen-section-clos-title');
    if (closTitle) {
      closTitle.textContent = isLab ? 'Suggested Laboratory Learning Outcomes (CLOs)' : 'Suggested Course Learning Outcomes (CLOs)';
    }

    const topicsTitle = document.getElementById('gen-section-topics-title');
    if (topicsTitle) {
      topicsTitle.textContent = isLab ? 'List of Laboratory Experiments & Contact Hours' : 'Modular Curriculum Topics & Contact Hours';
    }

    const matrixTitle = document.getElementById('gen-matrix-title');
    if (matrixTitle) {
      matrixTitle.textContent = isLab ? 'Experiment-to-CLO Constructive Alignment Matrix' : 'Topic-to-CLO Constructive Alignment Matrix';
    }

    const matrixDesc = document.getElementById('gen-matrix-desc');
    if (matrixDesc) {
      matrixDesc.textContent = isLab
        ? 'Direct mapping between weekly laboratory experiments, apparatus tasks, and target CLOs.'
        : 'Constructive alignment matrix mapping instructional modules to Course Learning Outcomes, delivery modes, and contact hour allocation.';
    }

    const durBadge = document.getElementById('gen-res-duration-badge');
    if (durBadge) durBadge.textContent = `${dur} Weeks`;

    const hrsBadge = document.getElementById('gen-res-hours-badge');
    if (hrsBadge) hrsBadge.textContent = `${hpw} Hrs/Wk`;

    const totBadge = document.getElementById('gen-res-total-hours-badge');
    if (totBadge) totBadge.textContent = `${tot} Total Contact Hours`;

    // Render Course-to-PLO Alignment Confirmation Card
    const coverageList = document.getElementById('gen-plo-coverage-list');
    const coverageBadge = document.getElementById('gen-plo-coverage-badge');

    if (coverageList) {
      const mappedPLOs = this.genSelectedPLOs.length > 0 ? this.genSelectedPLOs : (data.courseMappedPLOs || []);
      let coveredCount = 0;

      coverageList.innerHTML = mappedPLOs.map(ploId => {
        const ploObj = PLO_LIST.find(p => p.id === ploId) || { code: ploId, title: 'Program Learning Outcome' };
        const matchingCLOs = (data.clos || []).filter(c => c.plo === ploId).map(c => `CLO-${c.id}`);
        const isCovered = matchingCLOs.length > 0;
        if (isCovered) coveredCount++;

        return `
          <div class="p-3.5 bg-white border ${isCovered ? 'border-emerald-200 shadow-2xs' : 'border-rose-200 bg-rose-50/50'} rounded-2xl flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-950 font-black text-xs">${ploObj.code}</span>
                <span class="text-xs font-extrabold px-2 py-0.5 rounded-full ${isCovered ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-100 text-rose-900'}">
                  ${isCovered ? `${matchingCLOs.length} Outcomes` : 'Missing'}
                </span>
              </div>
              <h5 class="font-extrabold text-slate-950 text-sm">${ploObj.title}</h5>
            </div>
            <div class="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span class="text-slate-600 font-bold">Attained by:</span>
              <span class="font-black text-orange-700">${isCovered ? matchingCLOs.join(', ') : 'None'}</span>
            </div>
          </div>
        `;
      }).join('');

      if (coverageBadge) {
        const total = mappedPLOs.length;
        if (total > 0 && coveredCount === total) {
          coverageBadge.textContent = `100% Course PLOs Addressed (${coveredCount}/${total})`;
          coverageBadge.className = 'px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-200';
        } else {
          coverageBadge.textContent = `${coveredCount}/${total} Course PLOs Addressed`;
          coverageBadge.className = 'px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-100 text-orange-900 border border-orange-200';
        }
      }
    }

    // Render CLO Cards
    const closContainer = document.getElementById('gen-clos-list');
    if (closContainer) {
      closContainer.innerHTML = (data.clos || []).map(c => `
        <div class="p-5 bg-white border border-slate-200/90 rounded-2xl flex flex-col justify-between hover:border-emerald-300 shadow-2xs hover:shadow-sm transition-all">
          <div>
            <div class="flex items-center justify-between mb-2.5">
              <span class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 font-black text-xs flex items-center justify-center">
                #${c.id}
              </span>
              <div class="flex items-center gap-1.5">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-900 border border-blue-200">
                  ${c.plo}
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-100 text-orange-900 border border-orange-200">
                  ${c.taxonomy}
                </span>
              </div>
            </div>

            <p class="text-sm font-bold text-slate-950 leading-relaxed mb-2.5">
              "${c.statement}"
            </p>

            <p class="text-xs text-slate-700 leading-relaxed mb-3">
              <strong class="text-slate-900 font-bold">Rationale:</strong> ${c.rationale || (isLab ? 'Directly aligned with practical experimentation and tool competencies.' : 'Constructively aligned with technical competencies.')}
            </p>
          </div>

          <div class="pt-2.5 border-t border-slate-100 flex justify-end">
            <button class="btn-copy-gen-clo btn-interactive text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs transition-colors" data-statement="${encodeURIComponent(c.statement)}">
              Copy Statement
            </button>
          </div>
        </div>
      `).join('');

      closContainer.querySelectorAll('.btn-copy-gen-clo').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const text = decodeURIComponent(e.target.getAttribute('data-statement'));
          navigator.clipboard.writeText(text);
          e.target.textContent = 'Copied!';
          setTimeout(() => e.target.textContent = 'Copy Statement', 2000);
        });
      });
    }

    // Render Topics / Lab Experiments List
    const topicsContainer = document.getElementById('gen-topics-list');
    if (topicsContainer) {
      topicsContainer.innerHTML = (data.topics || []).map(t => `
        <div class="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <span class="font-extrabold text-slate-950 text-sm">
              ${isLab ? `Experiment ${t.moduleNumber}: ${t.title}` : `Module ${t.moduleNumber}: ${t.title}`}
            </span>
            <div class="flex items-center gap-2">
              ${t.weekRange ? `<span class="text-xs font-extrabold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">${t.weekRange}</span>` : ''}
              <span class="text-xs font-bold text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">${t.contactHours || (isLab ? 3 : 6)} Contact Hours</span>
            </div>
          </div>

          ${t.apparatus ? `
            <div class="mb-2.5 p-2.5 bg-orange-50/80 border border-orange-200/70 rounded-xl text-xs text-orange-950 font-semibold leading-relaxed">
              <strong class="text-orange-900 font-extrabold">Apparatus / Equipment:</strong> ${t.apparatus}
            </div>
          ` : ''}

          <div class="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
            ${isLab ? 'Experimental Tasks & Deliverables:' : 'Key Subtopics Covered:'}
          </div>

          <ul class="space-y-1.5">
            ${(t.subtopics || []).map(st => `
              <li class="text-xs text-slate-800 font-medium flex items-start gap-2">
                <span class="text-emerald-600 font-bold">•</span>
                <span class="leading-relaxed">${st}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `).join('');
    }

    // Render Matrix Table
    const matrixTable = document.getElementById('gen-matrix-table');
    if (matrixTable) {
      matrixTable.innerHTML = `
        <thead>
          <tr class="bg-slate-100/90 text-slate-900 font-extrabold text-xs border-b border-slate-200">
            <th class="p-3.5">${isLab ? 'Laboratory Experiment / Apparatus' : 'Course Module / Topic'}</th>
            <th class="p-3.5 w-28">Week Span</th>
            <th class="p-3.5 w-32">Directly Mapped CLOs</th>
            <th class="p-3.5 w-24">Hours</th>
            <th class="p-3.5 w-44">${isLab ? 'Delivery & Evaluation Mode' : 'Instructional Delivery'}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-xs">
          ${(data.topicCLOMatrix || []).map(m => `
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="p-3.5 font-bold text-slate-950">${m.topicTitle}</td>
              <td class="p-3.5 text-slate-700 font-semibold">${m.weekRange || '-'}</td>
              <td class="p-3.5">
                <div class="flex flex-wrap gap-1">
                  ${(m.mappedCLOs || []).map(clo => `
                    <span class="px-2 py-0.5 rounded bg-orange-100 text-orange-950 font-black text-xs border border-orange-200">${clo}</span>
                  `).join('')}
                </div>
              </td>
              <td class="p-3.5 text-emerald-900 font-extrabold">${m.contactHours} hrs</td>
              <td class="p-3.5 text-slate-700 font-semibold">${m.deliveryMode}</td>
            </tr>
          `).join('')}
        </tbody>
      `;
    }
  }

  transferToEvaluator() {
    if (!this.generatedCurriculum || !this.generatedCurriculum.clos || this.generatedCurriculum.clos.length === 0) {
      alert('No generated CLOs available to transfer.');
      return;
    }

    const isLab = this.genCourseType === 'lab';
    const courseName = document.getElementById('input-gen-course-name').value.trim();
    const courseScope = document.getElementById('input-gen-course-scope').value.trim();

    // Populate Tab 2 fields
    document.getElementById('input-course-name').value = courseName;
    document.getElementById('input-course-desc').value = courseScope || this.generatedCurriculum.courseSummary || '';

    // Convert topics to Course Plan text
    const planLines = (this.generatedCurriculum.topics || []).map(t => {
      const prefix = t.weekRange || (isLab ? `Exp ${t.moduleNumber}` : `Module ${t.moduleNumber}`);
      const title = isLab ? `Lab Exp ${t.moduleNumber}: ${t.title}` : `Module ${t.moduleNumber}: ${t.title}`;
      const appText = t.apparatus ? ` | Apparatus: ${t.apparatus}` : '';
      const subKey = isLab ? 'Tasks' : 'Topics';
      return `${prefix}: ${title} (${t.contactHours || (isLab ? 3 : 6)} Contact Hours)${appText} - ${subKey}: ${(t.subtopics || []).join(', ')}`;
    }).join('\n');
    
    const planInput = document.getElementById('input-course-plan');
    if (planInput) planInput.value = planLines;
    this.coursePlanText = planLines;
    this.courseTopics = JSON.parse(JSON.stringify(this.generatedCurriculum.topics || []));

    // Convert to CLO state
    this.clos = this.generatedCurriculum.clos.map((c, i) => ({
      id: i + 1,
      statement: c.statement,
      plo: c.plo,
      taxonomy: c.taxonomy
    }));

    // Re-render inputs in Tab 2
    this.renderCLOInputs();

    // Switch to Tab 2
    this.switchTab('clo-evaluator', true);

    const typeDesc = isLab ? 'laboratory experiments' : 'weekly course plan';
    alert(`Successfully transferred ${this.clos.length} suggested CLOs & ${typeDesc} to the CLO Quality Evaluator!`);
  }

  async exportSyllabusPDF() {
    if (!this.generatedCurriculum) {
      const courseName = document.getElementById('input-gen-course-name')?.value.trim();
      if (!courseName) {
        alert('Please enter a Course Title or select a preset before exporting the Syllabus PDF.');
        document.getElementById('input-gen-course-name')?.focus();
        return;
      }
      await this.runCurriculumGeneration();
      if (!this.generatedCurriculum) return;
    }

    const courseName = document.getElementById('input-gen-course-name').value.trim() || 'Course Specification';
    const durationWeeks = this.generatedCurriculum.durationWeeks || this.genCourseDuration || 16;
    const hoursPerWeek = this.generatedCurriculum.hoursPerWeek || this.genHoursPerWeek || 3;
    const totalHours = this.generatedCurriculum.totalContactHours || (durationWeeks * hoursPerWeek);

    const dossier = PDFReportGenerator.generateSyllabusReport({
      courseName,
      clos: this.generatedCurriculum.clos || [],
      topics: this.generatedCurriculum.topics || [],
      matrix: this.generatedCurriculum.topicCLOMatrix || [],
      durationWeeks,
      hoursPerWeek,
      totalHours,
      courseType: this.genCourseType,
      courseMappedPLOs: this.genSelectedPLOs
    });

    PDFReportGenerator.triggerPrint(dossier);
  }

  // --- Render Standards Hub (PEC 11 PLOs & Bloom's Taxonomy) ---
  renderStandardsHub() {
    const plosContainer = document.getElementById('pec-plos-full-list');
    if (plosContainer) {
      plosContainer.innerHTML = PLO_LIST.map(p => `
        <div class="p-4 sm:p-5 bg-white border border-slate-200/90 rounded-2xl hover:border-blue-300 shadow-2xs transition-all">
          <div class="flex items-center gap-2 mb-2">
            <span class="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-200 font-black text-xs">${p.code}</span>
            <h4 class="font-extrabold text-slate-950 text-sm">${p.title}</h4>
          </div>
          <p class="text-xs text-slate-700 leading-relaxed font-normal">${p.description}</p>
        </div>
      `).join('');
    }

    const bloomsContainer = document.getElementById('blooms-cognitive-full-list');
    if (bloomsContainer) {
      const cognitiveLevels = TAXONOMY_LEVELS.filter(t => t.domain === 'Cognitive');
      bloomsContainer.innerHTML = cognitiveLevels.map(t => `
        <div class="p-4 sm:p-5 bg-white border border-slate-200/90 rounded-2xl hover:border-orange-300 shadow-2xs transition-all flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
              <span class="font-extrabold text-slate-950 text-sm">${t.title}</span>
              <span class="px-2.5 py-0.5 rounded-md bg-orange-100 text-orange-900 border border-orange-200 font-black text-xs">${t.level}</span>
            </div>
            <div class="flex flex-wrap gap-1.5 mt-2.5">
              ${t.verbs.map(v => `
                <span class="px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-semibold text-slate-800 shadow-2xs">
                  ${v}
                </span>
              `).join('')}
            </div>
          </div>
        </div>
      `).join('');
    }
  }

  // --- Dynamic CLO Inputs Rendering ---
  renderCLOInputs() {
    const container = document.getElementById('clo-inputs-container');
    if (!container) return;

    container.innerHTML = '';

    this.clos.forEach((clo, idx) => {
      const cloCard = document.createElement('div');
      cloCard.className = 'p-5 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-orange-200 transition-all mb-4 relative';
      
      const unmeasurableDetected = UNMEASURABLE_VERBS_WARNING.some(v => 
        clo.statement.toLowerCase().startsWith(v) || clo.statement.toLowerCase().includes(` ${v} `)
      );

      cloCard.innerHTML = `
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 font-extrabold text-xs flex items-center justify-center">
              #${idx + 1}
            </span>
            <span class="font-extrabold text-slate-900 text-sm tracking-wide">CLO-${idx + 1}</span>
            ${unmeasurableDetected ? `
              <span class="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                ⚠ Passive Verb Warning
              </span>
            ` : ''}
          </div>
          ${this.clos.length > 1 ? `
            <button class="btn-remove-clo text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors" data-index="${idx}" title="Remove this CLO">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          ` : ''}
        </div>

        <div class="mb-3">
          <label class="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
            CLO Statement <span class="text-rose-500">*</span>
          </label>
          <textarea 
            rows="2" 
            class="clo-statement-input w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none transition-all font-medium text-slate-800" 
            data-index="${idx}"
            placeholder="e.g. Design an operational amplifier circuit meeting specified slew rate and gain bandwidth criteria..."
          >${clo.statement}</textarea>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              Mapped PEC PLO (1 - 11)
            </label>
            <select class="clo-plo-select w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 focus:outline-none font-semibold text-slate-800" data-index="${idx}">
              ${PLO_LIST.map(p => `
                <option value="${p.id}" ${clo.plo === p.id ? 'selected' : ''}>${p.code}: ${p.title}</option>
              `).join('')}
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              Bloom's Taxonomy Level
            </label>
            <select class="clo-tax-select w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 focus:outline-none font-semibold text-slate-800" data-index="${idx}">
              <optgroup label="Cognitive Domain">
                ${TAXONOMY_LEVELS.filter(t => t.domain === 'Cognitive').map(t => `
                  <option value="${t.level}" ${clo.taxonomy === t.level ? 'selected' : ''}>${t.title}</option>
                `).join('')}
              </optgroup>
              <optgroup label="Affective Domain">
                ${TAXONOMY_LEVELS.filter(t => t.domain === 'Affective').map(t => `
                  <option value="${t.level}" ${clo.taxonomy === t.level ? 'selected' : ''}>${t.title}</option>
                `).join('')}
              </optgroup>
              <optgroup label="Psychomotor Domain">
                ${TAXONOMY_LEVELS.filter(t => t.domain === 'Psychomotor').map(t => `
                  <option value="${t.level}" ${clo.taxonomy === t.level ? 'selected' : ''}>${t.title}</option>
                `).join('')}
              </optgroup>
            </select>
          </div>
        </div>
      `;

      container.appendChild(cloCard);
    });

    // Bind event listeners for inputs
    container.querySelectorAll('.clo-statement-input').forEach(textarea => {
      textarea.addEventListener('input', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'));
        this.clos[idx].statement = e.target.value;
      });
    });

    container.querySelectorAll('.clo-plo-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'));
        this.clos[idx].plo = e.target.value;
      });
    });

    container.querySelectorAll('.clo-tax-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'));
        this.clos[idx].taxonomy = e.target.value;
      });
    });

    container.querySelectorAll('.btn-remove-clo').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'));
        this.removeCLO(idx);
      });
    });

    const countBadge = document.getElementById('clo-count-badge');
    if (countBadge) countBadge.textContent = `${this.clos.length} CLOs`;

    this.populateResilienceCLODropdown();
  }

  addCLO() {
    const nextId = this.clos.length + 1;
    this.clos.push({
      id: nextId,
      statement: '',
      plo: `PLO-${Math.min(nextId, 11)}`,
      taxonomy: 'C3'
    });
    this.renderCLOInputs();
  }

  removeCLO(index) {
    if (this.clos.length <= 1) return;
    this.clos.splice(index, 1);
    this.renderCLOInputs();
  }

  clearCLOs() {
    this.clos = [{ id: 1, statement: '', plo: 'PLO-1', taxonomy: 'C2' }];
    document.getElementById('input-course-name').value = '';
    document.getElementById('input-course-desc').value = '';
    const planInput = document.getElementById('input-course-plan');
    if (planInput) planInput.value = '';
    this.coursePlanText = '';
    this.courseTopics = [];
    this.renderCLOInputs();
  }

  loadSampleCourse(key) {
    const sample = SAMPLE_COURSES[key];
    if (!sample) return;

    document.getElementById('input-course-name').value = sample.name;
    document.getElementById('input-course-desc').value = sample.description;
    const planInput = document.getElementById('input-course-plan');
    if (planInput) planInput.value = sample.coursePlan || '';
    this.coursePlanText = sample.coursePlan || '';
    this.courseTopics = sample.topics ? JSON.parse(JSON.stringify(sample.topics)) : [];
    this.clos = JSON.parse(JSON.stringify(sample.clos));
    this.renderCLOInputs();
  }

  checkStoredSample() {
    this.loadSampleCourse('embedded');
  }

  // --- Dynamic Assessment Questions Rendering ---
  renderAssessmentQuestions() {
    const container = document.getElementById('question-inputs-container');
    if (!container) return;

    container.innerHTML = '';

    this.questions.forEach((q, idx) => {
      const qCard = document.createElement('div');
      qCard.className = 'p-5 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-orange-200 transition-all mb-4';

      qCard.innerHTML = `
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-extrabold text-xs flex items-center justify-center">
              Q${idx + 1}
            </span>
            <span class="font-extrabold text-slate-900 text-sm tracking-wide">Question ${idx + 1}</span>
          </div>
          ${this.questions.length > 1 ? `
            <button class="btn-remove-q text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors" data-index="${idx}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          ` : ''}
        </div>

        <div class="mb-3">
          <label class="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
            Question Text & Context <span class="text-rose-500">*</span>
          </label>
          <textarea 
            rows="2" 
            class="q-text-input w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none transition-all font-medium text-slate-800" 
            data-index="${idx}"
          >${q.text}</textarea>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              Allocated Marks
            </label>
            <input 
              type="number" 
              class="q-marks-input w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 font-bold text-slate-800" 
              data-index="${idx}" 
              value="${q.marks}" 
              min="1"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              Mapped Course Outcome
            </label>
            <select class="q-clo-select w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 font-semibold text-slate-800" data-index="${idx}">
              ${this.clos.map((c, i) => `
                <option value="CLO-${c.id || i+1}" ${q.mappedCLO === `CLO-${c.id || i+1}` ? 'selected' : ''}>CLO-${c.id || i+1}</option>
              `).join('')}
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              Target Bloom Level
            </label>
            <select class="q-tax-select w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 font-semibold text-slate-800" data-index="${idx}">
              ${TAXONOMY_LEVELS.filter(t => t.domain === 'Cognitive').map(t => `
                <option value="${t.level}" ${q.targetTaxonomy === t.level ? 'selected' : ''}>${t.title}</option>
              `).join('')}
            </select>
          </div>
        </div>
      `;

      container.appendChild(qCard);
    });

    // Bind listeners
    container.querySelectorAll('.q-text-input').forEach(t => {
      t.addEventListener('input', e => {
        const idx = parseInt(e.target.getAttribute('data-index'));
        this.questions[idx].text = e.target.value;
      });
    });

    container.querySelectorAll('.q-marks-input').forEach(m => {
      m.addEventListener('input', e => {
        const idx = parseInt(e.target.getAttribute('data-index'));
        this.questions[idx].marks = parseInt(e.target.value) || 0;
      });
    });

    container.querySelectorAll('.q-clo-select').forEach(s => {
      s.addEventListener('change', e => {
        const idx = parseInt(e.target.getAttribute('data-index'));
        this.questions[idx].mappedCLO = e.target.value;
      });
    });

    container.querySelectorAll('.q-tax-select').forEach(s => {
      s.addEventListener('change', e => {
        const idx = parseInt(e.target.getAttribute('data-index'));
        this.questions[idx].targetTaxonomy = e.target.value;
      });
    });

    container.querySelectorAll('.btn-remove-q').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'));
        if (this.questions.length > 1) {
          this.questions.splice(idx, 1);
          this.renderAssessmentQuestions();
        }
      });
    });
  }

  addQuestion() {
    this.questions.push({
      id: this.questions.length + 1,
      qNumber: `Q${this.questions.length + 1}`,
      text: '',
      marks: 10,
      mappedCLO: 'CLO-1',
      targetTaxonomy: 'C3'
    });
    this.renderAssessmentQuestions();
  }

  loadSampleAssessment() {
    this.questions = JSON.parse(JSON.stringify(SAMPLE_ASSESSMENT.questions));
    this.renderAssessmentQuestions();
  }

  // --- File Upload & Document Extraction ---
  setupFileUploads() {
    const dropzone = document.getElementById('syllabus-dropzone');
    const fileInput = document.getElementById('syllabus-file-input');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());
      
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('border-orange-500', 'bg-orange-50');
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('border-orange-500', 'bg-orange-50');
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('border-orange-500', 'bg-orange-50');
        if (e.dataTransfer.files.length) {
          this.handleSyllabusFile(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
          this.handleSyllabusFile(e.target.files[0]);
        }
      });
    }
  }

  async handleSyllabusFile(file) {
    const statusMsg = document.getElementById('syllabus-upload-status');
    if (statusMsg) {
      statusMsg.innerHTML = `<span class="inline-flex items-center gap-2 text-orange-600 font-bold"><svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Scanning document: "${file.name}"...</span>`;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target.result;
        const mimeType = file.type || 'application/pdf';

        const extracted = await geminiEngine.extractSyllabus(base64Data, mimeType, file.name);

        if (extracted) {
          document.getElementById('input-course-name').value = extracted.courseName || file.name.replace(/\.[^/.]+$/, "");
          document.getElementById('input-course-desc').value = extracted.courseDescription || '';

          if (extracted.coursePlan) {
            const planInput = document.getElementById('input-course-plan');
            if (planInput) planInput.value = extracted.coursePlan;
            this.coursePlanText = extracted.coursePlan;
          }

          if (extracted.clos && extracted.clos.length) {
            this.clos = extracted.clos.map((c, i) => ({
              id: i + 1,
              statement: c.statement,
              plo: c.plo || 'PLO-1',
              taxonomy: c.taxonomy || 'C3'
            }));
            this.renderCLOInputs();
          }

          if (statusMsg) {
            statusMsg.innerHTML = `<span class="text-emerald-600 font-bold">✓ Extracted ${this.clos.length} CLOs and Course Plan from "${file.name}"!</span>`;
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      if (statusMsg) {
        statusMsg.innerHTML = `<span class="text-rose-600 font-bold">Extraction failed: ${err.message}</span>`;
      }
    }
  }

  // --- Run CLO Evaluation ---
  async runCLOEvaluation() {
    const courseName = document.getElementById('input-course-name').value.trim();
    const courseDescription = document.getElementById('input-course-desc').value.trim();
    const coursePlan = document.getElementById('input-course-plan')?.value.trim() || this.coursePlanText || '';
    this.coursePlanText = coursePlan;

    if (!courseName) {
      alert('Please enter the Course Name before starting the evaluation.');
      document.getElementById('input-course-name').focus();
      return;
    }

    const validCLOs = this.clos.filter(c => c.statement.trim().length > 0);
    if (validCLOs.length === 0) {
      alert('Please provide at least one valid CLO statement.');
      return;
    }

    this.setEvaluatingState(true, 'Analyzing Course Plan & CLO Quality against PEC & Bloom rubrics...');

    try {
      const result = await geminiEngine.evaluateCLOs({
        courseName,
        courseDescription,
        coursePlan,
        topics: this.courseTopics,
        clos: validCLOs
      });

      this.cloEvaluationResult = result;
      this.renderCLOResults(result, courseName);

      document.getElementById('clo-results-card')?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      alert(`Evaluation Error: ${err.message}`);
    } finally {
      this.setEvaluatingState(false);
    }
  }

  renderCLOResults(data, courseName) {
    const emptyState = document.getElementById('clo-results-empty');
    const filledState = document.getElementById('clo-results-filled');

    if (emptyState) emptyState.classList.add('hidden');
    if (filledState) filledState.classList.remove('hidden');

    const overall = data.overallSetAnalysis || {};
    const cloResults = data.cloResults || [];
    const outline = data.outlineAnalysis || {};

    const cName = courseName || document.getElementById('input-course-name')?.value.trim() || 'Course';
    const titleEl = document.getElementById('res-eval-course-title');
    if (titleEl) titleEl.textContent = `${cName} • OBE Audit`;

    // Dual Scores
    const cloScoreEl = document.getElementById('res-overall-score');
    if (cloScoreEl) cloScoreEl.textContent = `${overall.coverageScore || '8.5'} / 10`;

    const outlineScoreEl = document.getElementById('res-outline-score');
    if (outlineScoreEl) outlineScoreEl.textContent = `${outline.outlineScore || '8.2'} / 10`;

    // Readiness Badge
    const badgeEl = document.getElementById('res-readiness-badge');
    if (badgeEl) {
      const status = data.readinessStatus || 'ACCREDITED';
      const badgeText = data.readinessBadge || (status === 'ACCREDITED' ? 'Accreditation Ready' : 'Revisions Needed');
      
      let badgeStyle = 'bg-emerald-100 text-emerald-800 border border-emerald-300';
      let icon = '✓';
      if (status === 'MINOR_REVISIONS_NEEDED') {
        badgeStyle = 'bg-amber-100 text-amber-800 border border-amber-300';
        icon = '⚠️';
      } else if (status === 'MAJOR_RESTRUCTURING_REQUIRED') {
        badgeStyle = 'bg-rose-100 text-rose-800 border border-rose-300';
        icon = '⛔';
      }
      badgeEl.className = `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${badgeStyle}`;
      badgeEl.innerHTML = `<span>${icon}</span><span>${badgeText}</span>`;
    }

    // CLO Count badge on View Switcher
    const countBadge = document.getElementById('res-badge-clo-count');
    if (countBadge) countBadge.textContent = cloResults.length;

    // View 1: CLO Analysis Fields
    const summaryEl = document.getElementById('res-overall-summary');
    if (summaryEl) summaryEl.textContent = overall.summary || '';

    const progEl = document.getElementById('res-progression');
    if (progEl) progEl.textContent = overall.progressionCheck || '';

    const redunEl = document.getElementById('res-redundancy');
    if (redunEl) redunEl.textContent = overall.redundancyAssessment || '';

    const recsList = document.getElementById('res-recommendations-list');
    if (recsList) {
      recsList.innerHTML = (overall.recommendations || []).map(r => `
        <li class="flex items-start gap-2 text-xs text-slate-700">
          <span class="text-orange-500 font-black">•</span>
          <span>${r}</span>
        </li>
      `).join('');
    }

    // View 2: Course Plan & Topics Outline Fields
    const outSummaryEl = document.getElementById('res-outline-summary');
    if (outSummaryEl) outSummaryEl.textContent = outline.summary || 'Course outline evaluated against Washington Accord topical breadth and Bloom constructive alignment.';

    const breadthEl = document.getElementById('res-topical-breadth');
    if (breadthEl) breadthEl.textContent = outline.topicalBreadth || 'Satisfactory coverage of fundamental and advanced engineering principles.';

    const pacingEl = document.getElementById('res-pacing-assessment');
    if (pacingEl) pacingEl.textContent = outline.pacingAssessment || 'Instructional hours are appropriately distributed across the semester.';

    const alignBadge = document.getElementById('res-alignment-status-badge');
    if (alignBadge) {
      const isStrong = (outline.alignmentStatus || '').includes('STRONG');
      alignBadge.textContent = isStrong ? 'STRONG ALIGNMENT' : 'NEEDS REFINEMENT';
      alignBadge.className = isStrong 
        ? 'px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-200' 
        : 'px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-200';
    }

    const alignDetails = document.getElementById('res-alignment-details');
    if (alignDetails) alignDetails.textContent = outline.alignmentSummary || 'Lecture modules constructively align with articulated learning outcomes.';

    const unaddressedEl = document.getElementById('res-unaddressed-clos');
    if (unaddressedEl) {
      if (outline.unaddressedCLOs && outline.unaddressedCLOs.length > 0) {
        unaddressedEl.innerHTML = outline.unaddressedCLOs.map(c => `<span class="block text-amber-950 font-medium leading-relaxed">• ${c}</span>`).join('');
      } else {
        unaddressedEl.textContent = 'None detected (all CLOs covered)';
      }
    }

    const orphanEl = document.getElementById('res-orphan-topics');
    if (orphanEl) {
      if (outline.orphanTopics && outline.orphanTopics.length > 0) {
        orphanEl.innerHTML = outline.orphanTopics.map(t => `<span class="block text-slate-800 font-medium leading-relaxed">• ${t}</span>`).join('');
      } else {
        orphanEl.textContent = 'None detected (all topics support CLOs)';
      }
    }

    const missingTopicsList = document.getElementById('res-missing-topics-list');
    if (missingTopicsList) {
      missingTopicsList.innerHTML = (outline.missingModernTopics || []).map(t => `
        <li class="flex items-start gap-2 text-xs text-slate-800 font-medium leading-relaxed">
          <span class="text-emerald-600 font-bold">💡</span>
          <span>${t}</span>
        </li>
      `).join('');
    }

    const outlineRecsList = document.getElementById('res-outline-recs-list');
    if (outlineRecsList) {
      outlineRecsList.innerHTML = (outline.outlineRecommendations || []).map(r => `
        <li class="flex items-start gap-2 text-xs text-slate-800 font-medium leading-relaxed">
          <span class="text-orange-500 font-bold">•</span>
          <span>${r}</span>
        </li>
      `).join('');
    }

    // Switch view to active view (preserving or defaulting to 'clos')
    this.switchEvalView(this.activeEvalView || 'clos');

    const tabsContainer = document.getElementById('clo-result-tabs');
    if (tabsContainer) {
      tabsContainer.innerHTML = cloResults.map((r, i) => {
        const isRetain = (r.verdict || 'RETAIN').toUpperCase() === 'RETAIN';
        const badgeColor = isRetain ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white';
        const activeClass = i === this.activeCLOResultIndex ? 'border-orange-500 bg-orange-50/80 text-orange-950 font-black shadow-xs' : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50 font-bold';

        return `
          <button class="clo-tab-pill px-4 py-2.5 rounded-xl border text-xs flex items-center gap-2 transition-all ${activeClass}" data-index="${i}">
            <span>CLO-${r.cloId || i+1}</span>
            <span class="text-xs px-2 py-0.5 rounded-md font-black ${badgeColor}">${r.verdict || 'RETAIN'}</span>
          </button>
        `;
      }).join('');

      tabsContainer.querySelectorAll('.clo-tab-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          this.activeCLOResultIndex = parseInt(btn.getAttribute('data-index'));
          this.renderSingleCLOResult(cloResults[this.activeCLOResultIndex]);
          this.renderCLOResults(data, courseName);
        });
      });
    }

    if (cloResults.length > 0) {
      this.renderSingleCLOResult(cloResults[this.activeCLOResultIndex || 0]);
    }
  }

  renderSingleCLOResult(item) {
    const container = document.getElementById('single-clo-result-view');
    if (!container || !item) return;

    const isRetain = (item.verdict || 'RETAIN').toUpperCase() === 'RETAIN';
    const originalCLO = this.clos.find(c => c.id === item.cloId) || this.clos[this.activeCLOResultIndex] || {};

    container.innerHTML = `
      <div class="p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs">
        <div class="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-5">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-orange-100 text-orange-800 font-black text-base flex items-center justify-center">
              #${item.cloId || 1}
            </span>
            <div>
              <h4 class="font-extrabold text-slate-950 text-base">Course Learning Outcome ${item.cloId || 1}</h4>
              <p class="text-xs text-slate-600 font-semibold">Mapped to ${originalCLO.plo || 'PLO-1'} • Bloom Level: ${originalCLO.taxonomy || 'C2'}</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div class="text-right">
              <span class="block text-xs font-bold text-slate-600 uppercase tracking-wider">Quality Score</span>
              <span class="text-2xl font-black text-slate-950">${item.qualityScore} / 10</span>
            </div>
            <span class="px-3.5 py-1.5 rounded-xl text-xs font-black tracking-wider uppercase ${isRetain ? 'badge-retain' : 'badge-revise'}">
              ${item.verdict || (isRetain ? 'RETAIN' : 'REVISE')}
            </span>
          </div>
        </div>

        <div class="mb-5">
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Evaluated Statement</label>
          <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 leading-relaxed italic">
            "${originalCLO.statement}"
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div class="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
            <h5 class="text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              Key Strengths
            </h5>
            <ul class="space-y-1.5">
              ${(item.strengths || []).map(s => `
                <li class="text-xs text-emerald-950 font-medium flex items-start gap-2 leading-relaxed">
                  <span class="font-bold text-emerald-600">✓</span>
                  <span>${s}</span>
                </li>
              `).join('')}
            </ul>
          </div>

          <div class="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80">
            <h5 class="text-xs font-extrabold text-amber-950 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-amber-500"></span>
              Areas for Revision
            </h5>
            <ul class="space-y-1.5">
              ${(item.weaknesses || []).map(w => `
                <li class="text-xs text-amber-950 font-medium flex items-start gap-2 leading-relaxed">
                  <span class="font-bold text-amber-600">⚠</span>
                  <span>${w}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>

        ${item.suggestedRevision ? `
          <div class="p-5 bg-orange-50/80 border border-orange-200 rounded-2xl">
            <div class="flex items-center justify-between mb-2.5">
              <span class="text-xs font-extrabold text-orange-950 uppercase tracking-wider flex items-center gap-1.5">
                <svg class="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                AI Suggested Accreditation Revision
              </span>
              <button class="btn-copy-revision btn-interactive text-xs font-bold text-orange-800 hover:text-orange-950 bg-white px-3 py-1.5 rounded-xl border border-orange-200 shadow-2xs transition-all" data-text="${encodeURIComponent(item.suggestedRevision)}">
                Copy Revision
              </button>
            </div>
            <p class="text-sm font-bold text-slate-950 leading-relaxed mb-2">
              "${item.suggestedRevision}"
            </p>
            <p class="text-xs text-slate-800 leading-relaxed">
              <strong class="text-slate-950 font-bold">Rationale:</strong> ${item.explanation || 'Constructively aligned with SMART criteria and PEC rubrics.'}
            </p>
          </div>
        ` : ''}
      </div>
    `;

    container.querySelector('.btn-copy-revision')?.addEventListener('click', (e) => {
      const text = decodeURIComponent(e.target.getAttribute('data-text'));
      navigator.clipboard.writeText(text);
      e.target.textContent = 'Copied!';
      setTimeout(() => e.target.textContent = 'Copy Revision', 2000);
    });
  }

  // --- Run Assessment Evaluation ---
  async runAssessmentEvaluation() {
    const courseName = document.getElementById('input-course-name').value.trim() || 'Electrical Engineering Course';
    const validQuestions = this.questions.filter(q => q.text.trim().length > 0);

    if (validQuestions.length === 0) {
      alert('Please provide at least one exam question to audit.');
      return;
    }

    this.setEvaluatingState(true, 'Auditing Assessment questions for Bloom Taxonomy cognitive alignment...');

    try {
      const result = await geminiEngine.evaluateAssessment({
        courseName,
        clos: this.clos,
        questions: validQuestions
      });

      this.assessmentEvaluationResult = result;
      this.renderAssessmentResults(result);

      document.getElementById('assessment-results-card')?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      alert(`Assessment Audit Error: ${err.message}`);
    } finally {
      this.setEvaluatingState(false);
    }
  }

  renderAssessmentResults(data) {
    const emptyState = document.getElementById('assessment-results-empty');
    const filledState = document.getElementById('assessment-results-filled');

    if (emptyState) emptyState.classList.add('hidden');
    if (filledState) filledState.classList.remove('hidden');

    document.getElementById('res-assessment-score').textContent = `${data.totalAlignmentScore || '7.4'} / 10`;
    document.getElementById('res-assessment-summary').textContent = data.overallSummary || '';
    document.getElementById('res-assessment-weights').textContent = data.marksDistribution || '';

    const questionsList = document.getElementById('assessment-questions-audit-list');
    if (questionsList) {
      questionsList.innerHTML = (data.questions || []).map((q, i) => {
        const rawQ = this.questions[i] || {};
        const isAligned = q.alignmentVerdict === 'ALIGNED';
        const badgeColor = isAligned ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-rose-100 text-rose-800 border-rose-200';

        return `
          <div class="p-5 bg-white border border-slate-200 rounded-2xl mb-4 shadow-2xs">
            <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div class="flex items-center gap-2">
                <span class="font-black text-slate-950 text-sm">Question ${rawQ.qNumber || i+1}</span>
                <span class="text-xs bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded font-bold border border-slate-200">${rawQ.marks || 10} Marks</span>
                <span class="text-xs bg-orange-100 text-orange-950 px-2.5 py-0.5 rounded font-black border border-orange-200">${rawQ.mappedCLO} (${rawQ.targetTaxonomy})</span>
              </div>
              <span class="px-3 py-1 text-xs font-black rounded-lg border ${badgeColor}">
                ${q.alignmentVerdict} (${q.score}/10)
              </span>
            </div>

            <p class="text-sm text-slate-900 font-medium italic leading-relaxed mb-3">"${rawQ.text}"</p>

            <div class="p-3.5 bg-slate-50 rounded-xl text-xs font-semibold text-slate-800 mb-3 border border-slate-200/60 leading-relaxed">
              <strong class="text-slate-950 font-extrabold">Cognitive Match:</strong> ${q.cognitiveMatch}
            </div>

            ${q.suggestedRevision && q.suggestedRevision !== rawQ.text ? `
              <div class="p-4 bg-blue-50/80 border-l-4 border-blue-600 rounded-r-2xl text-xs text-blue-950 leading-relaxed">
                <strong class="block mb-1 text-blue-950 font-extrabold text-xs uppercase tracking-wider">Suggested Cognitive Upgrade:</strong>
                "${q.suggestedRevision}"
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
    }
  }

  // --- PDF Export Triggers across All Tabs ---
  exportOverviewPDF() {
    const dossier = PDFReportGenerator.generateOverviewReport();
    PDFReportGenerator.triggerPrint(dossier);
  }

  async exportCLOPDF() {
    if (!this.cloEvaluationResult) {
      const validCLOs = this.clos.filter(c => c.statement && c.statement.trim().length > 5);
      if (validCLOs.length === 0) {
        alert('Please define at least one Course Learning Outcome (CLO) before exporting.');
        return;
      }
      await this.runCLOEvaluation();
      if (!this.cloEvaluationResult) return;
    }

    const courseName = document.getElementById('input-course-name')?.value.trim() || 'Electrical Engineering Course';
    const courseDescription = document.getElementById('input-course-desc')?.value.trim() || '';
    const coursePlan = document.getElementById('input-course-plan')?.value.trim() || this.coursePlanText || '';

    const dossier = PDFReportGenerator.generateCLOReport({
      courseName,
      courseDescription,
      coursePlan,
      clos: this.clos,
      evaluation: this.cloEvaluationResult
    });

    PDFReportGenerator.triggerPrint(dossier);
  }

  async exportAssessmentPDF() {
    if (!this.assessmentEvaluationResult) {
      const validQuestions = this.questions.filter(q => q.text && q.text.trim().length > 3);
      if (validQuestions.length === 0) {
        alert('Please provide at least one examination question before exporting.');
        return;
      }
      await this.runAssessmentEvaluation();
      if (!this.assessmentEvaluationResult) return;
    }

    const courseName = document.getElementById('input-course-name')?.value.trim() || 'EE-312 Microcontroller & Embedded Systems';

    const dossier = PDFReportGenerator.generateAssessmentReport({
      courseName,
      questions: this.questions,
      evaluation: this.assessmentEvaluationResult
    });

    PDFReportGenerator.triggerPrint(dossier);
  }

  exportStandardsPDF() {
    const dossier = PDFReportGenerator.generateStandardsReport({
      plos: PLO_LIST,
      taxonomies: TAXONOMY_LEVELS
    });
    PDFReportGenerator.triggerPrint(dossier);
  }

  exportCQIGuidePDF() {
    const dossier = PDFReportGenerator.generateCQIGuideReport();
    PDFReportGenerator.triggerPrint(dossier);
  }

  // --- Modal Helpers ---
  openApiModal() {
    document.getElementById('api-key-input').value = geminiEngine.getApiKey();
    document.getElementById('api-modal').classList.remove('hidden');
  }

  closeApiModal() {
    document.getElementById('api-modal').classList.add('hidden');
  }

  saveApiKey() {
    const key = document.getElementById('api-key-input').value.trim();
    geminiEngine.setApiKey(key);
    this.updateApiKeyStatusBadge();
    this.closeApiModal();
  }

  updateApiKeyStatusBadge() {
    const badge = document.getElementById('api-status-badge');
    if (!badge) return;

    if (geminiEngine.hasApiKey()) {
      badge.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
        <span class="text-xs font-bold text-emerald-700">Live Gemini AI Active</span>
      `;
      badge.parentElement.className = 'px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center gap-2 cursor-pointer hover:bg-emerald-100 transition-colors';
    } else {
      badge.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
        <span class="text-xs font-bold text-amber-800">Demo / Simulation Mode</span>
      `;
      badge.parentElement.className = 'px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 flex items-center gap-2 cursor-pointer hover:bg-amber-100 transition-colors';
    }
  }

  openVerbsModal() {
    const modal = document.getElementById('verbs-modal');
    if (!modal) return;

    const listContainer = document.getElementById('verbs-by-level-container');
    if (listContainer) {
      listContainer.innerHTML = TAXONOMY_LEVELS.map(tax => `
        <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl mb-3.5">
          <div class="flex items-center justify-between mb-2.5">
            <span class="font-extrabold text-slate-950 text-xs">${tax.title} (${tax.domain})</span>
            <span class="text-xs font-black text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-300">${tax.level}</span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            ${tax.verbs.map(v => `
              <button class="verb-chip btn-interactive px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 hover:border-orange-500 hover:text-orange-800 transition-colors shadow-2xs" data-verb="${v}">
                ${v}
              </button>
            `).join('')}
          </div>
        </div>
      `).join('');

      listContainer.querySelectorAll('.verb-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
          const verb = e.target.getAttribute('data-verb');
          if (this.clos.length > 0) {
            this.clos[0].statement = `${verb} ${this.clos[0].statement.replace(/^\w+\s*/, '')}`;
            this.renderCLOInputs();
          }
          this.closeVerbsModal();
        });
      });
    }

    modal.classList.remove('hidden');
  }

  closeVerbsModal() {
    document.getElementById('verbs-modal')?.classList.add('hidden');
  }

  setEvaluatingState(isEvaluating, message = 'Processing...') {
    this.isEvaluating = isEvaluating;
    const overlay = document.getElementById('evaluating-overlay');
    const msgEl = document.getElementById('evaluating-message');

    if (overlay) {
      if (isEvaluating) {
        if (msgEl) msgEl.textContent = message;
        overlay.classList.remove('hidden');
      } else {
        overlay.classList.add('hidden');
      }
    }
  }

  // ==================== AI RESILIENCE ASSESSMENT CONTROLS ====================
  bindResilienceControls() {
    // 1. Framework Presets
    const presetsMap = {
      'btn-resilience-preset-i2c': 'embedded-i2c',
      'btn-resilience-preset-smps': 'power-smps',
      'btn-resilience-preset-dsp': 'dsp-filter',
      'btn-resilience-preset-control': 'control-stability'
    };

    Object.entries(presetsMap).forEach(([btnId, presetId]) => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.loadResiliencePreset(presetId);
        });
      }
    });

    // 2. Assessment Instrument Type Segmented Selector
    document.querySelectorAll('.res-type-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const type = btn.getAttribute('data-type');
        if (type) this.setResilienceAssessmentType(type);
      });
    });

    // 3. CLO Dropdown selector
    const cloSelect = document.getElementById('resilience-clo-select');
    if (cloSelect) {
      cloSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val !== 'custom') {
          const idx = parseInt(val, 10);
          if (this.clos && this.clos[idx]) {
            const targetCLO = this.clos[idx];
            const stmtInput = document.getElementById('resilience-clo-statement');
            const ploSelect = document.getElementById('resilience-plo-select');
            const taxSelect = document.getElementById('resilience-taxonomy-select');
            if (stmtInput) stmtInput.value = targetCLO.statement;
            if (ploSelect && targetCLO.plo) ploSelect.value = targetCLO.plo;
            if (taxSelect && targetCLO.taxonomy) taxSelect.value = targetCLO.taxonomy;
          }
        }
      });
    }

    // 4. Generate Button
    const btnGenerate = document.getElementById('btn-generate-resilient-assessment');
    if (btnGenerate) {
      btnGenerate.addEventListener('click', (e) => {
        e.preventDefault();
        this.runResilienceAssessmentGeneration();
      });
    }

    // 5. PDF Export Buttons
    ['btn-export-resilience-pdf-top', 'btn-export-resilience-pdf', 'btn-export-resilience-pdf-bottom'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.exportResiliencePDF();
        });
      }
    });

    // 6. Copy Brief Button
    const btnCopy = document.getElementById('btn-copy-resilience-brief');
    if (btnCopy) {
      btnCopy.addEventListener('click', (e) => {
        e.preventDefault();
        this.copyResilienceBrief();
      });
    }
  }

  setResilienceAssessmentType(type) {
    const hiddenInput = document.getElementById('resilience-assessment-type');
    if (hiddenInput) hiddenInput.value = type;

    document.querySelectorAll('.res-type-btn').forEach(b => {
      const isTarget = b.getAttribute('data-type') === type;
      if (isTarget) {
        b.className = 'res-type-btn py-2 px-2.5 rounded-xl transition-all text-center bg-white text-purple-950 shadow-2xs border border-purple-200 font-black';
      } else {
        b.className = 'res-type-btn py-2 px-2.5 rounded-xl transition-all text-center text-slate-600 hover:text-slate-900 font-black';
      }
    });
  }

  populateResilienceCLODropdown() {
    const cloSelect = document.getElementById('resilience-clo-select');
    if (!cloSelect) return;

    const currentVal = cloSelect.value;
    cloSelect.innerHTML = '<option value="custom">-- Custom CLO Statement --</option>';

    if (Array.isArray(this.clos) && this.clos.length > 0) {
      this.clos.forEach((c, idx) => {
        const opt = document.createElement('option');
        opt.value = idx.toString();
        const shortStmt = c.statement.length > 60 ? `${c.statement.slice(0, 58)}...` : c.statement;
        opt.textContent = `CLO-${idx + 1}: ${shortStmt} [${c.plo || 'PLO-1'}, ${c.taxonomy || 'C2'}]`;
        cloSelect.appendChild(opt);
      });
    }

    if (currentVal && currentVal !== 'custom' && parseInt(currentVal, 10) < this.clos.length) {
      cloSelect.value = currentVal;
    } else {
      cloSelect.value = 'custom';
    }
  }

  loadResiliencePreset(presetId) {
    const preset = SAMPLE_RESILIENCE_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    const courseInput = document.getElementById('resilience-course-name');
    const cloStmtInput = document.getElementById('resilience-clo-statement');
    const ploSelect = document.getElementById('resilience-plo-select');
    const taxSelect = document.getElementById('resilience-taxonomy-select');
    const conceptInput = document.getElementById('resilience-concept-focus');
    const contextInput = document.getElementById('resilience-context-input');
    const cloSelect = document.getElementById('resilience-clo-select');

    if (courseInput) courseInput.value = preset.courseName;
    if (cloStmtInput) cloStmtInput.value = preset.cloStatement;
    if (ploSelect) ploSelect.value = preset.plo;
    if (taxSelect) taxSelect.value = preset.taxonomy;
    if (conceptInput) conceptInput.value = preset.conceptTopic;
    if (contextInput) contextInput.value = preset.localContext;
    if (cloSelect) cloSelect.value = 'custom';

    this.setResilienceAssessmentType(preset.assessmentType);

    // Run generation immediately for swift interactive demonstration
    this.runResilienceAssessmentGeneration();
  }

  async runResilienceAssessmentGeneration() {
    const courseName = document.getElementById('resilience-course-name')?.value?.trim() || 'EE-312 Microcontroller & Embedded Systems';
    const assessmentType = document.getElementById('resilience-assessment-type')?.value?.trim() || 'assignment';
    const cloStatement = document.getElementById('resilience-clo-statement')?.value?.trim() || '';
    const targetPLO = document.getElementById('resilience-plo-select')?.value || 'PLO-2';
    const taxonomy = document.getElementById('resilience-taxonomy-select')?.value || 'C4';
    const conceptFocus = document.getElementById('resilience-concept-focus')?.value?.trim() || '';
    const localContext = document.getElementById('resilience-context-input')?.value?.trim() || '';
    const enforceP1 = document.getElementById('resilience-check-p1')?.checked ?? true;
    const enforceP2 = document.getElementById('resilience-check-p2')?.checked ?? true;
    const enforceP3 = document.getElementById('resilience-check-p3')?.checked ?? true;

    if (!cloStatement) {
      alert('Please enter a CLO statement to be tested before generating an assessment.');
      document.getElementById('resilience-clo-statement')?.focus();
      return;
    }

    this.setEvaluatingState(true, 'Architecting AI-Resilient Assessment (P1: Process, P2: Context, P3: AI Critique)...');

    try {
      const result = await geminiEngine.generateResilientAssessment({
        courseName,
        assessmentType,
        cloStatement,
        targetPLO,
        taxonomy,
        conceptFocus,
        localContext,
        enforceP1,
        enforceP2,
        enforceP3
      });

      this.resilienceAssessmentData = result;
      this.renderResilienceResults(result);
    } catch (err) {
      console.error('Error generating AI-resilient assessment:', err);
      const fallback = geminiEngine.simulateResilientAssessment({
        courseName,
        assessmentType,
        cloStatement,
        targetPLO,
        taxonomy,
        conceptFocus,
        localContext
      }, err.message);
      this.resilienceAssessmentData = fallback;
      this.renderResilienceResults(fallback);
    } finally {
      this.setEvaluatingState(false);
    }
  }

  renderResilienceResults(data) {
    if (!data) return;

    // Toggle containers
    const emptyState = document.getElementById('resilience-empty-state');
    const resultsCard = document.getElementById('resilience-results-card');
    if (emptyState) emptyState.classList.add('hidden');
    if (resultsCard) resultsCard.classList.remove('hidden');

    const meta = data.assessmentMetadata || {};
    const vuln = data.vulnerabilityDiagnosis || data.bloomVulnerability || {};
    const pillars = data.threePillarArchitecture || {};
    const p1 = pillars.p1Process || {};
    const p2 = pillars.p2Context || {};
    const p3 = pillars.p3ConceptualDepth || {};
    const comp = data.comparisonView || {};
    const brief = data.studentFacingBrief || {};
    const rubric = data.markingRubric || [];

    // Meta Banner
    const typeBadge = document.getElementById('resilience-res-type-badge');
    if (typeBadge) typeBadge.textContent = (meta.assessmentType || 'Assignment').replace('_', ' ');

    const ploBadge = document.getElementById('resilience-res-plo-badge');
    if (ploBadge) ploBadge.textContent = `${meta.plo || 'PLO-2'} (${meta.taxonomy || 'C4'})`;

    const vulnBadge = document.getElementById('resilience-res-vuln-badge');
    if (vulnBadge) {
      vulnBadge.textContent = vuln.spectrumLevel || `${meta.taxonomy || 'C4'} Critical Pivot`;
    }

    const titleEl = document.getElementById('resilience-res-title');
    if (titleEl) {
      titleEl.textContent = brief.title || `${meta.courseName?.split(' ')[0] || 'EE'}: ${meta.conceptTopic || 'AI-Resilient Assessment'}`;
    }

    const courseEl = document.getElementById('resilience-res-course');
    if (courseEl) {
      courseEl.textContent = `${meta.courseName || 'Course'} • ${meta.frameworkReference || 'AI-Resilient Learning Initiative (AI-RLI)'}`;
    }

    const cloStmtEl = document.getElementById('resilience-res-clo-statement');
    if (cloStmtEl) cloStmtEl.textContent = meta.cloStatement || '';

    // Assessment Fracture Card
    const vulnPromptEl = document.getElementById('resilience-res-vuln-prompt');
    if (vulnPromptEl) vulnPromptEl.textContent = `"${comp.vulnerablePrompt || 'Explain the concept...'}"`;

    const fractureTextEl = document.getElementById('resilience-res-fracture-text');
    if (fractureTextEl) {
      fractureTextEl.textContent = `${vuln.assessmentFracture || ''} ${vuln.whyConventionalFails || ''}`;
    }

    // 3 Pillars
    const p1List = document.getElementById('resilience-res-p1-evidence');
    if (p1List) {
      p1List.innerHTML = (p1.requiredEvidence || []).map(e => `
        <li class="leading-relaxed font-medium text-slate-800 flex items-start gap-2 text-xs">
          <span class="text-emerald-600 font-bold">•</span>
          <span>${e}</span>
        </li>
      `).join('');
    }

    const p2Context = document.getElementById('resilience-res-p2-context');
    if (p2Context) p2Context.textContent = p2.traceableContextDetails || '';

    const p3Structure = document.getElementById('resilience-res-p3-structure');
    if (p3Structure) p3Structure.textContent = p3.loadbearingStructure || '';

    // Student Facing Brief
    const scenarioEl = document.getElementById('resilience-res-scenario');
    if (scenarioEl) scenarioEl.textContent = brief.scenario || '';

    const tasksList = document.getElementById('resilience-res-tasks');
    if (tasksList) {
      tasksList.innerHTML = (brief.tasks || []).map(t => `<li class="pl-1 font-medium text-slate-900 leading-relaxed text-xs">${t}</li>`).join('');
    }

    const delivList = document.getElementById('resilience-res-deliverables');
    if (delivList) {
      delivList.innerHTML = (brief.deliverables || []).map(d => `<li class="pl-1 font-semibold text-slate-900 leading-relaxed text-xs">${d}</li>`).join('');
    }

    // AI Critique Protocol
    const aiPromptEl = document.getElementById('resilience-res-ai-prompt');
    if (aiPromptEl) aiPromptEl.textContent = `"${p3.aiCritiquePrompt || ''}"`;

    const aiCritiqueEl = document.getElementById('resilience-res-ai-critique');
    if (aiCritiqueEl) aiCritiqueEl.textContent = p3.expectedStudentCritique || '';

    // Rubric Table
    const rubricTbody = document.getElementById('resilience-res-rubric-tbody');
    if (rubricTbody) {
      rubricTbody.innerHTML = rubric.map(r => `
        <tr class="hover:bg-slate-50/80 transition-colors">
          <td class="p-3.5 font-bold text-slate-950 text-xs">${r.criteria}</td>
          <td class="p-3.5 text-center font-black text-purple-900 bg-purple-50/70 text-xs">${r.marks}</td>
          <td class="p-3.5 text-slate-800 leading-relaxed text-xs font-medium">${r.descriptor}</td>
        </tr>
      `).join('');
    }

    // Moderation Note
    const modNoteEl = document.getElementById('resilience-res-moderation-notes');
    if (modNoteEl) modNoteEl.textContent = data.moderationNotes || 'Fulfills Washington Accord WP1-WP7 criteria for engineering education.';

    // Scroll smoothly to results card
    resultsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  copyResilienceBrief() {
    if (!this.resilienceAssessmentData) return;
    const brief = this.resilienceAssessmentData.studentFacingBrief || {};
    const meta = this.resilienceAssessmentData.assessmentMetadata || {};
    const pillars = this.resilienceAssessmentData.threePillarArchitecture || {};
    const p3 = pillars.p3ConceptualDepth || {};

    const text = `===============================================================
${brief.title || 'AI-RESILIENT ASSESSMENT'}
Course: ${meta.courseName || ''}
Target CLO: ${meta.cloStatement || ''}
Mapped PLO: ${meta.plo || ''} (${meta.taxonomy || ''})
Framework: AI-Resilient Learning Initiative (AI-RLI, Spring 2026)
===============================================================

ENGINEERING SCENARIO:
${brief.scenario || ''}

ASSIGNED TASKS:
${(brief.tasks || []).map((t, i) => `${i + 1}. ${t}`).join('\n')}

REQUIRED STUDENT DELIVERABLES & TRACEABLE EVIDENCE:
${(brief.deliverables || []).map(d => `• ${d}`).join('\n')}

MANDATORY AI CRITIQUE INSTRUCTION:
Execute the following prompt in ChatGPT/Claude/Gemini:
"${p3.aiCritiquePrompt || ''}"

Required Student Critique:
${p3.expectedStudentCritique || ''}
===============================================================`;

    navigator.clipboard.writeText(text).then(() => {
      const label = document.getElementById('copy-brief-label');
      if (label) {
        const original = label.textContent;
        label.textContent = 'Copied to Clipboard!';
        setTimeout(() => {
          label.textContent = original;
        }, 2500);
      }
    }).catch(err => {
      console.warn('Clipboard write failed:', err);
    });
  }

  exportResiliencePDF() {
    if (!this.resilienceAssessmentData) {
      alert('Please configure and generate an AI-resilient assessment first before exporting the PDF dossier.');
      return;
    }

    const meta = this.resilienceAssessmentData.assessmentMetadata || {};
    const reportElement = PDFReportGenerator.generateResilienceReport({
      assessmentData: this.resilienceAssessmentData,
      courseName: meta.courseName,
      clo: { statement: meta.cloStatement, plo: meta.plo, taxonomy: meta.taxonomy },
      plo: meta.plo,
      taxonomy: meta.taxonomy
    });

    PDFReportGenerator.triggerPrint(reportElement);
  }

  registerPWA() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./public/sw.js')
        .then(reg => console.log('PWA Service Worker registered:', reg.scope))
        .catch(err => console.log('Service Worker registration skipped:', err));
    }
  }
}

function initializeOBEApp() {
  if (!window.obeApp) {
    window.obeApp = new OBEApp();
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initializeOBEApp);
} else {
  initializeOBEApp();
}
