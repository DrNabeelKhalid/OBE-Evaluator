/**
 * OBE CLO Evaluator EED — Demo Video Engine & In-Browser Screen Recorder
 * Conceptualized, Architected & Implemented by Engr. Dr. Nabeel Khalid
 * Department of Electrical Engineering • Faculty of Engineering
 */

export class DemoVideoStudio {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.modal = null;
    this.isPlaying = false;
    this.isRecording = false;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    
    this.currentSceneIndex = 0;
    this.sceneTime = 0; // in seconds within current scene
    this.totalTime = 0; // in seconds
    this.animationFrameId = null;
    this.lastFrameTimestamp = 0;

    // Load Institutional Logo
    this.foeLogo = new Image();
    this.foeLogo.src = './public/assets/FOE_Logo_WBG.png';
    this.logoLoaded = false;
    this.foeLogo.onload = () => { this.logoLoaded = true; };

    // Define the 7 Choreographed Storyboard Scenes
    this.scenes = [
      {
        id: 'intro',
        title: 'Institutional Intro & Architecture',
        duration: 14,
        tabName: 'overview',
        subtitle: 'Welcome to OBE CLO Evaluator EED. System Architecture & Implementation by Engr. Dr. Nabeel Khalid.',
        tagline: 'Washington Accord & PEC Standards Compliance Platform',
        draw: (ctx, t, progress) => this.drawSceneIntro(ctx, t, progress)
      },
      {
        id: 'clo-eval',
        title: 'CLO Quality & Topical Breadth Evaluator',
        duration: 18,
        tabName: 'clo-evaluator',
        subtitle: 'Automated auditing of drafted CLOs against SMART criteria, passive verbs, and semester topic pacing.',
        tagline: 'Dual Quality Evaluation: CLO Set Quality (8.5/10) & Topical Breadth (8.2/10)',
        draw: (ctx, t, progress) => this.drawSceneCLOQuality(ctx, t, progress)
      },
      {
        id: 'assessment',
        title: 'Assessment Alignment & Cognitive Audit',
        duration: 16,
        tabName: 'assessment-audit',
        subtitle: 'Detecting cognitive deflation and mismatch between examination questions and target Bloom taxonomy.',
        tagline: 'Exam Cognitive Depth Verification & Instant Upgrade Recommendations',
        draw: (ctx, t, progress) => this.drawSceneAssessmentAudit(ctx, t, progress)
      },
      {
        id: 'curriculum',
        title: 'AI CLO & Modular Syllabus Suggester',
        duration: 18,
        tabName: 'clo-generator',
        subtitle: 'Theory & Laboratory stream generator with automated contact hour calculation and PLO constructive alignment.',
        tagline: '16-Week Laboratory Practical Plan with Apparatus Specs & Mapping Matrix',
        draw: (ctx, t, progress) => this.drawSceneCurriculum(ctx, t, progress)
      },
      {
        id: 'ai-resilience',
        title: 'AI-Resilient Assessment Studio (AI-RLI)',
        duration: 22,
        tabName: 'ai-resilience',
        subtitle: 'Grounded in AI-RLI Framework (Spring 2026): Formulating coursework resilient against generative AI surrogacy.',
        tagline: '3 Pillars: P1 Process > Product • P2 Local Realities • P3 AI Critique Protocol',
        draw: (ctx, t, progress) => this.drawSceneAIResilience(ctx, t, progress)
      },
      {
        id: 'standards',
        title: 'PEC Standards Hub & CQI Course Folder',
        duration: 16,
        tabName: 'standards-hub',
        subtitle: '11 PEC Graduate Attributes, Bloom revised verbs lookup, and mandatory Course Review Folder (CRF) checklist.',
        tagline: 'Closing the Loop: Comprehensive CQI Accreditation Documentation',
        draw: (ctx, t, progress) => this.drawSceneStandardsAndCQI(ctx, t, progress)
      },
      {
        id: 'pdf-export',
        title: 'Accreditation Vector PDF Dossiers',
        duration: 16,
        tabName: 'overview',
        subtitle: 'Instant generation of official, publication-grade vector PDF reports with tracking numbers and sign-off blocks.',
        tagline: 'Institutional Accreditation Ready • Implemented by Engr. Dr. Nabeel Khalid',
        draw: (ctx, t, progress) => this.drawScenePDFExport(ctx, t, progress)
      }
    ];

    this.totalDuration = this.scenes.reduce((acc, s) => acc + s.duration, 0);
  }

  init() {
    this.modal = document.getElementById('demo-video-modal');
    this.canvas = document.getElementById('demo-video-canvas');
    if (!this.canvas || !this.modal) return;

    this.ctx = this.canvas.getContext('2d');
    this.bindEvents();
    this.renderSceneControls();
    this.renderInitialFrame();
  }

  bindEvents() {
    // Open Video Modal triggers
    document.querySelectorAll('.btn-open-demo-video').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openModal();
      });
    });

    // Close Modal
    document.getElementById('btn-close-demo-video')?.addEventListener('click', () => {
      this.closeModal();
    });

    // Play / Pause
    document.getElementById('btn-video-play-pause')?.addEventListener('click', () => {
      this.togglePlay();
    });

    // Restart / Replay
    document.getElementById('btn-video-replay')?.addEventListener('click', () => {
      this.resetVideo();
      this.play();
    });

    // Scrubber
    const scrubber = document.getElementById('video-timeline-scrubber');
    if (scrubber) {
      scrubber.addEventListener('input', (e) => {
        const targetPercent = parseFloat(e.target.value) / 100;
        this.seekTo(targetPercent * this.totalDuration);
      });
    }

    // Record & Download Video Button
    document.getElementById('btn-record-demo-video')?.addEventListener('click', () => {
      this.startVideoRecording();
    });

    // Fullscreen toggle
    document.getElementById('btn-video-fullscreen')?.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        this.canvas.requestFullscreen?.().catch(err => console.warn(err));
      } else {
        document.exitFullscreen?.();
      }
    });
  }

  openModal() {
    this.modal.classList.remove('hidden');
    this.resetVideo();
    this.play();
  }

  closeModal() {
    this.pause();
    if (this.isRecording) {
      this.stopVideoRecording();
    }
    this.modal.classList.add('hidden');
  }

  resetVideo() {
    this.currentSceneIndex = 0;
    this.sceneTime = 0;
    this.totalTime = 0;
    this.updateControlsUI();
  }

  seekTo(seconds) {
    let accumulated = 0;
    for (let i = 0; i < this.scenes.length; i++) {
      const s = this.scenes[i];
      if (accumulated + s.duration >= seconds || i === this.scenes.length - 1) {
        this.currentSceneIndex = i;
        this.sceneTime = Math.max(0, seconds - accumulated);
        this.totalTime = seconds;
        break;
      }
      accumulated += s.duration;
    }
    this.drawCurrentFrame();
    this.updateControlsUI();
  }

  jumpToScene(index) {
    let accumulated = 0;
    for (let i = 0; i < index; i++) {
      accumulated += this.scenes[i].duration;
    }
    this.currentSceneIndex = index;
    this.sceneTime = 0;
    this.totalTime = accumulated;
    this.drawCurrentFrame();
    this.updateControlsUI();
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.lastFrameTimestamp = performance.now();
    this.updatePlayButtonUI(true);
    this.loop();
  }

  pause() {
    this.isPlaying = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.updatePlayButtonUI(false);
  }

  loop() {
    if (!this.isPlaying) return;

    const now = performance.now();
    const dt = (now - this.lastFrameTimestamp) / 1000;
    this.lastFrameTimestamp = now;

    // Advance time
    this.sceneTime += dt;
    this.totalTime += dt;

    const currentScene = this.scenes[this.currentSceneIndex];
    if (this.sceneTime >= currentScene.duration) {
      if (this.currentSceneIndex < this.scenes.length - 1) {
        this.currentSceneIndex++;
        this.sceneTime = 0;
      } else {
        // End of video reached
        this.pause();
        if (this.isRecording) {
          this.stopVideoRecording();
        }
        this.updateControlsUI();
        return;
      }
    }

    this.drawCurrentFrame();
    this.updateControlsUI();

    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  renderInitialFrame() {
    this.drawCurrentFrame();
    this.updateControlsUI();
  }

  drawCurrentFrame() {
    if (!this.ctx || !this.canvas) return;
    const scene = this.scenes[this.currentSceneIndex];
    const progress = Math.min(1, Math.max(0, this.sceneTime / scene.duration));

    // Clear Screen with 2026 Dark Slate Studio Canvas Background
    this.ctx.fillStyle = '#090D1A';
    this.ctx.fillRect(0, 0, 1920, 1080);

    // Call individual scene drawer
    scene.draw(this.ctx, this.sceneTime, progress);

    // Draw Universal HUD & Subtitle Bar
    this.drawHUD(this.ctx, scene, progress);
  }

  // ==================== UNIVERSAL HUD & CAPTIONS ====================
  drawHUD(ctx, scene, progress) {
    // 1. Top Header Bar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, 0, 1920, 90);
    ctx.strokeStyle = 'rgba(242, 125, 38, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 90);
    ctx.lineTo(1920, 90);
    ctx.stroke();

    // Institutional Logo or Seal
    if (this.logoLoaded) {
      ctx.drawImage(this.foeLogo, 40, 20, 160, 52);
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('FACULTY OF ENGINEERING', 40, 52);
    }

    // Header Title & Version
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 26px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('OBE CLO Evaluator EED — Version 3.0', 230, 54);

    // System Credit Badge in Top Bar
    ctx.fillStyle = '#FFF7ED';
    this.roundRect(ctx, 880, 24, 600, 44, 22, true, false);
    ctx.strokeStyle = '#FDBA74';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, 880, 24, 600, 44, 22, false, true);

    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.arc(905, 46, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#431407';
    ctx.font = '700 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('System Architect & Lead Developer: ', 925, 52);
    ctx.fillStyle = '#EA580C';
    ctx.font = '900 17px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Engr. Dr. Nabeel Khalid', 1230, 52);

    // Scene Badge on Right
    ctx.fillStyle = '#F27D26';
    this.roundRect(ctx, 1680, 24, 200, 44, 22, true, false);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 16px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`SCENE ${this.currentSceneIndex + 1} OF ${this.scenes.length}`, 1780, 52);
    ctx.textAlign = 'left';

    // 2. Bottom Captions / Subtitle Bar
    ctx.fillStyle = 'rgba(9, 13, 26, 0.94)';
    ctx.fillRect(0, 960, 1920, 120);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 960);
    ctx.lineTo(1920, 960);
    ctx.stroke();

    // Scene Subtitle text
    ctx.fillStyle = '#F8FAFC';
    ctx.font = '600 24px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`"${scene.subtitle}"`, 960, 1010);

    // Tagline in gold
    ctx.fillStyle = '#FDBA74';
    ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(scene.tagline, 960, 1045);
    ctx.textAlign = 'left';

    // Progress bar across the bottom
    const totalProgress = Math.min(1, this.totalTime / this.totalDuration);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(0, 1072, 1920, 8);
    ctx.fillStyle = '#F27D26';
    ctx.fillRect(0, 1072, 1920 * totalProgress, 8);
  }

  // ==================== SCENE DRAWERS ====================

  // Scene 1: Welcome & System Architecture
  drawSceneIntro(ctx, t, p) {
    // Ambient Background Mesh
    const grad = ctx.createRadialGradient(960, 500, 50, 960, 500, 900);
    grad.addColorStop(0, '#1E293B');
    grad.addColorStop(0.6, '#0F172A');
    grad.addColorStop(1, '#090D1A');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 90, 1920, 870);

    // Center Stage Container
    ctx.fillStyle = '#FFFFFF';
    this.roundRect(ctx, 260, 150, 1400, 750, 36, true, false);
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    this.roundRect(ctx, 260, 150, 1400, 750, 36, false, true);

    // Accreditation Standards Badge
    ctx.fillStyle = '#FFF7ED';
    this.roundRect(ctx, 620, 200, 680, 48, 24, true, false);
    ctx.strokeStyle = '#FDBA74';
    this.roundRect(ctx, 620, 200, 680, 48, 24, false, true);

    ctx.fillStyle = '#C2410C';
    ctx.font = '900 18px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAKISTAN ENGINEERING COUNCIL (PEC) • WASHINGTON ACCORD (IEA v4.0)', 960, 232);

    // Main Title
    ctx.fillStyle = '#090D1A';
    ctx.font = '900 48px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('OBE CLO Quality Evaluator & Assessment Studio', 960, 320);

    ctx.fillStyle = '#475569';
    ctx.font = '500 24px "Inter", sans-serif';
    ctx.fillText('Automated Outcome Quality Assurance, Cognitive Alignment & Generative AI Resilience', 960, 370);

    // Dedicated Credit Card for Engr. Dr. Nabeel Khalid
    ctx.fillStyle = '#F8FAFC';
    this.roundRect(ctx, 430, 420, 1060, 110, 24, true, false);
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, 430, 420, 1060, 110, 24, false, true);

    ctx.fillStyle = '#F27D26';
    ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('SYSTEM ARCHITECT & LEAD DEVELOPER', 960, 460);

    ctx.fillStyle = '#090D1A';
    ctx.font = '900 32px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Engr. Dr. Nabeel Khalid', 960, 500);

    // 5 Engineering Pillar Metric Cards
    const metrics = [
      { title: '11 PEC PLOs', sub: 'Washington Accord v4.0', color: '#EA580C' },
      { title: "6 Bloom's Levels", sub: 'Cognitive, Affective, Psycho', color: '#2563EB' },
      { title: 'Dual QA Scores', sub: 'CLO & Topical Breadth', color: '#059669' },
      { title: 'AI-RLI Studio', sub: '3-Pillar Assessment Defense', color: '#7C3AED' },
      { title: '9 Vector PDFs', sub: 'Official Dossier Exports', color: '#0F172A' }
    ];

    const cardWidth = 240;
    const gap = 25;
    const startX = 310;
    metrics.forEach((m, idx) => {
      const x = startX + idx * (cardWidth + gap);
      const y = 580;

      // Animate card entrance based on time
      const cardAlpha = Math.min(1, Math.max(0, (t - idx * 0.4) * 2));
      ctx.globalAlpha = cardAlpha;

      ctx.fillStyle = '#FFFFFF';
      this.roundRect(ctx, x, y, cardWidth, 160, 20, true, false);
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1.5;
      this.roundRect(ctx, x, y, cardWidth, 160, 20, false, true);

      // Top color indicator bar
      ctx.fillStyle = m.color;
      this.roundRect(ctx, x, y, cardWidth, 8, 4, true, false);

      ctx.fillStyle = m.color;
      ctx.font = '900 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(m.title, x + cardWidth / 2, y + 65);

      ctx.fillStyle = '#475569';
      ctx.font = '600 15px "Inter", sans-serif';
      ctx.fillText(m.sub, x + cardWidth / 2, y + 105);

      ctx.globalAlpha = 1.0;
    });

    // Simulated Animated Cursor
    if (t > 7) {
      const cursorX = 960 + Math.sin(t * 2) * 50;
      const cursorY = 820;
      this.drawCursor(ctx, cursorX, cursorY, t > 9);
    }

    ctx.textAlign = 'left';
  }

  // Scene 2: CLO Quality Evaluator & Course Plan Breadth
  drawSceneCLOQuality(ctx, t, p) {
    this.drawStudioHeaderTab(ctx, 'CLO Quality Evaluator');

    // Left Panel: Course Input Card
    ctx.fillStyle = '#FFFFFF';
    this.roundRect(ctx, 100, 160, 820, 750, 28, true, true);

    ctx.fillStyle = '#090D1A';
    ctx.font = '800 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Course Specification & Plan Input', 130, 210);

    // Preset loaded badge
    ctx.fillStyle = '#EFF6FF';
    this.roundRect(ctx, 580, 185, 310, 36, 18, true, false);
    ctx.fillStyle = '#1D4ED8';
    ctx.font = '800 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Preset: EE-312 Microcontrollers', 600, 208);

    // Course Plan outline box
    ctx.fillStyle = '#F8FAFC';
    this.roundRect(ctx, 130, 240, 760, 180, 16, true, true);
    ctx.fillStyle = '#334155';
    ctx.font = '500 16px "JetBrains Mono", monospace';
    ctx.fillText('Week 01-03: ARM Cortex-M Architecture & Bus Matrix (9 Hrs)', 150, 280);
    ctx.fillText('Week 04-06: Timers, Interrupts & PWM Motor Drive (9 Hrs)', 150, 315);
    ctx.fillText('Week 07-10: I2C, SPI & High-Speed ADC Telemetry (12 Hrs)', 150, 350);
    ctx.fillText('Week 11-16: FreeRTOS Task Scheduling & Complex Case (18 Hrs)', 150, 385);

    // Evaluated CLO Card with Passive Verb Detection
    ctx.fillStyle = '#FFFFFF';
    this.roundRect(ctx, 130, 450, 760, 250, 20, true, true);

    ctx.fillStyle = '#EA580C';
    this.roundRect(ctx, 150, 480, 80, 32, 10, true, false);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('CLO-1', 165, 502);

    // Warning Badge for passive verb
    ctx.fillStyle = '#FEF3C7';
    this.roundRect(ctx, 250, 480, 260, 32, 10, true, false);
    ctx.fillStyle = '#B45309';
    ctx.font = '800 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('⚠️ Passive Verb Warning Detected', 265, 502);

    ctx.fillStyle = '#090D1A';
    ctx.font = '600 17px "Inter", sans-serif';
    ctx.fillText('"Understand the hardware timer registers and calculate prescalers..."', 150, 550);

    // AI Rewritten Accreditation Compliant Outcome
    ctx.fillStyle = '#ECFDF5';
    this.roundRect(ctx, 150, 580, 720, 95, 14, true, false);
    ctx.strokeStyle = '#6EE7B7';
    this.roundRect(ctx, 150, 580, 720, 95, 14, false, true);

    ctx.fillStyle = '#065F46';
    ctx.font = '800 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('✓ AI Accreditation Revision (Bloom C4 / PLO-2):', 170, 610);
    ctx.fillStyle = '#064E3B';
    ctx.font = '700 16px "Inter", sans-serif';
    ctx.fillText('"Configure and evaluate 32-bit hardware timers and PWM registers to achieve', 170, 638);
    ctx.fillText('precise deterministic motor actuation under variable core clock frequencies."', 170, 660);

    // Action button
    ctx.fillStyle = '#F27D26';
    this.roundRect(ctx, 130, 730, 760, 56, 16, true, false);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 18px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Audit Course Outline & CLOs against Washington Accord WP1-WP7', 510, 765);
    ctx.textAlign = 'left';

    // Right Panel: Accreditation Results & Dual Scores
    ctx.fillStyle = '#FFFFFF';
    this.roundRect(ctx, 960, 160, 860, 750, 28, true, true);

    // Dual Score Gauges
    // Gauge 1: CLO Quality Score
    ctx.fillStyle = '#F8FAFC';
    this.roundRect(ctx, 1000, 200, 370, 180, 20, true, true);
    ctx.fillStyle = '#64748B';
    ctx.font = '800 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('CLO SET QUALITY SCORE', 1030, 240);
    ctx.fillStyle = '#059669';
    ctx.font = '900 52px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('8.5 / 10', 1030, 310);
    ctx.fillStyle = '#059669';
    ctx.font = '700 15px "Inter", sans-serif';
    ctx.fillText('✓ Meets SMART Criteria Benchmarks', 1030, 345);

    // Gauge 2: Topical Breadth Score
    ctx.fillStyle = '#F8FAFC';
    this.roundRect(ctx, 1410, 200, 370, 180, 20, true, true);
    ctx.fillStyle = '#64748B';
    ctx.font = '800 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('OUTLINE TOPICAL BREADTH', 1440, 240);
    ctx.fillStyle = '#2563EB';
    ctx.font = '900 52px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('8.2 / 10', 1440, 310);
    ctx.fillStyle = '#2563EB';
    ctx.font = '700 15px "Inter", sans-serif';
    ctx.fillText('✓ Adequate Complex Engineering Depth', 1440, 345);

    // Accreditation Status Banner
    ctx.fillStyle = '#ECFDF5';
    this.roundRect(ctx, 1000, 410, 780, 60, 16, true, false);
    ctx.strokeStyle = '#A7F3D0';
    this.roundRect(ctx, 1000, 410, 780, 60, 16, false, true);

    ctx.fillStyle = '#047857';
    ctx.font = '900 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('✓ ACCREDITATION READY • Meets Washington Accord Criteria', 1030, 448);

    // Evaluator Strengths & Recommendations
    ctx.fillStyle = '#090D1A';
    ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Key Strengths & CQI Recommendations', 1000, 510);

    const findings = [
      'Constructive Alignment: Lecture contact hours strongly align with articulated learning outcomes.',
      'Cognitive Laddering: Clear progression from C2 (Instruction Sets) to C4 (Bus Arbitration & RTOS).',
      'No Orphan Topics: All weekly modules directly substantiate at least one program attribute.',
      'Recommendation: Expand fixed-point numerical error handling in peripheral drivers.'
    ];

    findings.forEach((f, i) => {
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(1015, 555 + i * 45, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1E293B';
      ctx.font = '600 16px "Inter", sans-serif';
      ctx.fillText(f, 1035, 560 + i * 45);
    });

    // Transfer button
    ctx.fillStyle = '#090D1A';
    this.roundRect(ctx, 1000, 730, 780, 56, 16, true, false);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 18px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Transfer Verified Outcomes to Assessment Alignment Engine →', 1390, 765);
    ctx.textAlign = 'left';
  }

  // Scene 3: Assessment Alignment Audit
  drawSceneAssessmentAudit(ctx, t, p) {
    this.drawStudioHeaderTab(ctx, 'Assessment Alignment Audit');

    // Left Column: Exam Questions Breakdown
    ctx.fillStyle = '#FFFFFF';
    this.roundRect(ctx, 100, 160, 840, 750, 28, true, true);

    ctx.fillStyle = '#090D1A';
    ctx.font = '800 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Course Examination Paper Audit', 130, 210);

    const questions = [
      { num: 'Q1', marks: '10 Marks', clo: 'CLO-1 (C4)', text: 'List the differences between Harvard and Von Neumann architectures.', deflated: true },
      { num: 'Q2', marks: '15 Marks', clo: 'CLO-2 (C4)', text: 'Analyze the clock stretching waveform during multi-master I2C bus contention.', deflated: false },
      { num: 'Q3', marks: '15 Marks', clo: 'CLO-3 (C6)', text: 'Design a nested priority interrupt vector controller for motor fault protection.', deflated: false }
    ];

    questions.forEach((q, i) => {
      const y = 245 + i * 160;
      ctx.fillStyle = q.deflated ? '#FFFBEB' : '#F8FAFC';
      this.roundRect(ctx, 130, y, 780, 140, 18, true, true);
      if (q.deflated) {
        ctx.strokeStyle = '#FCD34D';
        this.roundRect(ctx, 130, y, 780, 140, 18, false, true);
      }

      ctx.fillStyle = '#090D1A';
      ctx.font = '900 20px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(q.num, 155, y + 40);

      ctx.fillStyle = '#64748B';
      ctx.font = '700 14px "Inter", sans-serif';
      ctx.fillText(`${q.marks} • Mapped to ${q.clo}`, 210, y + 38);

      if (q.deflated) {
        ctx.fillStyle = '#DC2626';
        this.roundRect(ctx, 620, y + 16, 260, 32, 10, true, false);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '800 13px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('COGNITIVE DEFLATION (C1 vs C4)', 635, y + 37);
      }

      ctx.fillStyle = '#334155';
      ctx.font = '500 16px "Inter", sans-serif';
      ctx.fillText(`"${q.text}"`, 155, y + 80);
    });

    // Right Column: Cognitive Alignment Diagnostic
    ctx.fillStyle = '#FFFFFF';
    this.roundRect(ctx, 980, 160, 840, 750, 28, true, true);

    ctx.fillStyle = '#DC2626';
    ctx.font = '900 26px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('⚠️ Cognitive Deflation Detected on Question 1', 1020, 220);

    ctx.fillStyle = '#475569';
    ctx.font = '500 17px "Inter", sans-serif';
    ctx.fillText('The mapped CLO targets Bloom Level C4 (Analyze), but the question verb', 1020, 260);
    ctx.fillText('"List" only assesses surface memory recall at Level C1 (Remember).', 1020, 290);

    // AI Cognitive Upgrade Card
    ctx.fillStyle = '#EFF6FF';
    this.roundRect(ctx, 1020, 340, 760, 220, 20, true, false);
    ctx.strokeStyle = '#93C5FD';
    this.roundRect(ctx, 1020, 340, 760, 220, 20, false, true);

    ctx.fillStyle = '#1E40AF';
    ctx.font = '900 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('💡 AI Suggested Cognitive Upgrade (Elevates to C4):', 1050, 385);

    ctx.fillStyle = '#1E3A8A';
    ctx.font = '600 18px "Inter", sans-serif';
    ctx.fillText('"Evaluate the memory throughput bottleneck when executing an FFT kernel', 1050, 430);
    ctx.fillText('on a unified Von Neumann bus architecture versus a dual-bus Harvard', 1050, 465);
    ctx.fillText('DSP structure with dedicated DMA channels."', 1050, 500);

    // Alignment Marks Summary
    ctx.fillStyle = '#059669';
    this.roundRect(ctx, 1020, 600, 760, 100, 20, true, false);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Total Marks Audited: 40 Marks • Alignment Score: 8.8 / 10', 1060, 645);
    ctx.font = '500 15px "Inter", sans-serif';
    ctx.fillText('85% of exam marks appropriately reflect higher-order cognitive competencies.', 1060, 675);
  }

  // Scene 4: AI CLO & Modular Curriculum Suggester
  drawSceneCurriculum(ctx, t, p) {
    this.drawStudioHeaderTab(ctx, 'AI CLO & Curriculum Suggester');

    // Configuration Card
    ctx.fillStyle = '#FFFFFF';
    this.roundRect(ctx, 100, 160, 1720, 220, 28, true, true);

    // Segmented Switcher: Theory vs Lab
    ctx.fillStyle = '#F1F5F9';
    this.roundRect(ctx, 140, 200, 440, 56, 18, true, false);

    ctx.fillStyle = '#FFFFFF';
    this.roundRect(ctx, 360, 204, 216, 48, 14, true, false);
    ctx.fillStyle = '#059669';
    ctx.font = '900 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('🔬 Laboratory Course', 385, 235);

    ctx.fillStyle = '#64748B';
    ctx.fillText('📖 Theory Course', 180, 235);

    // Duration Badges
    ctx.fillStyle = '#ECFDF5';
    this.roundRect(ctx, 620, 200, 360, 56, 18, true, false);
    ctx.fillStyle = '#065F46';
    ctx.font = '800 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('16 Weeks × 3 Contact Hrs/Wk', 650, 235);

    ctx.fillStyle = '#10B981';
    this.roundRect(ctx, 1010, 200, 260, 56, 18, true, false);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('48 Total Lab Hours', 1040, 235);

    // Selected PLOs Pills
    ctx.fillStyle = '#1E293B';
    ctx.font = '800 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Mapped Program Learning Outcomes: ', 140, 310);

    const plos = ['PLO-4: Investigation', 'PLO-5: Modern Tool Usage', 'PLO-9: Individual & Teamwork', 'PLO-10: Communication'];
    plos.forEach((plo, i) => {
      ctx.fillStyle = '#EFF6FF';
      this.roundRect(ctx, 500 + i * 290, 280, 270, 44, 14, true, false);
      ctx.strokeStyle = '#BFDBFE';
      this.roundRect(ctx, 500 + i * 290, 280, 270, 44, 14, false, true);

      ctx.fillStyle = '#1E40AF';
      ctx.font = '800 14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(plo, 520 + i * 290, 308);
    });

    // Generated Curriculum Matrix
    ctx.fillStyle = '#FFFFFF';
    this.roundRect(ctx, 100, 410, 1720, 500, 28, true, true);

    ctx.fillStyle = '#090D1A';
    ctx.font = '800 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Weekly Experiment-to-CLO Constructive Alignment Matrix', 140, 460);

    // Matrix Header
    ctx.fillStyle = '#F8FAFC';
    this.roundRect(ctx, 140, 490, 1640, 45, 10, true, false);
    ctx.fillStyle = '#475569';
    ctx.font = '800 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('WEEK', 160, 518);
    ctx.fillText('LABORATORY EXPERIMENT & APPARATUS', 270, 518);
    ctx.fillText('TARGET CLO', 1120, 518);
    ctx.fillText('HOURS', 1320, 518);
    ctx.fillText('DELIVERY & ASSESSMENT MODE', 1460, 518);

    const experiments = [
      { w: 'Wk 1-2', title: 'Exp 1: Hardware Timer Registers & Logic Analyzer Verification (Rigol DS1054Z)', clo: 'CLO-1 (P3)', hrs: '6 Hrs', mode: 'Hands-on Lab Bench Exam' },
      { w: 'Wk 3-5', title: 'Exp 2: Multi-Channel ADC Sensor Interfacing & SPI Telemetry Testbench', clo: 'CLO-2 (P4)', hrs: '9 Hrs', mode: 'Experimental Report & Viva' },
      { w: 'Wk 6-8', title: 'Exp 3: I2C Multi-Master Bus Contention & Clock Stretching Waveform Diagnostics', clo: 'CLO-2 (P4)', hrs: '9 Hrs', mode: 'Troubleshooting Rubric' },
      { w: 'Wk 9-12', title: 'Exp 4: FreeRTOS Deterministic Preemptive Task Scheduling on ARM Cortex', clo: 'CLO-3 (P5)', hrs: '12 Hrs', mode: 'Mini-Project Demonstration' }
    ];

    experiments.forEach((exp, i) => {
      const y = 550 + i * 65;
      ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      ctx.fillRect(140, y, 1640, 55);

      ctx.fillStyle = '#090D1A';
      ctx.font = '700 15px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(exp.w, 160, y + 35);
      ctx.fillText(exp.title, 270, y + 35);

      ctx.fillStyle = '#EA580C';
      ctx.font = '800 14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(exp.clo, 1120, y + 35);

      ctx.fillStyle = '#059669';
      ctx.font = '800 14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(exp.hrs, 1320, y + 35);

      ctx.fillStyle = '#334155';
      ctx.font = '600 14px "Inter", sans-serif';
      ctx.fillText(exp.mode, 1460, y + 35);
    });
  }

  // Scene 5: AI-Resilient Assessment Studio (AI-RLI)
  drawSceneAIResilience(ctx, t, p) {
    this.drawStudioHeaderTab(ctx, 'AI-Resilient Assessment Studio (AI-RLI)');

    // Banner: Framework Citation
    ctx.fillStyle = '#FAF5FF';
    this.roundRect(ctx, 100, 160, 1720, 70, 20, true, false);
    ctx.strokeStyle = '#D8B4FE';
    this.roundRect(ctx, 100, 160, 1720, 70, 20, false, true);

    ctx.fillStyle = '#7E22CE';
    ctx.font = '900 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('AI-RESILIENT LEARNING INITIATIVE (AI-RLI) FRAMEWORK • SPRING 2026 BENCHMARK', 130, 203);

    // Left Column: Assessment Fracture Diagnosis
    ctx.fillStyle = '#FFFFFF';
    this.roundRect(ctx, 100, 250, 840, 660, 28, true, true);

    ctx.fillStyle = '#DC2626';
    ctx.font = '900 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('⚡ Assessment Fracture Diagnosis', 130, 300);

    // Vulnerable Prompt
    ctx.fillStyle = '#FEF2F2';
    this.roundRect(ctx, 130, 330, 780, 110, 16, true, false);
    ctx.fillStyle = '#991B1B';
    ctx.font = '800 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Conventional Vulnerable Exam Question:', 150, 365);
    ctx.font = '500 16px "Inter", sans-serif';
    ctx.fillText('"Explain how I2C clock stretching operates and write a generic C routine to handle it."', 150, 400);

    ctx.fillStyle = '#B91C1C';
    ctx.font = '700 15px "Inter", sans-serif';
    ctx.fillText('🚨 AI Bypass: ChatGPT/Claude outputs clean code instantly with zero authentic student reasoning.', 130, 480);

    // Right Column: The 3 Resilience Pillars
    ctx.fillStyle = '#FFFFFF';
    this.roundRect(ctx, 980, 250, 840, 660, 28, true, true);

    ctx.fillStyle = '#7C3AED';
    ctx.font = '900 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('🛡️ The Three Non-Negotiable AI-Resilience Pillars', 1010, 300);

    const pillars = [
      {
        code: 'P1: PROCESS > PRODUCT',
        desc: 'Mandates timing sketches, oscilloscope capture screenshots, logic analyzer error logs, and an engineering decision journal detailing friction and dead ends.',
        color: '#EA580C'
      },
      {
        code: 'P2: CONTEXTUALIZATION',
        desc: 'Anchored to Departmental Bench #04: measured 2.2kΩ pull-up tolerances, 180pF bus capacitance, noisy ground loops, and dated empirical telemetry.',
        color: '#2563EB'
      },
      {
        code: 'P3: ACTIVE AI CRITIQUE PROTOCOL',
        desc: 'Students submit a mandatory interrogation prompt to ChatGPT, then critically dissect the AI response—identifying omitted bus contention and race condition hallucinations.',
        color: '#7C3AED'
      }
    ];

    pillars.forEach((p, i) => {
      const y = 340 + i * 140;
      ctx.fillStyle = '#FAF5FF';
      this.roundRect(ctx, 1010, y, 780, 120, 18, true, false);
      ctx.strokeStyle = '#E9D5FF';
      this.roundRect(ctx, 1010, y, 780, 120, 18, false, true);

      ctx.fillStyle = p.color;
      ctx.font = '900 17px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(p.code, 1035, y + 35);

      ctx.fillStyle = '#334155';
      ctx.font = '500 15px "Inter", sans-serif';
      this.wrapText(ctx, p.desc, 1035, y + 65, 730, 22);
    });

    // 100-Mark Rubric badge
    ctx.fillStyle = '#10B981';
    this.roundRect(ctx, 1010, 800, 780, 70, 18, true, false);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('✓ 100-Mark OBE Rubric Generated: P1 (25%) • P2 (25%) • P3 (50%)', 1040, 842);
  }

  // Scene 6: PEC Standards Hub & CQI Course Review Folder
  drawSceneStandardsAndCQI(ctx, t, p) {
    this.drawStudioHeaderTab(ctx, 'PEC Standards Hub & CQI Guide');

    // Left Column: 11 PEC PLOs
    ctx.fillStyle = '#FFFFFF';
    this.roundRect(ctx, 100, 160, 840, 750, 28, true, true);

    ctx.fillStyle = '#090D1A';
    ctx.font = '800 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Pakistan Engineering Council (PEC 11 PLOs)', 130, 210);

    const plosList = [
      { id: 'PLO-1', title: 'Engineering Knowledge', tag: 'WA1' },
      { id: 'PLO-2', title: 'Problem Analysis (Complex Problems)', tag: 'WA2' },
      { id: 'PLO-3', title: 'Design/Development of Solutions', tag: 'WA3' },
      { id: 'PLO-4', title: 'Investigation & Research Methods', tag: 'WA4' },
      { id: 'PLO-5', title: 'Modern Tool Usage', tag: 'WA5' }
    ];

    plosList.forEach((plo, i) => {
      const y = 240 + i * 95;
      ctx.fillStyle = '#F8FAFC';
      this.roundRect(ctx, 130, y, 780, 80, 16, true, true);

      ctx.fillStyle = '#EA580C';
      ctx.font = '900 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(plo.id, 155, y + 45);

      ctx.fillStyle = '#090D1A';
      ctx.font = '700 17px "Inter", sans-serif';
      ctx.fillText(plo.title, 260, y + 45);

      ctx.fillStyle = '#EFF6FF';
      this.roundRect(ctx, 770, y + 25, 110, 32, 10, true, false);
      ctx.fillStyle = '#1D4ED8';
      ctx.font = '800 13px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(plo.tag, 810, y + 46);
    });

    // Right Column: Course Review Folder (CRF) Checklist
    ctx.fillStyle = '#FFFFFF';
    this.roundRect(ctx, 980, 160, 840, 750, 28, true, true);

    ctx.fillStyle = '#090D1A';
    ctx.font = '800 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Mandatory Course Review Folder (CRF) Checklist', 1010, 210);

    const crfItems = [
      'Approved Course Syllabus & CLO-PLO Mapping Matrix',
      'Weekly Lecture & Laboratory Delivery Logbook',
      'Continuous Assessment Instruments with Bloom Markings',
      'Sample Student Work (Top, Average, Bottom Samples)',
      'Closing the Loop (CQI) Direct Attainment Analysis Report'
    ];

    crfItems.forEach((item, i) => {
      const y = 250 + i * 85;
      ctx.fillStyle = '#F8FAFC';
      this.roundRect(ctx, 1010, y, 780, 70, 16, true, true);

      ctx.fillStyle = '#059669';
      this.roundRect(ctx, 1030, y + 18, 34, 34, 10, true, false);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 18px "Inter", sans-serif';
      ctx.fillText('✓', 1040, y + 42);

      ctx.fillStyle = '#1E293B';
      ctx.font = '600 16px "Inter", sans-serif';
      ctx.fillText(item, 1085, y + 42);
    });

    // Accreditation compliance badge
    ctx.fillStyle = '#0F172A';
    this.roundRect(ctx, 1010, 710, 780, 90, 20, true, false);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('PEC Manual of Accreditation 2019 — Clause 3.2 Audit Approved', 1040, 755);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '500 14px "Inter", sans-serif';
    ctx.fillText('Guarantees seamless inspection by visiting Washington Accord evaluation panels.', 1040, 782);
  }

  // Scene 7: Official Vector PDF Dossiers & Sign-Off Block
  drawScenePDFExport(ctx, t, p) {
    this.drawStudioHeaderTab(ctx, 'Official Vector PDF Dossier Generation');

    // Central Document Preview (mimics the printed A4 PDF Report)
    const docX = 460;
    const docY = 160;
    const docW = 1000;
    const docH = 750;

    ctx.fillStyle = '#FFFFFF';
    this.roundRect(ctx, docX, docY, docW, docH, 20, true, false);
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2;
    this.roundRect(ctx, docX, docY, docW, docH, 20, false, true);

    // Official Header on PDF Document
    if (this.logoLoaded) {
      ctx.drawImage(this.foeLogo, docX + 40, docY + 35, 140, 46);
    }
    ctx.fillStyle = '#0F172A';
    ctx.font = '900 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('FACULTY OF ENGINEERING', docX + 200, docY + 55);
    ctx.fillStyle = '#F27D26';
    ctx.font = '800 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('DEPARTMENT OF ELECTRICAL ENGINEERING', docX + 200, docY + 75);

    // Tracking Ref
    ctx.fillStyle = '#64748B';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('Ref: PEC-EED-2026-QA8921', docX + docW - 40, docY + 55);
    ctx.fillText('Date: September 2026', docX + docW - 40, docY + 75);
    ctx.textAlign = 'left';

    // Horizontal Rule
    ctx.strokeStyle = '#EA580C';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(docX + 40, docY + 100);
    ctx.lineTo(docX + docW - 40, docY + 100);
    ctx.stroke();

    // Dossier Title
    ctx.fillStyle = '#090D1A';
    ctx.font = '900 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('COURSE ACCREDITATION AUDIT & CQI DOSSIER', docX + 40, docY + 140);

    // Table Mockup inside PDF
    ctx.fillStyle = '#F8FAFC';
    this.roundRect(ctx, docX + 40, docY + 170, docW - 80, 240, 12, true, true);

    ctx.fillStyle = '#0F172A';
    ctx.font = '800 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Course: EE-312 Microcontroller & Embedded Systems (16 Weeks, 48 Contact Hours)', docX + 60, docY + 205);
    ctx.fillText('Overall Compliance Verdict: ACCREDITED (Level-II Washington Accord)', docX + 60, docY + 240);
    ctx.fillText('CLO Set Quality Score: 8.5 / 10 • Topical Syllabus Breadth: 8.2 / 10', docX + 60, docY + 275);
    ctx.fillText('AI-Resilient Learning Framework: AI-RLI Compliant with 3-Pillar Defense', docX + 60, docY + 310);
    ctx.fillText('Closing the Loop: Action Item Matrix Approved for Continuous Quality Improvement', docX + 60, docY + 345);

    // Sign-Off Signature Blocks
    const signY = docY + 470;
    const signW = 260;
    const signGap = 50;
    const signStartX = docX + 60;

    const signers = ['Course Instructor', 'OBE Coordinator (EED)', 'Head of Department (EED)'];
    signers.forEach((s, idx) => {
      const sx = signStartX + idx * (signW + signGap);
      ctx.strokeStyle = '#94A3B8';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(sx, signY + 40);
      ctx.lineTo(sx + signW, signY + 40);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#0F172A';
      ctx.font = '800 14px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(s, sx + signW / 2, signY + 65);
      ctx.textAlign = 'left';
    });

    // Formal Attribution Footer on the Document
    ctx.fillStyle = '#475569';
    ctx.font = '700 13px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('OBE CLO Evaluator EED Platform • System Architecture & Implementation: Engr. Dr. Nabeel Khalid', docX + docW / 2, docY + docH - 45);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '500 11px "Inter", sans-serif';
    ctx.fillText('Department of Electrical Engineering • Faculty of Engineering • © 2026 All Rights Reserved', docX + docW / 2, docY + docH - 25);
    ctx.textAlign = 'left';
  }

  // Draw Tab Navigation Bar simulation at the top of the scene
  drawStudioHeaderTab(ctx, activeTitle) {
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 90, 1920, 60);

    ctx.fillStyle = '#38BDF8';
    ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`⚡ ACTIVE MODULE: ${activeTitle.toUpperCase()}`, 100, 128);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '600 15px "Inter", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Pakistan Engineering Council (PEC) • Washington Accord Compliant', 1820, 128);
    ctx.textAlign = 'left';
  }

  // Draw simulated mouse cursor
  drawCursor(ctx, x, y, isClicking = false) {
    ctx.save();
    ctx.translate(x, y);

    if (isClicking) {
      // Ripple ring on click
      ctx.strokeStyle = 'rgba(242, 125, 38, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Pointer arrow
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#090D1A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 24);
    ctx.lineTo(6, 18);
    ctx.lineTo(14, 26);
    ctx.lineTo(18, 22);
    ctx.lineTo(10, 14);
    ctx.lineTo(18, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // ==================== IN-BROWSER VIDEO RECORDER ====================
  startVideoRecording() {
    if (this.isRecording) return;
    if (!this.canvas.captureStream) {
      alert('Your browser does not support canvas video recording.');
      return;
    }

    try {
      const stream = this.canvas.captureStream(30);
      
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }

      this.mediaRecorder = new MediaRecorder(stream, { mimeType });
      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'OBE_CLO_Evaluator_Demo_Dr_Nabeel_Khalid.webm';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 100);

        this.setRecordingUI(false);
        alert('Demo video recorded and downloaded successfully: OBE_CLO_Evaluator_Demo_Dr_Nabeel_Khalid.webm');
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.setRecordingUI(true);

      // Reset to beginning and play through all scenes
      this.resetVideo();
      this.play();
    } catch (err) {
      console.error('Error starting video recording:', err);
      alert(`Video Recording Error: ${err.message}`);
    }
  }

  stopVideoRecording() {
    if (!this.isRecording) return;
    this.isRecording = false;
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  setRecordingUI(isRec) {
    const btn = document.getElementById('btn-record-demo-video');
    const badge = document.getElementById('video-recording-badge');
    if (btn) {
      btn.innerHTML = isRec 
        ? '<span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping mr-2"></span>Recording HD Video...'
        : '<svg class="w-4 h-4 text-orange-400 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"></path></svg>Record &amp; Download Video (.webm)';
      btn.className = isRec 
        ? 'px-4 py-2 rounded-xl text-xs font-black bg-rose-600 text-white flex items-center shadow-md animate-pulse'
        : 'btn-interactive px-4 py-2 rounded-xl text-xs font-black bg-slate-900 text-white hover:bg-slate-800 flex items-center shadow-md';
    }
    if (badge) {
      badge.classList.toggle('hidden', !isRec);
    }
  }

  // ==================== CONTROLS & TIMELINE UI ====================
  updateControlsUI() {
    // Update Timeline Scrubber
    const scrubber = document.getElementById('video-timeline-scrubber');
    if (scrubber) {
      scrubber.value = (this.totalTime / this.totalDuration) * 100;
    }

    // Time label
    const timeDisplay = document.getElementById('video-time-display');
    if (timeDisplay) {
      const cur = this.formatTime(this.totalTime);
      const tot = this.formatTime(this.totalDuration);
      timeDisplay.textContent = `${cur} / ${tot}`;
    }

    // Highlight active scene button
    document.querySelectorAll('.video-scene-btn').forEach((b, idx) => {
      if (idx === this.currentSceneIndex) {
        b.className = 'video-scene-btn px-3 py-1.5 rounded-lg text-xs font-black bg-orange-500 text-white shadow-xs';
      } else {
        b.className = 'video-scene-btn px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white bg-slate-800';
      }
    });
  }

  updatePlayButtonUI(isPlaying) {
    const btn = document.getElementById('btn-video-play-pause');
    if (!btn) return;
    btn.innerHTML = isPlaying
      ? '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>'
      : '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg>';
  }

  renderSceneControls() {
    const container = document.getElementById('video-scene-pills-container');
    if (!container) return;

    container.innerHTML = this.scenes.map((s, idx) => `
      <button class="video-scene-btn px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white bg-slate-800 transition-all whitespace-nowrap" data-index="${idx}">
        ${idx + 1}. ${s.title}
      </button>
    `).join('');

    container.querySelectorAll('.video-scene-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        this.jumpToScene(idx);
      });
    });
  }

  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // Utility: Rounded Rect
  roundRect(ctx, x, y, width, height, radius = 10, fill = true, stroke = false) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  // Utility: Text Wrapping
  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  }
}

// Instantiate and expose globally
window.demoVideoStudio = new DemoVideoStudio();
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => window.demoVideoStudio.init());
} else {
  window.demoVideoStudio.init();
}
