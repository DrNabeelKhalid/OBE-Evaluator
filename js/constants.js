// OBE CLO Evaluator Constants & Standards
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

