// OBE-ICAS Constants & Standards (Outcome Integrity & Cognitive Alignment Suite)
// Conceptualized & Implemented by Engr. Dr. Nabeel Khalid
// Compliant with Pakistan Engineering Council (PEC) 11 PLO Framework & Washington Accord

export const PLO_LIST = [
  { id: 'PLO-1', code: 'PLO-1', title: 'Engineering Knowledge', description: 'Apply knowledge of mathematics, natural science, engineering fundamentals, and engineering specialization to the solution of complex engineering problems.' },
  { id: 'PLO-2', code: 'PLO-2', title: 'Problem Analysis', description: 'Identify, formulate, research literature, and analyze complex engineering problems reaching substantiated conclusions.' },
  { id: 'PLO-3', code: 'PLO-3', title: 'Design/Development of Solutions', description: 'Design solutions for complex engineering problems and design systems, components, or processes that meet specified needs with appropriate consideration for public health, safety, cultural, societal, and environmental considerations.' },
  { id: 'PLO-4', code: 'PLO-4', title: 'Investigation', description: 'Conduct investigation of complex engineering problems using research-based knowledge and research methods including design of experiments, analysis, and interpretation of data.' },
  { id: 'PLO-5', code: 'PLO-5', title: 'Modern Tool Usage', description: 'Create, select, and apply appropriate techniques, resources, and modern engineering and IT tools, including prediction and modeling to complex engineering problems.' },
  { id: 'PLO-6', code: 'PLO-6', title: 'The Engineer and the World', description: 'Analyze and evaluate sustainable development impacts to society, the economy, sustainability, health, safety, legal frameworks, and the environment.' },
  { id: 'PLO-7', code: 'PLO-7', title: 'Ethics', description: 'Apply ethical principles and commit to professional ethics, responsibilities, and norms of engineering practice.' },
  { id: 'PLO-8', code: 'PLO-8', title: 'Individual and Collaborative Teamwork', description: 'Function effectively as an individual, and as a member or leader in diverse and inclusive teams and multi-disciplinary settings.' },
  { id: 'PLO-9', code: 'PLO-9', title: 'Communication', description: 'Communicate effectively on complex engineering activities with the engineering community and society at large, including comprehension, effective reports, design documentation, and presentations.' },
  { id: 'PLO-10', code: 'PLO-10', title: 'Project Management and Finance', description: 'Demonstrate knowledge and understanding of engineering management principles and economic decision-making and apply these to one’s own work, as a member or leader in a team.' },
  { id: 'PLO-11', code: 'PLO-11', title: 'Lifelong Learning', description: 'Recognize the need for, and have the preparation and ability to engage in independent and lifelong learning, adaptability to new technologies, and critical thinking.' }
];

export const TAXONOMY_LEVELS = [
  // Cognitive Domain (Bloom's Revised)
  { domain: 'Cognitive', level: 'C1', title: 'C1 - Remembering', verbs: ['Define', 'Describe', 'Identify', 'List', 'Name', 'Recall', 'Recognize', 'State'] },
  { domain: 'Cognitive', level: 'C2', title: 'C2 - Understanding', verbs: ['Classify', 'Discuss', 'Explain', 'Express', 'Illustrate', 'Interpret', 'Paraphrase', 'Summarize'] },
  { domain: 'Cognitive', level: 'C3', title: 'C3 - Applying', verbs: ['Apply', 'Calculate', 'Demonstrate', 'Examine', 'Implement', 'Operate', 'Solve', 'Use'] },
  { domain: 'Cognitive', level: 'C4', title: 'C4 - Analyzing', verbs: ['Analyze', 'Compare', 'Contrast', 'Differentiate', 'Distinguish', 'Investigate', 'Test'] },
  { domain: 'Cognitive', level: 'C5', title: 'C5 - Evaluating', verbs: ['Appraise', 'Assess', 'Critique', 'Defend', 'Evaluate', 'Judge', 'Justify', 'Validate'] },
  { domain: 'Cognitive', level: 'C6', title: 'C6 - Creating', verbs: ['Construct', 'Design', 'Develop', 'Devise', 'Formulate', 'Integrate', 'Plan', 'Synthesize'] },
  
  // Affective Domain
  { domain: 'Affective', level: 'A1', title: 'A1 - Receiving', verbs: ['Acknowledge', 'Follow', 'Listen', 'Notice'] },
  { domain: 'Affective', level: 'A2', title: 'A2 - Responding', verbs: ['Conform', 'Discuss', 'Participate', 'Perform', 'Present'] },
  { domain: 'Affective', level: 'A3', title: 'A3 - Valuing', verbs: ['Adopt', 'Appreciate', 'Commit', 'Demonstrate', 'Respect'] },
  { domain: 'Affective', level: 'A4', title: 'A4 - Organization', verbs: ['Coordinate', 'Formulate', 'Integrate', 'Organize', 'Prioritize'] },
  { domain: 'Affective', level: 'A5', title: 'A5 - Characterization', verbs: ['Act', 'Exemplify', 'Influence', 'Internalize', 'Practice'] },

  // Psychomotor Domain
  { domain: 'Psychomotor', level: 'P1', title: 'P1 - Perception', verbs: ['Detect', 'Distinguish', 'Isolate', 'Recognize'] },
  { domain: 'Psychomotor', level: 'P2', title: 'P2 - Set', verbs: ['Display', 'Position', 'Prepare', 'Set up'] },
  { domain: 'Psychomotor', level: 'P3', title: 'P3 - Guided Response', verbs: ['Assemble', 'Build', 'Calibrate', 'Imitate', 'Reproduce'] },
  { domain: 'Psychomotor', level: 'P4', title: 'P4 - Mechanism', verbs: ['Calibrate', 'Conduct', 'Execute', 'Fabricate', 'Measure'] },
  { domain: 'Psychomotor', level: 'P5', title: 'P5 - Complex Overt Response', verbs: ['Assemble', 'Calibrate', 'Construct', 'Dismantle', 'Operate', 'Troubleshoot'] },
  { domain: 'Psychomotor', level: 'P6', title: 'P6 - Adaptation', verbs: ['Adapt', 'Alter', 'Modify', 'Rearrange', 'Reorganize'] },
  { domain: 'Psychomotor', level: 'P7', title: 'P7 - Origination', verbs: ['Build', 'Compose', 'Construct', 'Design', 'Engineer', 'Originate'] }
];

export const UNMEASURABLE_VERBS_WARNING = [
  'understand', 'know', 'learn', 'be familiar with', 'appreciate', 'comprehend',
  'be aware of', 'study', 'grasp', 'internalize'
];

export const SAMPLE_COURSES = {
  embedded: {
    name: 'EE-312 Microcontroller & Embedded Systems',
    description: 'This course covers the architecture, programming, and hardware interfacing of modern microcontrollers (ARM Cortex-M & AVR). Topics include assembly and embedded C programming, GPIO, timer subsystems, interrupt service routines, ADC/DAC peripherals, serial communication protocols (UART, SPI, I2C), and sensor/actuator interfacing.',
    coursePlan: `Week 1-3: ARM Cortex-M Architecture & Memory Organization (Internal registers, memory mapping, bus matrix, startup sequence)
Week 4-6: Embedded C, GPIO Subsystems & Interrupt Handling (Nested Vectored Interrupt Controller NVIC, latency, debouncing)
Week 7-9: Timer Subsystems, PWM Generation & Analog Interfacing (Input capture, output compare, ADC sampling, DMA transfers)
Week 10-12: High-Speed Serial Communication Protocols (UART, SPI, I2C bus arbitration, clock stretching, frame formats)
Week 13-16: Real-Time Operating Systems (RTOS), Power Management & IoT Telemetry (Task scheduling, mutexes, low-power sleep modes)`,
    topics: [
      { moduleNumber: 1, title: 'ARM Cortex-M Architecture & Memory Organization', weekRange: 'Weeks 1–3', contactHours: 9, subtopics: ['Internal register bank and program status registers', 'Memory mapping and bus matrix architectures', 'Startup sequence, stack pointers, and reset handlers'] },
      { moduleNumber: 2, title: 'Embedded C, GPIO & Interrupt Handling (NVIC)', weekRange: 'Weeks 4–6', contactHours: 9, subtopics: ['Memory-mapped register manipulation in embedded C', 'Nested Vectored Interrupt Controller (NVIC) priorities', 'External interrupt latency and hardware debouncing'] },
      { moduleNumber: 3, title: 'Timers, PWM Generation & ADC/DAC Interfacing', weekRange: 'Weeks 7–9', contactHours: 9, subtopics: ['General-purpose timers and input capture/output compare', 'Pulse Width Modulation (PWM) for motor driving', 'ADC successive approximation and DMA data transfers'] },
      { moduleNumber: 4, title: 'Serial Communication Protocols (UART, SPI, I2C)', weekRange: 'Weeks 10–12', contactHours: 9, subtopics: ['UART baud rate generation and parity checks', 'SPI synchronous full-duplex master-slave interfacing', 'I2C multi-master arbitration and clock stretching'] },
      { moduleNumber: 5, title: 'RTOS Concepts, Low-Power Modes & IoT Telemetry', weekRange: 'Weeks 13–16', contactHours: 12, subtopics: ['FreeRTOS task scheduling, semaphores, and queues', 'Cortex-M Sleep/Deep-sleep modes and energy profiling', 'Wireless sensor interfacing and real-time telemetry'] }
    ],
    clos: [
      {
        id: 1,
        statement: 'Understand the internal architecture of 32-bit ARM microcontrollers including memory mapping and interrupt priority structures.',
        plo: 'PLO-1',
        taxonomy: 'C2'
      },
      {
        id: 2,
        statement: 'Analyze timing diagrams and register configurations for high-speed serial peripherals (SPI and I2C) to diagnose data transmission bottlenecks.',
        plo: 'PLO-2',
        taxonomy: 'C4'
      },
      {
        id: 3,
        statement: 'Design an interrupt-driven embedded data acquisition system that interfaces multi-sensor inputs and transmits real-time telemetry within strict power constraints.',
        plo: 'PLO-3',
        taxonomy: 'C6'
      }
    ]
  },
  power: {
    name: 'EE-415 Power Electronics & Drives',
    description: 'Analysis and design of solid-state electronic circuits for the control and conversion of electrical energy. Covers non-isolated and isolated DC-DC converters, single/three-phase inverters, PWM modulation schemes, magnetic component design, thermal considerations, and closed-loop motor drive control.',
    coursePlan: `Week 1-3: Semiconductor Switching Devices & Fundamental Converters (MOSFET, IGBT, diode recovery, non-isolated Buck and Boost)
Week 4-6: Isolated DC-DC Switch-Mode Power Supplies (Flyback, Forward, Push-Pull, high-frequency transformer design)
Week 7-9: Inverter Topologies & PWM Modulation Schemes (Single-phase, three-phase H-bridge, sinusoidal and space-vector PWM)
Week 10-12: Harmonics, Filter Design & Grid Synchronization (THD standards IEEE 519, LCL filters, Phase Locked Loop PLL)
Week 13-16: Thermal Management, EMI/EMC Regulations & Closed-Loop Motor Drives (Heat sink design, radiated/conducted emissions, Field-Oriented Control FOC)`,
    topics: [
      { moduleNumber: 1, title: 'Power Semiconductor Switches & Non-Isolated Converters', weekRange: 'Weeks 1–3', contactHours: 9, subtopics: ['Static/dynamic characteristics of MOSFETs and IGBTs', 'CCM and DCM operation in Buck, Boost, and Buck-Boost converters', 'Inductor core selection and capacitor ESR calculations'] },
      { moduleNumber: 2, title: 'Isolated DC-DC SMPS & Magnetic Component Design', weekRange: 'Weeks 4–6', contactHours: 9, subtopics: ['Flyback and Forward converter topologies', 'High-frequency transformer winding and core loss models', 'Snubber circuit design for peak voltage suppression'] },
      { moduleNumber: 3, title: 'DC-AC Inverters & Advanced PWM Modulation', weekRange: 'Weeks 7–9', contactHours: 9, subtopics: ['Single-phase and three-phase full bridge inverters', 'Sinusoidal PWM (SPWM) and Space Vector Modulation (SVPWM)', 'Dead-time generation and shoot-through protection'] },
      { moduleNumber: 4, title: 'Grid Interfacing, Power Quality & Filter Synthesis', weekRange: 'Weeks 10–12', contactHours: 9, subtopics: ['Harmonic spectrum analysis and IEEE 519 compliance', 'LCL filter design and resonance damping', 'Grid synchronization using Phase-Locked Loops (PLL)'] },
      { moduleNumber: 5, title: 'Thermal Sizing, EMI/EMC & Closed-Loop Drives', weekRange: 'Weeks 13–16', contactHours: 12, subtopics: ['Thermal impedance modeling and heat sink optimization', 'Conducted and radiated EMI mitigation techniques', 'Field-Oriented Control (FOC) for induction and BLDC motors'] }
    ],
    clos: [
      {
        id: 1,
        statement: 'Calculate voltage stress, current ripple, and switching losses across semiconductors in continuous conduction mode buck-boost converters.',
        plo: 'PLO-1',
        taxonomy: 'C3'
      },
      {
        id: 2,
        statement: 'Evaluate the total harmonic distortion (THD) and thermal dissipation in multi-level PWM inverter topologies for grid-tied photovoltaic systems.',
        plo: 'PLO-6',
        taxonomy: 'C5'
      },
      {
        id: 3,
        statement: 'Design an isolated flyback switch-mode power supply meeting EMI/EMC regulatory standards and energy efficiency targets.',
        plo: 'PLO-3',
        taxonomy: 'C6'
      }
    ]
  }
};

export const SAMPLE_ASSESSMENT = {
  courseName: 'EE-312 Microcontroller & Embedded Systems',
  title: 'Midterm Examination (Spring 2026)',
  totalMarks: 50,
  questions: [
    {
      id: 1,
      qNumber: 'Q1',
      text: 'Define the term "Interrupt Vector Table" and state the default vector address for the SysTick timer in ARM Cortex-M architecture.',
      marks: 10,
      mappedCLO: 'CLO-1',
      targetTaxonomy: 'C2'
    },
    {
      id: 2,
      qNumber: 'Q2',
      text: 'Examine the provided logic analyzer trace of an SPI bus transaction showing clock jitter and missed acknowledgements. Identify the root cause of the framing error and substantiate your conclusion with bus protocol calculations.',
      marks: 15,
      mappedCLO: 'CLO-2',
      targetTaxonomy: 'C4'
    },
    {
      id: 3,
      qNumber: 'Q3',
      text: 'List 4 differences between polling and interrupt mechanisms in embedded systems.',
      marks: 25,
      mappedCLO: 'CLO-3',
      targetTaxonomy: 'C6'
    }
  ]
};

export const AI_RLI_FRAMEWORK_PILLARS = [
  {
    id: 'P1',
    code: 'P1: Process > Product',
    title: 'Process Over Product',
    color: 'orange',
    description: 'Captures the student\'s cognitive arc—drafts, concept maps, debug logs, logic analyzer traces, or reflective annotations of confusion and breakthrough that AI cannot reverse engineer.',
    designMoves: [
      'Require intermediate drafts, timing sketches, or preliminary schematics',
      'Mandate a decision log documenting failed attempts and diagnostic choices',
      'Ask for reflective margin annotations explaining why specific trade-offs were made',
      'Include a code/calculation walk-through explaining line-by-line reasoning'
    ]
  },
  {
    id: 'P2',
    code: 'P2: Contextualization',
    title: 'Traceable Real-World Context',
    color: 'emerald',
    description: 'Grounds the task in a specific, personally observed, or institution-specific real-world scenario with concrete constraints, live lab bench measurements, or dated observations that AI has no access to.',
    designMoves: [
      'Anchor to a specific laboratory hardware bench (e.g. Bench #4 with STM32F401RE & Rigol scope)',
      'Inject live measured values with real-world component tolerances (e.g. 5% resistor drift, ground noise)',
      'Require students to name, date, and document their physical testing environment',
      'Embed departmental or local industrial constraints with non-ideal environmental factors'
    ]
  },
  {
    id: 'P3',
    code: 'P3: Conceptual Depth & AI Critique',
    title: 'Loadbearing Structure & AI Critique',
    color: 'blue',
    description: 'Tests whether students have internalized the non-negotiable structural components of a concept vs incidental ones, and incorporates the AI Critique strategy to identify oversimplifications in AI output.',
    designMoves: [
      'Ask students to distil the concept to its minimal non-negotiable structural components',
      'Identify elements commonly mistaken as essential and justify why they are incidental',
      'AI Critique Strategy: Provide or generate an AI response and critique where it oversimplified, missed nuances, or hallucinated',
      'Require students to stress-test the concept under boundary conditions where standard formulas break down'
    ]
  }
];

export const AI_VULNERABILITY_SPECTRUM = {
  C1: { level: 'C1 Remember', vulnerability: 'Very High', label: 'AI Handles Completely', badgeClass: 'bg-rose-100 text-rose-800 border-rose-200', desc: 'Recalling definitions, formulas, or standard terminology. Generative AI generates flawless answers with zero student thinking.' },
  C2: { level: 'C2 Understand', vulnerability: 'Very High', label: 'AI Explains Fluently & Accurately', badgeClass: 'bg-rose-100 text-rose-800 border-rose-200', desc: 'Explaining concepts or giving standard examples. AI produces textbook-quality summaries without genuine student understanding.' },
  C3: { level: 'C3 Apply', vulnerability: 'High', label: 'AI Applies Formulas Readily', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200', desc: 'Executing standard procedures or numerical plug-and-chug problems. AI readily solves standard circuit formulas and math steps.' },
  C4: { level: 'C4 Analyse', vulnerability: 'Threshold Level', label: 'AI-RLI Primary Threshold', badgeClass: 'bg-blue-100 text-blue-800 border-blue-200', desc: 'Critical entry point for redesign. Distinguishing essential from incidental structural components, diagnosing faults, and analyzing trade-offs.' },
  C5: { level: 'C5 Evaluate', vulnerability: 'Moderate', label: 'Requires Situated Judgment', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200', desc: 'Defending personal judgment, assessing trade-offs against competing engineering standards, and critiquing AI recommendations.' },
  C6: { level: 'C6 Create', vulnerability: 'Low / Resilient', label: 'Requires Original Synthesis', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200', desc: 'Devising original system architectures, creating novel PCB/firmware implementations, and synthesizing verifiable physical prototypes.' },
  P1: { level: 'P1-P3 Psychomotor', vulnerability: 'Moderate', label: 'Motor Guided Procedure', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200', desc: 'Hands-on equipment setup and calibration. AI can describe steps but cannot physically manipulate components or test probes.' },
  P4: { level: 'P4-P7 Psychomotor', vulnerability: 'Low / Resilient', label: 'Physical Hands-On Mastery', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200', desc: 'Hardware fabrication, troubleshooting live circuitry, and prototype development. Intrinsically resilient when physical verification is mandated.' }
};

export const SAMPLE_RESILIENCE_PRESETS = [
  {
    id: 'embedded-i2c',
    name: 'EE-312: Embedded I2C Bus Contention',
    courseName: 'EE-312 Microcontroller & Embedded Systems',
    assessmentType: 'assignment',
    cloStatement: 'Analyze timing diagrams and register configurations for high-speed serial peripherals (SPI and I2C) to diagnose data transmission bottlenecks.',
    plo: 'PLO-2',
    taxonomy: 'C4',
    conceptTopic: 'I2C Clock Stretching & Bus Arbitration Failure under Multi-Master Contention',
    localContext: 'Department Hardware Laboratory Bench #3; STM32F401RE Nucleo board interfaced with DS3231 RTC and 24C32 EEPROM; 2.2kΩ pull-up resistors on 3.3V rail with 180pF stray bus capacitance measured on Rigol DS1054Z.'
  },
  {
    id: 'power-smps',
    name: 'EE-415: Power Inverter Harmonics',
    courseName: 'EE-415 Power Electronics & Drives',
    assessmentType: 'exam_question',
    cloStatement: 'Evaluate the total harmonic distortion (THD) and thermal dissipation in multi-level PWM inverter topologies for grid-tied photovoltaic systems.',
    plo: 'PLO-3',
    taxonomy: 'C6',
    conceptTopic: 'Space Vector PWM vs Sinusoidal PWM Dead-Time Shoot-Through & Thermal Budget',
    localContext: '10kW Grid-tied 3-phase inverter prototype in Power Systems Research Cell; SiC MOSFET half-bridge operating at 50kHz switching frequency; ambient enclosure temperature 42°C with heatsink thermal resistance R_th = 0.85 °C/W.'
  },
  {
    id: 'dsp-filter',
    name: 'EE-314: DSP Real-Time Latency',
    courseName: 'EE-314 Digital Signal Processing',
    assessmentType: 'lab_practical',
    cloStatement: 'Design and implement discrete-time FIR and IIR digital filter architectures to eliminate high-frequency noise in real-time sensor data.',
    plo: 'PLO-5',
    taxonomy: 'C4',
    conceptTopic: 'Fixed-Point Quantization Limit Cycles & Coefficient Rounding in Biquad Filters',
    localContext: 'TMS320C6748 DSP starter kit connected to electromyogram (EMG) electrode front-end; 16-bit Q15 fixed-point arithmetic with 8kHz sampling rate and 50Hz powerline harmonic pickup.'
  },
  {
    id: 'control-stability',
    name: 'EE-315: Control Systems Stability',
    courseName: 'EE-315 Feedback Control Systems',
    assessmentType: 'quiz',
    cloStatement: 'Design closed-loop PID and lead-lag compensators to satisfy transient response and steady-state error specifications for robotic actuation systems.',
    plo: 'PLO-2',
    taxonomy: 'C4',
    conceptTopic: 'Root Locus Right-Half Plane Pole Migration under Actuator Saturation & Delay',
    localContext: 'Quanser QUBE-Servo 2 rotary inverted pendulum in Control Systems Lab; motor torque saturation at ±10V with 25ms communication transport delay across CAN bus.'
  }
];

// ============================================================================
// LEARNING BEYOND AI (LBAI) FRAMEWORK CONSTANTS
// Student Pedagogy Partnership (SPP) Program • Learning Innovation Center (LIC)
// Authors: Zunaira Khalid & Rimsha Munir
// ============================================================================

export const LBAI_METADATA = {
  title: 'Learning Beyond AI: A Framework for Strengthening Human Intelligence in the Age of AI',
  authors: 'Zunaira Khalid & Rimsha Munir',
  institution: 'University of Central Punjab (UCP)',
  center: 'Learning Innovation Center (LIC)',
  program: 'Student Pedagogy Partnership (SPP) Program',
  corePremise: 'The long-term response to generative AI is not to restrict its use, but to establish classrooms and assessments that strengthen human intelligence.'
};

export const LBAI_PILLARS = [
  {
    id: 'P1',
    code: 'Pillar 1',
    name: 'Visible Thinking',
    color: 'orange',
    tagline: 'Externalize Reasoning & Build Mental Muscles',
    whatItDoes: 'Makes learners\' thinking visible by equipping them with thinking practices to support them in exercising their mental muscles, helping them identify how they arrive at their ideas, decisions, or solutions. By making thinking visible, learners build real intelligence that prepares them to actively critique and engage with artificial intelligence thoughtfully.',
    coreDesignMove: 'Cultivate a classroom culture that values inquiry, dialogue, and metacognition. Employ thinking routines (e.g., Harvard Project Zero) to build habits of regular purposeful mental work that externalizes student reasoning. Learning activities and assessments should embed thinking routines requiring students to recognize their cognitive processes.',
    keyTheorist: 'Ritchhart, Church, & Morrison (2011) • Harvard Project Zero',
    pedagogicalAction: 'Require interim sketches, thought maps, decision journals, and peer critique protocols before any final artifact is produced.'
  },
  {
    id: 'P2',
    code: 'Pillar 2',
    name: 'Relational Application',
    color: 'emerald',
    tagline: 'Connect Theory to Authentic Real-World Realities',
    whatItDoes: 'Encourages students to connect classroom learning with authentic situations by applying knowledge to meaningful contexts. Students learn to make connections between theory and practice, using their experiences, communities, and real-world challenges to develop informed judgement and decision-making.',
    coreDesignMove: 'Create opportunities to apply content knowledge to the real world. Use authentic problems, case studies, community engagement, project-based learning, experiential activities, and collaborative inquiry. Encourage learners to draw on personal experiences, local issues, and disciplinary practices to make informed decisions.',
    keyTheorist: 'L. Dee Fink (2003) • Taxonomy of Significant Learning (Application & Integration)',
    pedagogicalAction: 'Anchor problems in verifiable local datasets, physical laboratory benches, component tolerances, or immediate community industry contexts.'
  },
  {
    id: 'P3',
    code: 'Pillar 3',
    name: 'Conceptual Mastery',
    color: 'blue',
    tagline: 'Deep Principles, Transferability & AI Critique',
    whatItDoes: 'Develops deep conceptual understanding by enabling students to explain, justify, critique, and synthesize ideas rather than simply recalling information. Students demonstrate mastery by recognizing relationships between concepts and transferring their understanding to new and unfamiliar situations.',
    coreDesignMove: 'Cultivate classrooms, learning experiences, and assessments that prioritize conceptual understanding before procedural completion. Facilitate inquiry, discussion, and collaborative learning to examine underlying principles, justify reasoning, critique ideas, make conceptual connections, and transfer knowledge across contexts.',
    keyTheorist: 'Brown, Roediger, & McDaniel (2014) / Fink (2003)',
    pedagogicalAction: 'Ask "why does this fail?" rather than "compute x". Require students to generate AI outputs and critically evaluate them for errors, bias, and omissions.'
  }
];

export const HARVARD_PZ_THINKING_ROUTINES = [
  {
    id: 'what-makes-you-say-that',
    name: 'What Makes You Say That?',
    category: 'Reasoning with Evidence',
    purpose: 'Helps students describe what they see or know and offer interpretations backed by evidence, building habits of justification.',
    promptStructure: '1. What do you notice / what is happening? → 2. What makes you say that? (Cite physical / theoretical evidence)',
    classroomApplication: 'Analyzing an oscilloscope waveform, circuit fault, or thermal thermal camera image before touching the schematic.'
  },
  {
    id: 'think-puzzle-explore',
    name: 'Think - Puzzle - Explore',
    category: 'Inquiry & Curiosity',
    purpose: 'Fosters independent inquiry by clarifying prior knowledge, pinpointing perplexities, and directing authentic investigation.',
    promptStructure: '1. What do you THINK you know? → 2. What PUZZLES you about this system? → 3. How can we EXPLORE it without AI taking over?',
    classroomApplication: 'Introducing complex topics like semiconductor physics, non-linear distortion, or transmission line reflections.'
  },
  {
    id: 'think-pair-share',
    name: 'Think - Pair - Share',
    category: 'Active Dialogue',
    purpose: 'Encourages individual processing before peer argumentation and plenary synthesis, preventing passive deference to AI summaries.',
    promptStructure: '1. Individual silent thinking & written trace (2 min) → 2. Pair debate & compare (3 min) → 3. Shared collective consensus.',
    classroomApplication: 'Evaluating trade-offs between two control architectures, modulation schemes, or component selections.'
  },
  {
    id: 'circle-of-viewpoints',
    name: 'Circle of Viewpoints',
    category: 'Multi-Perspective Analysis',
    purpose: 'Helps students see topics from diverse stakeholder lenses, cultivating nuanced professional and ethical judgement.',
    promptStructure: '1. Identify diverse viewpoints (Design Engineer, Field Technician, Safety Auditor, End User) → 2. Speak from that perspective → 3. Raise critical questions.',
    classroomApplication: 'PEC PLO-6 / PLO-7 environmental and safety reviews for high-voltage installations or automated control systems.'
  },
  {
    id: 'i-used-to-think',
    name: 'I Used to Think... Now I Think...',
    category: 'Metacognition & Conceptual Change',
    purpose: 'Helps students reflect on how their thinking has developed over time, consolidating conceptual shifts and intellectual growth.',
    promptStructure: '1. When we began this topic, I used to think [naive assumption]... → 2. Now, after analyzing the evidence, I think [refined mental model]...',
    classroomApplication: 'Post-lab synthesis or end-of-module debrief on complex concepts (e.g., grounding, feedback stability, cache coherency).'
  },
  {
    id: 'see-think-wonder',
    name: 'See - Think - Wonder',
    category: 'Visual & Physical Inquiry',
    purpose: 'Structures observation and deep thinking about physical systems, artifacts, or anomalies before jumping to premature conclusions.',
    promptStructure: '1. What do you SEE? (Raw observations only) → 2. What do you THINK is happening? → 3. What does it make you WONDER?',
    classroomApplication: 'Diagnosing an incinerated MOSFET, an unexpected spectrum analyzer spike, or anomalous sensor telemetry.'
  },
  {
    id: 'compass-points',
    name: 'Compass Points (E - W - N - S)',
    category: 'Decision-Making & Dilemmas',
    purpose: 'Fleshes out ideas and evaluates proposals before committing to an engineering design or policy direction.',
    promptStructure: 'E = Excited (What is promising?) | W = Worrisome (What are risks?) | N = Need to Know (What info is missing?) | S = Stance / Suggestions.',
    classroomApplication: 'Evaluating whether to migrate legacy embedded firmware to a new real-time OS or adopt cloud-based IoT telemetry.'
  },
  {
    id: 'connect-extend-challenge',
    name: 'Connect - Extend - Challenge',
    category: 'Knowledge Synthesis & Transfer',
    purpose: 'Helps students integrate new knowledge into existing mental frameworks and identify remaining conceptual tensions.',
    promptStructure: '1. How does this CONNECT to prior knowledge? → 2. How does it EXTEND your thinking? → 3. What CHALLENGES or puzzles your understanding?',
    classroomApplication: 'Transitioning from ideal circuit theory to real-world parasitic effects, thermal derating, and EMI.'
  },
  {
    id: 'claim-support-question',
    name: 'Claim - Support - Question',
    category: 'Critical AI Evaluation',
    purpose: 'Trains students to formulate reasoned claims, substantiate them with rigorous evidence, and formulate probing counter-questions.',
    promptStructure: '1. Make a CLAIM regarding the system / AI output → 2. SUPPORT it with derivations/experiments → 3. Formulate an unresolved QUESTION.',
    classroomApplication: 'Auditing and critiquing a ChatGPT-generated circuit schematic or algorithm for hidden flaws or omitted safety margins.'
  }
];

export const FINK_TAXONOMY_DIMENSIONS = [
  { dimension: 'Foundational Knowledge', desc: 'Understanding and remembering information and ideas; essential conceptual vocabulary.' },
  { dimension: 'Application Skills', desc: 'Engaging in critical, creative, or practical thinking; managing engineering projects and tools.' },
  { dimension: 'Integration', desc: 'Connecting ideas, disciplines, perspectives, and linking theoretical principles to lived realities.' },
  { dimension: 'Human Dimension', desc: 'Learning about oneself and others; understanding the social, ethical, and environmental impact of technology.' },
  { dimension: 'Caring', desc: 'Developing new feelings, interests, and professional engineering values; pride in precision and safety.' },
  { dimension: 'Learning How to Learn', desc: 'Becoming a self-directed, reflective learner capable of navigating evolving AI technologies.' }
];

export const SPP_PROCESS_PHASES = [
  {
    phaseNumber: 1,
    name: 'Preparation',
    timeline: 'Weeks 1–2 of Semester',
    focus: 'Orientation, Training & 3-Pillar Alignment',
    description: 'LIC conducts dedicated training for DPPs, Faculty Partners, and Student Partners. Partners align course outlines and core objectives against the three pillars within two weeks of orientation.'
  },
  {
    phaseNumber: 2,
    name: 'Design',
    timeline: 'Ongoing Weekly Co-Development',
    focus: 'AI in Design & Task Redesign',
    description: 'Faculty and Student Partners co-develop learning experiences and assessments, using AI thoughtfully as a thought partner to sharpen reasoning rather than replace it.'
  },
  {
    phaseNumber: 3,
    name: 'Delivery',
    timeline: 'Semester Implementation',
    focus: 'Classroom Interventions & Peer Mentoring',
    description: 'Classroom interventions are implemented and monitored. Student Partners take on visible peer-facing roles to guide fellow students on revised learning expectations.'
  },
  {
    phaseNumber: 4,
    name: 'Evaluation',
    timeline: 'End of Semester Synthesis',
    focus: 'SPP Rubric & Reflective Findings',
    description: 'Partners conduct ongoing reflective evaluation against the SPP Evaluation Rubric, synthesizing observations from DPP, Faculty, and Student partners into an actionable report.'
  }
];

export const SPP_ROLES = [
  {
    role: 'Departmental Pedagogical Partner (DPP)',
    badge: 'Institutional Bridge',
    color: 'orange',
    responsibilities: [
      'Acts as functional bridge between LIC and Faculty/Student partnerships.',
      'Supports assigned partnerships in curriculum design, delivery, and assessment reframing.',
      'Conducts biweekly check-ins with partners and coordinates monthly documentation for LIC.'
    ]
  },
  {
    role: 'Faculty Partner',
    badge: 'Course Instructor',
    color: 'blue',
    responsibilities: [
      'Collaborates closely with Student Partner to view course through the three pillars.',
      'Reshapes teaching, syllabus, classroom routines, and two-lane assessments.',
      'Employs AI mindfully as a thought partner while preserving cognitive struggle and human agency.'
    ]
  },
  {
    role: 'Student Partner',
    badge: 'Learner Voice',
    color: 'emerald',
    responsibilities: [
      'Brings authentic learner perspective to redesigned tasks, sharing critical feedback.',
      'Tests new assessment tasks to identify cognitive load, clarity, and authentic engagement.',
      'Serves as visible peer mentor to students navigating the new Learning Beyond AI expectations.'
    ]
  }
];

export const TWO_LANES_MODEL = {
  secured: {
    name: 'Secured Lane',
    badge: 'Observed & Invigilated',
    color: 'orange',
    definition: 'Tasks that are observed, invigilated, or dialogic, where the institution can verify that the enrolled student produced the work independently.',
    purpose: 'Establishes what the student can do independently. Confirms individual understanding, which is what makes AI use safe elsewhere in the course.',
    examples: ['Invigilated examinations (Midterm / Final)', 'In-class concept mapping & tests', 'Interactive oral assessments (viva voce)', 'Observed laboratory practicals', 'Project oral defences']
  },
  open: {
    name: 'Open Lane',
    badge: 'AI as Thought Partner',
    color: 'blue',
    definition: 'Tasks completed without supervision, where completion cannot be verified. AI use is permitted at a declared level (AIAS Levels 1–4).',
    purpose: 'Establishes how well the student works with AI: prompting, questioning, correcting, rejecting hallucinations, and documenting reasoning.',
    examples: ['Short analysis with planning AI', 'Applied case responses', 'Critique of AI-generated output (the critique is the artifact)', 'Process & reflection portfolios', 'Comprehensive project artefacts']
  }
};

export const AIAS_PERMITTED_USE_SCALE = [
  {
    level: 0,
    title: 'Level 0: No AI',
    permittedAction: 'No AI use at any stage. Applies to secured tasks only, since this is the only lane where the rule is enforceable.',
    evidenceRequired: 'Direct physical observation, locked browser, or proctored invigilation.',
    applicableLane: 'Secured Lane Only'
  },
  {
    level: 1,
    title: 'Level 1: AI for Planning',
    permittedAction: 'AI may be used to brainstorm, structure, outline, and locate reference material. All drafting, calculations, and analytical conclusions must be the student\'s own.',
    evidenceRequired: 'Mandatory Disclosure Statement explicitly naming tools, versions, and full prompt history.',
    applicableLane: 'Open Lane'
  },
  {
    level: 2,
    title: 'Level 2: AI Collaboration',
    permittedAction: 'AI may be used within the drafting and design process, provided the student substantially revises, corrects, optimizes, or extends its output.',
    evidenceRequired: 'Disclosure statement plus annotated changelog highlighting what was modified, corrected, or verified.',
    applicableLane: 'Open Lane'
  },
  {
    level: 3,
    title: 'Level 3: AI Evaluation',
    permittedAction: 'The student is required to prompt AI to generate an output (code, design, derivation) and critique it against disciplinary standards, identifying error, bias, or omission.',
    evidenceRequired: 'The critique itself is the primary assessed artefact (not the AI output).',
    applicableLane: 'Open Lane'
  },
  {
    level: 4,
    title: 'Level 4: AI Exploration',
    permittedAction: 'The student designs their own multi-stage workflow with AI and critically justifies methodological choices made across a body of prior work.',
    evidenceRequired: 'Comprehensive reflective portfolio with detailed evidence trail and metacognitive defense.',
    applicableLane: 'Open Lane'
  }
];

export const LBAI_DEFAULT_WEIGHTING_MODEL = [
  { id: 1, task: 'Assignment 1: Concept Map & Annotated Plan', lane: 'Secured', aiLevel: 0, aiLabel: 'Level 0: Completed in class', weight: 5, evidence: 'Completed in class under observation' },
  { id: 2, task: 'Assignment 2: Short Analysis with Problem Formulation', lane: 'Open', aiLevel: 1, aiLabel: 'Level 1: AI for Planning', weight: 5, evidence: 'Disclosure statement naming tools and prompts' },
  { id: 3, task: 'Assignment 3: Applied Case Response & Benchmarking', lane: 'Open', aiLevel: 2, aiLabel: 'Level 2: AI Collaboration', weight: 10, evidence: 'Disclosure + annotated record of what was changed and why' },
  { id: 4, task: 'Assignment 4: Critique of AI-Generated Output', lane: 'Open', aiLevel: 3, aiLabel: 'Level 3: AI Evaluation', weight: 10, evidence: 'The critique itself is the assessed artefact' },
  { id: 5, task: 'Assignment 5: Process & Metacognitive Portfolio', lane: 'Open', aiLevel: 4, aiLabel: 'Level 4: AI Exploration', weight: 10, evidence: 'Reflective portfolio with evidence trail' },
  { id: 6, task: 'Midterm Examination', lane: 'Secured', aiLevel: 0, aiLabel: 'Level 0: Invigilated', weight: 20, evidence: 'Invigilated examination hall' },
  { id: 7, task: 'Final Examination', lane: 'Secured', aiLevel: 0, aiLabel: 'Level 0: Invigilated', weight: 25, evidence: 'Comprehensive invigilated examination hall' },
  { id: 8, task: 'Course Project Artefact', lane: 'Open', aiLevel: 2, aiLabel: 'Level 2: AI Collaboration', weight: 10, evidence: 'Annotated codebase / prototype with design log' },
  { id: 9, task: 'Project Defence & Interactive Oral (Viva Voce)', lane: 'Secured', aiLevel: 0, aiLabel: 'Level 0: Observed', weight: 5, evidence: 'Observed individual interactive oral defence' }
];

export const LBAI_SAMPLE_COURSES = {
  embedded: {
    courseName: 'EE-312 Microcontroller & Embedded Systems',
    courseDescription: 'Architecture, programming, and hardware interfacing of modern 32-bit microcontrollers. Covers GPIO, interrupt handling, timers, PWM, high-speed serial protocols (SPI, I2C), and RTOS.',
    sampleTopic: 'I2C and SPI Serial Peripheral Communication under Bus Contention and Clock Jitter',
    sampleCLO: 'Analyze timing diagrams and register configurations for high-speed serial peripherals (SPI and I2C) to diagnose data transmission bottlenecks.',
    recommendedPillars: {
      P1: { routine: 'Claim-Support-Question', action: 'Prompt students to diagnose why an I2C clock-stretching event locks up an interrupt handler, requiring annotated oscilloscope traces before inspecting code.' },
      P2: { context: 'Bench Hardware Interface', action: 'Connect STM32 to real hardware sensor (DS3231 RTC) with intentional bus capacitance overload to observe physical signal degradation.' },
      P3: { depthQuestion: 'AI Hallucination Audit', action: 'Direct students to ask AI how to optimize I2C bus pull-up resistors; evaluate AI output against RC time-constant calculations and identify overlooked bus capacitance limits.' }
    }
  },
  power: {
    courseName: 'EE-415 Power Electronics & Drives',
    courseDescription: 'Analysis, design, and simulation of power electronic converters, inverters, and motor drive systems. Focuses on switching losses, harmonic distortion, thermal budgeting, and magnetics.',
    sampleTopic: 'Multi-Level PWM Inverter Harmonic Spectrum and Heat Sink Thermal Budgeting',
    sampleCLO: 'Evaluate the total harmonic distortion (THD) and thermal dissipation in multi-level PWM inverter topologies for grid-tied photovoltaic systems.',
    recommendedPillars: {
      P1: { routine: 'What Makes You Say That?', action: 'Present simulated thermal runaway in a SiC MOSFET half-bridge; students must justify the failure mechanism using junction-to-case thermal impedance curves.' },
      P2: { context: 'Photovoltaic Grid Interconnection', action: 'Apply IEEE-519 harmonic standards to a localized 10kW rooftop solar installation in Lahore with 45°C ambient summer temperatures.' },
      P3: { depthQuestion: 'Dead-Time Distortion Analysis', action: 'Prompt AI to write an SPWM code snippet. Students critique the generated code for missing dead-time shoot-through prevention routines.' }
    }
  }
};
