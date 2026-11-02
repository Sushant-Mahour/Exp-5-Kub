// app.js

// State variables
let currentStep = 0;
let selectedLeather = null;
let isDoorOpen = false;
let isTared = false;
let isScaleWeighed = false;
let isWaterFilled = false;
let isWaterAdjusted = false;
let isSpecimenInserted = false;
let isTilted = false;
let immersionStarted = false;
let immersionCompleted = false;
let drainingStarted = false;
let drainingCompleted = false;
let calculationVerified = false;
let soundEnabled = true;
let isSpecimenCut = false;

// Audio Synthesizer using Web Audio API
class LabSynth {
  constructor() {
    this.ctx = null;
    this.mute = false;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playClick() {
    if (this.mute) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playBeep(freq = 1000, duration = 0.15, volume = 0.1) {
    if (this.mute) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playDoor() {
    if (this.mute) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(80, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(140, this.ctx.currentTime + 0.8);
    
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.0, this.ctx.currentTime + 0.8);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.8);
  }

  playPour(duration = 2) {
    if (this.mute) return;
    this.init();
    
    // Create white noise for water sound
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // Filter to make it sound like liquid
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + duration);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
    noise.stop(this.ctx.currentTime + duration);
  }

  playDoubleBeep() {
    this.playBeep(1200, 0.1, 0.08);
    setTimeout(() => this.playBeep(1200, 0.1, 0.08), 150);
  }

  playAlarm() {
    if (this.mute) return;
    this.init();
    let time = this.ctx.currentTime;
    for(let i=0; i<3; i++) {
      this.playBeep(1500, 0.2, 0.06);
      setTimeout(() => {}, 400);
    }
  }
}

const synth = new LabSynth();

// Specimen configuration details
const leatherSpecs = {
  chrome: {
    name: 'Chrome-Tanned Upper Leather',
    thickness: '1.4 mm',
    density: '0.78 g/cm³',
    dryMass: 11.850,
    volume: 15.19,
    absorbedVolume: 3.5,
    expectedQ: 29.54,
    expectedP: 23.04,
    conclusion: 'The Chrome-Tanned Upper Leather exhibits moderate static water absorption (29.54% by mass, 23.04% by volume). This is typical for shoe upper leathers, which are chrome-tanned to remain soft and flexible while retaining a degree of natural breathability and moderate water resistance.'
  },
  vegetable: {
    name: 'Vegetable-Tanned Sole Leather',
    thickness: '4.0 mm',
    density: '0.92 g/cm³',
    dryMass: 14.520,
    volume: 15.78,
    absorbedVolume: 5.8,
    expectedQ: 39.94,
    expectedP: 36.76,
    conclusion: 'The Vegetable-Tanned Sole Leather exhibits high static water absorption (39.94% by mass, 36.76% by volume). Due to the vegetable tanning process, sole leather contains large amounts of tanning materials and a dense structure, but it absorbs water readily. This shows it requires waterproof coatings or impregnation treatments if used in wet conditions.'
  }
};

// Instructions configurations
const stepInstructions = {
  0: `
    <p><strong>Standard ISO 2417 / IUP 7 Determination</strong></p>
    <p>This test determines the static water absorption capacity of leather by measuring the volume of water absorbed under prescribed immersion and drainage conditions.</p>
    <div class="highlight-box">
      <strong>Procedure:</strong> Select a leather specimen on the right to examine its standard physical properties (Chrome-Tanned Upper or Vegetable-Tanned Sole), then click <strong>Next Step</strong>.
    </div>
  `,
  1: `
    <p><strong>Step 1: Specimen Preparation (70 mm Press Cutter)</strong></p>
    <p>In accordance with <strong>ISO 2417</strong>, the test specimen must be a circular disc with a diameter of <strong>70 mm</strong>.</p>
    <ul>
      <li>Place the test leather sample on the cutting mat.</li>
      <li>Position the 70 mm punch die cutter tool over the central area of the sheet.</li>
      <li>Click <strong>Press Cutter</strong> (or click the cutter tool) to stamp out the specimen.</li>
      <li>Once stamped, click <strong>Next Step</strong> to proceed to analytical weighing.</li>
    </ul>
  `,
  2: `
    <p><strong>Step 2: Determine Initial Dry Mass (m₁)</strong></p>
    <p>Weigh the dry leather specimen using the analytical draft shield balance (accurate to 0.001 g).</p>
    <ul>
      <li>Click the glass sliding draft shield to open the balance chamber.</li>
      <li>Press the <strong>TARE</strong> button to zero the scale readout.</li>
      <li>Drag the specimen onto the weighing pan (or click <strong>Weigh Specimen</strong>).</li>
      <li>Close the draft shield to eliminate air currents and stabilize the reading.</li>
    </ul>
    <div class="highlight-box">
      Record the stabilized value as initial dry mass <strong>m₁</strong>.
    </div>
  `,
  3: `
    <p><strong>Step 3: Preparing the Kubelka Apparatus</strong></p>
    <p>Add distilled water to the lower bulb (Bulb A) of the Kubelka apparatus.</p>
    <ul>
      <li>Click <strong>Pour Distilled Water</strong> to fill Bulb A (75 mL).</li>
      <li>Click <strong>Fine Adjust to 0.0 mL</strong> to align the meniscus exactly at the zero graduation mark.</li>
    </ul>
    <div class="highlight-box">
      The initial water level must align precisely with the 0.0 mL graduation line before mounting the leather.
    </div>
  `,
  4: `
    <p><strong>Step 4: Inserting the Specimen</strong></p>
    <p>Place the test specimen into Cylinder B (upper chamber) of the apparatus.</p>
    <ul>
      <li>Click on the leather specimen to slide and mount it into the upper cylinder holder.</li>
      <li>The sample is secured in Cylinder B above the water level in Bulb A.</li>
    </ul>
    <div class="highlight-box">
      The water remains in Bulb A while the leather rests in Cylinder B. They do not contact until tilting.
    </div>
  `,
  5: `
    <p><strong>Step 5: Tilting & Static Immersion</strong></p>
    <p>Submerge the leather specimen by rotating the apparatus horizontally (90°).</p>
    <ul>
      <li>Rotate the apparatus to <strong>90 degrees</strong> using the tilt slider (or click <strong>Tilt to 90°</strong>). Distilled water flows from Bulb A into Cylinder B, fully immersing the specimen.</li>
      <li>Click <strong>Start Immersion</strong> to run the standard <strong>30-minute</strong> static immersion.</li>
    </ul>
    <div class="highlight-box">
      Standard ISO test durations include 15m, 30m, 1h, 2h, and 24h. We are running the standard 30-minute immersion.
    </div>
  `,
  6: `
    <p><strong>Step 6: Draining & Final Reading</strong></p>
    <p>Return the apparatus to the vertical position (0°) and drain excess water for 60 seconds.</p>
    <ul>
      <li>Return the tilt slider to <strong>0 degrees</strong> (vertical).</li>
      <li>Click <strong>Start Draining</strong> to run the 60-second drainage stand. Unabsorbed water drips back into Bulb A.</li>
      <li>Observe the <strong>Zoom Viewer</strong> to read the final meniscus level.</li>
    </ul>
    <div class="highlight-box">
      The graduated tube directly indicates the net water volume absorbed (<strong>V₁</strong>) by the leather specimen.
    </div>
  `,
  7: `
    <p><strong>Step 7: Observations & Calculations</strong></p>
    <p>Calculate the static water absorption by mass (<strong>Q</strong>) and by volume (<strong>P</strong>):</p>
    <ul>
      <li><strong>Q</strong> = (V₁ / m₁) × 100 (% or mL / 100 g)</li>
      <li><strong>P</strong> = (V₁ / V₀) × 100 (% or mL / 100 cm³), where V₀ = m₁ / ρ</li>
      <li>Enter your calculated Q and P values and click <strong>Verify Calculations</strong> to unlock the official ISO test report.</li>
    </ul>
  `
};

// DOM Elements
const DOM = {
  // Navigation
  btnPrev: document.getElementById('btn-prev'),
  btnNext: document.getElementById('btn-next'),
  stepTitle: document.getElementById('step-title'),
  stepInstruction: document.getElementById('step-instruction'),
  stepDots: document.querySelectorAll('.step-dot'),
  progressLine: document.getElementById('progress-line'),
  stepBadge: document.getElementById('current-step-badge'),
  btnAudioToggle: document.getElementById('btn-audio-toggle'),
  btnThemeToggle: document.getElementById('btn-theme-toggle'),
  calcV0: document.getElementById('calc-v0'),
  
  // Screens
  screens: document.querySelectorAll('.sim-screen'),
  
  // Telemetry
  telLeather: document.getElementById('val-leather-type'),
  telDryMass: document.getElementById('val-dry-mass'),
  telWaterLevel: document.getElementById('val-water-level'),
  telTimer: document.getElementById('val-timer'),

  // Step 0: Selection
  cardChrome: document.getElementById('card-chrome'),
  cardVegetable: document.getElementById('card-vegetable'),
  
  // Step 1: Cutting
  btnCutSpecimen: document.getElementById('btn-cut-specimen'),
  pressCutter: document.getElementById('press-cutter'),
  cuttingStatus: document.getElementById('cutting-status-msg'),

  // Step 1: Weighing Balance
  balanceWeight: document.getElementById('balance-weight-display'),
  balanceDoor: document.getElementById('balance-door'),
  btnTarePad: document.getElementById('btn-tare-pad'),
  draggableLeather: document.getElementById('draggable-leather'),
  btnAutoWeigh: document.getElementById('btn-auto-weigh'),
  doorStatusIndicator: document.getElementById('door-status-indicator'),

  // Step 2: Filling Water
  beakerContainer: document.getElementById('beaker-container'),
  pourStream: document.getElementById('pour-stream-svg'),
  prepWater: document.getElementById('prep-water-rect'),
  btnPourWater: document.getElementById('btn-pour-water'),
  btnAdjustWater: document.getElementById('btn-adjust-water'),

  // Step 3: Specimen Insertion
  insertLeather: document.getElementById('insert-leather'),
  insertedLeatherSvg: document.getElementById('inserted-leather-svg'),

  // Step 4: Tilting & Immersion
  tiltSlider: document.getElementById('tilt-slider'),
  btnStartImmersion: document.getElementById('btn-start-immersion'),
  immersionTimer: document.getElementById('immersion-timer'),
  tiltMessage: document.getElementById('tilt-message'),
  kubelkaDevice: document.getElementById('kubelka-device-step4'),
  tiltWaterRect: document.getElementById('tilt-water-rect'),
  waterPhysicsStep4: document.getElementById('water-physics-step4'),
  btnSpeedImmersion: document.getElementById('btn-speed-immersion'),
  btnAutoTilt: document.getElementById('btn-auto-tilt'),

  // Step 5: Draining
  drainWaterRect: document.getElementById('drain-water-rect'),
  drainTimerVal: document.getElementById('drain-timer-val'),
  btnStartDrain: document.getElementById('btn-start-drain'),
  btnLapseDrain: document.getElementById('btn-lapse-drain'),
  magnifiedView: document.getElementById('magnified-view'),
  zoomWater: document.getElementById('zoom-water'),
  finalVolumeValue: document.getElementById('final-volume-value'),

  // Step 7: Calculations & Report
  calcM1: document.getElementById('calc-m1'),
  calcV: document.getElementById('calc-v'),
  calcDensity: document.getElementById('calc-density'),
  userQCalc: document.getElementById('user-q-calc'),
  userPCalc: document.getElementById('user-p-calc'),
  btnCheckCalc: document.getElementById('btn-check-calc'),
  btnCalcHelper: document.getElementById('btn-calc-helper'),
  solutionSteps: document.getElementById('solution-steps'),
  calcFeedback: document.getElementById('calc-feedback'),
  repLeatherType: document.getElementById('rep-leather-type'),
  repThickness: document.getElementById('rep-thickness'),
  repDryMass: document.getElementById('rep-dry-mass'),
  repEndVolume: document.getElementById('rep-end-volume'),
  repAbsorbedVolume: document.getElementById('rep-absorbed-volume'),
  repQResult: document.getElementById('rep-q-result'),
  repPResult: document.getElementById('rep-p-result'),
  reportConclusionText: document.getElementById('report-conclusion-text'),
  reportDateField: document.getElementById('report-date-field'),
  btnPrintReport: document.getElementById('btn-print-report'),
  btnRestartSim: document.getElementById('btn-restart-sim')
};

// Initialize Application
function init() {
  setStep(0);
  setupEventListeners();
  updateTelemetry();
  
  // Set report date to today
  const today = new Date();
  DOM.reportDateField.textContent = `Date: ${today.toISOString().split('T')[0]}`;
}

// Set Active Step View
function setStep(stepIndex) {
  currentStep = stepIndex;
  
  // Update instructions content
  DOM.stepTitle.textContent = currentStep === 0 ? "Specimen Selection" : `Step ${currentStep}: ${getStepTitle(currentStep)}`;
  DOM.stepInstruction.innerHTML = stepInstructions[currentStep];
  
  // Update active screen
  DOM.screens.forEach((screen, index) => {
    if (index === currentStep) {
      screen.classList.add('active');
    } else {
      screen.classList.remove('active');
    }
  });

  // Update navigation buttons
  DOM.btnPrev.disabled = currentStep === 0;
  if (currentStep === 7) {
    DOM.btnNext.textContent = calculationVerified ? "Experiment Complete ✓" : "Next Step";
    DOM.btnNext.disabled = !calculationVerified;
  } else {
    DOM.btnNext.textContent = "Next Step";
    updateNextButtonState();
  }

  // Update Progress Tracker Dots
  DOM.stepDots.forEach((dot, index) => {
    dot.className = 'step-dot';
    if (index === currentStep) {
      dot.classList.add('active');
    } else if (index < currentStep) {
      dot.classList.add('completed');
    }
  });
  
  // Update progress line width
  const progressPercent = (currentStep / (DOM.stepDots.length - 1)) * 100;
  DOM.progressLine.style.width = `${progressPercent}%`;

  // Update badge
  DOM.stepBadge.textContent = currentStep === 0 ? "Step 1 of 8: Selection" : `Step ${currentStep + 1} of 8: ${getStepTitle(currentStep)}`;

  // Re-run MathJax equations rendering if loaded
  if (window.MathJax && window.MathJax.typesetPromise) {
    window.MathJax.typesetPromise();
  }

  // Trigger step specific behaviors
  handleStepActions(currentStep);
}

function getStepTitle(step) {
  const titles = [
    "Specimen Selection",
    "Specimen Cutting",
    "Specimen Weighing",
    "Water Preparation",
    "Specimen Assembly",
    "Static Immersion",
    "Draining & Reading",
    "Observations & Calculations"
  ];
  return titles[step] || "Step";
}

function updateNextButtonState() {
  let canProceed = false;

  switch (currentStep) {
    case 0:
      canProceed = selectedLeather !== null;
      break;
    case 1:
      canProceed = isSpecimenCut;
      break;
    case 2:
      canProceed = isScaleWeighed && !isDoorOpen;
      break;
    case 3:
      canProceed = isWaterAdjusted;
      break;
    case 4:
      canProceed = isSpecimenInserted;
      break;
    case 5:
      canProceed = immersionCompleted && DOM.tiltSlider.value == 0;
      break;
    case 6:
      canProceed = drainingCompleted;
      break;
    case 7:
      canProceed = calculationVerified;
      break;
  }

  DOM.btnNext.disabled = !canProceed;
}

// Handle step-specific configurations
function handleStepActions(step) {
  switch (step) {
    case 0:
      updateLeatherColors();
      break;
    case 1:
      resetCutting();
      break;
    case 2:
      updateLeatherColors();
      resetScale();
      break;
    case 3:
      resetWaterPrep();
      break;
    case 4:
      updateLeatherColors();
      resetInsertion();
      break;
    case 5:
      updateLeatherColors();
      resetImmersion();
      break;
    case 6:
      updateLeatherColors();
      resetDraining();
      break;
    case 7:
      setupCalculationsScreen();
      break;
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Navigation
  DOM.btnPrev?.addEventListener('click', () => {
    synth.playClick();
    if (currentStep > 0) setStep(currentStep - 1);
  });
  DOM.btnNext?.addEventListener('click', () => {
    synth.playClick();
    if (currentStep < 7) setStep(currentStep + 1);
  });

  // Sound Toggle
  DOM.btnAudioToggle?.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    synth.mute = !soundEnabled;
    DOM.btnAudioToggle.textContent = soundEnabled ? "Sound: On" : "Sound: Off";
    if (soundEnabled) {
      synth.playClick();
    }
  });

  // Theme Toggle
  DOM.btnThemeToggle?.addEventListener('click', () => {
    synth.playClick();
    const isDark = document.body.classList.toggle('dark-theme');
    DOM.btnThemeToggle.textContent = isDark ? "Theme: Dark" : "Theme: Light";
  });

  // Step 0: Selection
  DOM.cardChrome?.addEventListener('click', () => {
    synth.playClick();
    selectLeather('chrome');
  });
  DOM.cardVegetable?.addEventListener('click', () => {
    synth.playClick();
    selectLeather('vegetable');
  });

  // Step 1: Cutting Specimen
  DOM.btnCutSpecimen?.addEventListener('click', performCuttingAction);
  DOM.pressCutter?.addEventListener('click', performCuttingAction);

  // Step 2: Scale weight interactions
  DOM.balanceDoor?.addEventListener('click', toggleBalanceDoor);
  DOM.btnTarePad?.addEventListener('click', tareScale);
  DOM.btnAutoWeigh?.addEventListener('click', weighLeatherAutomatically);
  
  // Drag and drop weighing
  DOM.draggableLeather?.addEventListener('dragstart', (e) => {
    if (!isDoorOpen) {
      e.preventDefault();
      alert("The draft shield is closed! Click on the sliding glass panel to open it first.");
      return;
    }
    e.dataTransfer.setData('text/plain', 'leather');
  });
  
  const balanceSvg = document.getElementById('balance-svg');
  balanceSvg?.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
  balanceSvg?.addEventListener('drop', (e) => {
    e.preventDefault();
    if (!isDoorOpen) {
      alert("The draft shield is closed! Click on the sliding glass panel to open it first.");
      return;
    }
    if (isTared && !isScaleWeighed) {
      weighLeatherAutomatically();
    } else if (!isTared) {
      alert("Please tare the balance first to zero the scale.");
    }
  });

  // Step 2: Water Pouring
  DOM.btnPourWater?.addEventListener('click', pourWaterAction);
  DOM.btnAdjustWater?.addEventListener('click', adjustWaterAction);

  // Step 3: Insertion
  DOM.insertLeather?.addEventListener('click', insertLeatherAction);

  // Step 4: Tilting & Immersion
  DOM.tiltSlider?.addEventListener('input', handleTiltingAction);
  DOM.btnStartImmersion?.addEventListener('click', startImmersionAction);
  DOM.btnAutoTilt?.addEventListener('click', () => {
    synth.playClick();
    DOM.tiltSlider.value = 90;
    handleTiltingAction();
  });
  DOM.btnSpeedImmersion?.addEventListener('click', () => {
    synth.playClick();
    if (window.immersionSpeedMultiplier === 1) {
      window.immersionSpeedMultiplier = 10;
      DOM.btnSpeedImmersion.textContent = "1x Speed";
      DOM.btnSpeedImmersion.title = "Decrease speed to 1x";
    } else {
      window.immersionSpeedMultiplier = 1;
      DOM.btnSpeedImmersion.textContent = "10x Speed";
      DOM.btnSpeedImmersion.title = "Increase speed to 10x";
    }
  });

  // Step 5: Draining
  DOM.btnStartDrain?.addEventListener('click', startDrainingAction);
  DOM.btnLapseDrain?.addEventListener('click', lapseDrainingAction);

  // Step Navigation Dots (allow navigating back to completed steps)
  DOM.stepDots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const stepIdx = parseInt(dot.getAttribute('data-step'), 10);
      if (!isNaN(stepIdx) && stepIdx <= currentStep) {
        synth.playClick();
        setStep(stepIdx);
      }
    });
  });

  // Step 6 & 7: Calculations & Solution Steps Helper
  DOM.btnCheckCalc?.addEventListener('click', verifyCalculation);
  DOM.btnCalcHelper?.addEventListener('click', () => {
    synth.playClick();
    if (!selectedLeather) {
      alert("Please select a specimen first.");
      return;
    }
    const specs = leatherSpecs[selectedLeather];
    if (DOM.solutionSteps.style.display === 'none' || !DOM.solutionSteps.style.display) {
      DOM.solutionSteps.innerHTML = `
        <div style="font-weight:700; margin-bottom: 6px; color: var(--accent-cyan);">ISO 2417 Step-by-Step Calculation:</div>
        <div><strong>1. Water Absorption by Mass (Q):</strong></div>
        <div style="padding-left: 10px; font-family: var(--font-mono); margin: 3px 0;">
          Q = (V₁ / m₁) × 100 = (${specs.absorbedVolume.toFixed(1)} / ${specs.dryMass.toFixed(3)}) × 100 = <strong>${specs.expectedQ.toFixed(2)}%</strong>
        </div>
        <div style="margin-top: 6px;"><strong>2. Specimen Dry Volume (V₀):</strong></div>
        <div style="padding-left: 10px; font-family: var(--font-mono); margin: 3px 0;">
          V₀ = m₁ / ρ = ${specs.dryMass.toFixed(3)} / ${parseFloat(specs.density).toFixed(2)} = <strong>${specs.volume.toFixed(2)} cm³</strong>
        </div>
        <div style="margin-top: 6px;"><strong>3. Water Absorption by Volume (P):</strong></div>
        <div style="padding-left: 10px; font-family: var(--font-mono); margin: 3px 0;">
          P = (V₁ / V₀) × 100 = (${specs.absorbedVolume.toFixed(1)} / ${specs.volume.toFixed(2)}) × 100 = <strong>${specs.expectedP.toFixed(2)}%</strong>
        </div>
      `;
      DOM.solutionSteps.style.display = 'block';
      DOM.btnCalcHelper.textContent = 'Hide Solution Steps';
    } else {
      DOM.solutionSteps.style.display = 'none';
      DOM.btnCalcHelper.textContent = 'Show Solution Steps';
    }
  });
  DOM.btnPrintReport?.addEventListener('click', () => {
    synth.playClick();
    window.print();
  });
  DOM.btnRestartSim?.addEventListener('click', () => {
    synth.playClick();
    resetSimulation();
  });
}

// Update Telemetry Panel
function updateTelemetry() {
  if (selectedLeather) {
    const specs = leatherSpecs[selectedLeather];
    DOM.telLeather.textContent = specs.name;
    DOM.telLeather.style.color = selectedLeather === 'chrome' ? 'var(--accent-cyan)' : 'var(--accent-amber)';
    
    if (isScaleWeighed) {
      DOM.telDryMass.textContent = `${specs.dryMass.toFixed(3)} g`;
    } else {
      DOM.telDryMass.textContent = '-- g';
    }

    if (isWaterFilled) {
      if (currentStep >= 5 && drainingCompleted) {
        DOM.telWaterLevel.textContent = `Bulb: ${specs.absorbedVolume.toFixed(1)} mL (absorbed)`;
      } else if (isWaterAdjusted) {
        DOM.telWaterLevel.textContent = 'Bulb: 0.0 mL';
      } else {
        DOM.telWaterLevel.textContent = 'Bulb: ~0.4 mL';
      }
    } else {
      DOM.telWaterLevel.textContent = '-- mL';
    }
  } else {
    DOM.telLeather.textContent = 'None';
    DOM.telLeather.style.color = 'var(--text-muted)';
    DOM.telDryMass.textContent = '-- g';
    DOM.telWaterLevel.textContent = '--';
    DOM.telTimer.textContent = '00:00';
  }
}

// Update color swatches dynamically
function updateLeatherColors() {
  if (!selectedLeather) return;
  
  const color = selectedLeather === 'chrome' ? 'var(--leather-chrome)' : 'var(--leather-veg)';
  const strokeColor = selectedLeather === 'chrome' ? '#3b5270' : '#8e623f';
  
  DOM.draggableLeather.style.backgroundColor = color;
  DOM.draggableLeather.style.borderColor = strokeColor;
  
  DOM.insertLeather.style.backgroundColor = color;
  DOM.insertLeather.style.borderColor = strokeColor;
  
  const svgEllipse = document.getElementById('svg-leather-ellipse');
  if (svgEllipse) {
    svgEllipse.setAttribute('fill', color);
    svgEllipse.setAttribute('stroke', strokeColor);
  }

  const tiltEllipse = document.getElementById('tilt-specimen-ellipse');
  if (tiltEllipse) {
    tiltEllipse.setAttribute('fill', color);
    tiltEllipse.setAttribute('stroke', strokeColor);
  }

  const drainEllipse = document.getElementById('drain-leather');
  if (drainEllipse) {
    const wetColor = selectedLeather === 'chrome' ? '#2e3d52' : '#69482f';
    const wetStroke = selectedLeather === 'chrome' ? '#1c2633' : '#452f1e';
    drainEllipse.setAttribute('fill', wetColor);
    drainEllipse.setAttribute('stroke', wetStroke);
  }

  // Update die-cutting station SVG colors
  const cuttingSheet = document.getElementById('cutting-leather-sheet');
  if (cuttingSheet) {
    const rawColor = selectedLeather === 'chrome' ? '#577399' : '#bd8a60';
    const rawStroke = selectedLeather === 'chrome' ? '#334155' : '#78350f';
    cuttingSheet.setAttribute('fill', rawColor);
    cuttingSheet.setAttribute('stroke', rawStroke);
    cuttingSheet.style.backgroundColor = rawColor;
  }
  const discCircle = document.getElementById('specimen-disc-circle');
  if (discCircle) {
    const rawColor = selectedLeather === 'chrome' ? '#577399' : '#bd8a60';
    discCircle.setAttribute('fill', rawColor);
  }
}

/* ========================================================
   STEP 0: Welcome & Selection Logic
   ======================================================== */
function selectLeather(type) {
  selectedLeather = type;
  
  DOM.cardChrome.classList.remove('selected');
  DOM.cardVegetable.classList.remove('selected');
  
  if (type === 'chrome') {
    DOM.cardChrome.classList.add('selected');
  } else {
    DOM.cardVegetable.classList.add('selected');
  }

  // Set the placed SVG specimen color to match
  const placedSpecimen = document.getElementById('svg-placed-specimen');
  if (placedSpecimen) {
    placedSpecimen.setAttribute('fill', type === 'chrome' ? '#577399' : '#bd8a60');
    placedSpecimen.setAttribute('stroke', type === 'chrome' ? '#334155' : '#78350f');
  }
  
  updateTelemetry();
  updateNextButtonState();
}

/* ========================================================
   STEP 1: Specimen Cutting Logic (ISO 2417 Press Cutter)
   ======================================================== */
function resetCutting() {
  isSpecimenCut = false;
  if (DOM.btnCutSpecimen) DOM.btnCutSpecimen.disabled = false;
  
  if (DOM.pressCutter) {
    DOM.pressCutter.style.transition = "none";
    DOM.pressCutter.style.transform = "none";
    DOM.pressCutter.style.opacity = "1";
    DOM.pressCutter.classList.remove('pressing', 'pressed');
  }
  
  const cutterPrompt = document.getElementById('cutter-prompt-pill');
  if (cutterPrompt) cutterPrompt.style.display = 'block';

  const targetLine = document.getElementById('cutting-die-target');
  if (targetLine) targetLine.style.display = 'block';

  const targetText = document.getElementById('target-guideline-text');
  if (targetText) targetText.style.display = 'block';

  const aperture = document.getElementById('cutting-die-aperture');
  if (aperture) aperture.style.display = 'none';

  const disc = document.getElementById('cutting-die-disc');
  if (disc) {
    disc.style.display = 'none';
    disc.style.transform = 'none';
    disc.style.transition = 'none';
  }

  const badge = document.getElementById('specimen-cut-badge');
  if (badge) badge.style.display = 'none';
  
  if (DOM.cuttingStatus) {
    DOM.cuttingStatus.textContent = "Click 'Press Cutter' (or click the die tool) to stamp out the circular specimen.";
    DOM.cuttingStatus.style.color = "#475569";
  }
  
  updateLeatherColors();
}

function performCuttingAction() {
  if (isSpecimenCut) return;
  isSpecimenCut = true;
  
  if (DOM.btnCutSpecimen) DOM.btnCutSpecimen.disabled = true;
  
  const cutter = DOM.pressCutter;
  const promptPill = document.getElementById('cutter-prompt-pill');
  if (promptPill) promptPill.style.display = 'none';
  
  if (DOM.cuttingStatus) {
    DOM.cuttingStatus.textContent = "Pressing die cutter into leather sheet...";
    DOM.cuttingStatus.style.color = "#0064c8";
  }

  // Phase 1: Die cutter descends firmly onto leather sheet (400ms)
  if (cutter) {
    cutter.style.transition = "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
    cutter.style.transform = "translateY(70px)";
  }

  // Phase 2: Impact at 400ms
  setTimeout(() => {
    // Sound: Heavy punch thump + metallic blade strike
    synth.playBeep(90, 0.22, 0.2);
    setTimeout(() => {
      synth.playBeep(850, 0.08, 0.05);
    }, 40);

    // Cutting board impact vibration
    const stage = document.getElementById('cutting-board-stage');
    if (stage) {
      stage.classList.add('stamping-impact');
      setTimeout(() => stage.classList.remove('stamping-impact'), 200);
    }

    // Hide guideline
    const targetLine = document.getElementById('cutting-die-target');
    if (targetLine) targetLine.style.display = 'none';
    const targetText = document.getElementById('target-guideline-text');
    if (targetText) targetText.style.display = 'none';

    // Show cut aperture (hollow hole in leather)
    const aperture = document.getElementById('cutting-die-aperture');
    if (aperture) aperture.style.display = 'block';

    // Show stamped circular disc
    const disc = document.getElementById('cutting-die-disc');
    if (disc) {
      disc.style.display = 'block';
      disc.style.transform = 'none';
    }

    // Phase 3: Die retracts back up after cut (600ms retraction)
    setTimeout(() => {
      if (cutter) {
        cutter.style.transition = "transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)";
        cutter.style.transform = "translateY(-30px)";
      }

      // Phase 4: Specimen disc separates and elevates with dimension callout
      setTimeout(() => {
        if (disc) {
          disc.style.transition = "transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)";
          disc.style.transform = "translateY(-16px)";
        }

        const badge = document.getElementById('specimen-cut-badge');
        if (badge) badge.style.display = 'block';

        if (DOM.cuttingStatus) {
          DOM.cuttingStatus.innerHTML = "<strong style='color:#059669;'>✓ Specimen successfully cut to standard Ø 70.0 mm!</strong> Click <em>Next Step</em> to proceed.";
        }

        updateTelemetry();
        updateNextButtonState();
      }, 300);
    }, 250);
  }, 400);
}

/* ========================================================
   STEP 2: Weighing Logic
   ======================================================== */
function resetScale() {
  isDoorOpen = false;
  isTared = false;
  isScaleWeighed = false;
  DOM.balanceWeight.textContent = "unstable";
  DOM.balanceWeight.style.color = "var(--accent-rose)";
  DOM.btnAutoWeigh.disabled = true;
  DOM.draggableLeather.style.transform = "none";
  DOM.draggableLeather.style.opacity = "1";
  DOM.draggableLeather.classList.remove('placed');
  
  // Hide placed specimen inside scale
  const placedSpecimen = document.getElementById('svg-placed-specimen');
  if (placedSpecimen) {
    placedSpecimen.style.display = 'none';
  }
  
  DOM.balanceDoor.setAttribute('transform', 'translateY(0)');
  DOM.doorStatusIndicator.innerHTML = 'Shield: <span class="state-closed">Closed</span>';
  
  setTimeout(() => {
    DOM.balanceWeight.textContent = "1.842 g";
    DOM.balanceWeight.style.color = "var(--accent-cyan)";
    DOM.btnAutoWeigh.disabled = false;
  }, 1000);
}

function toggleBalanceDoor() {
  synth.playDoor();
  isDoorOpen = !isDoorOpen;
  
  if (isDoorOpen) {
    DOM.balanceDoor.setAttribute('transform', 'translateY(-120)');
    DOM.doorStatusIndicator.innerHTML = 'Shield: <span class="state-open" style="color: var(--accent-cyan);">Open</span>';
  } else {
    DOM.balanceDoor.setAttribute('transform', 'translateY(0)');
    DOM.doorStatusIndicator.innerHTML = 'Shield: <span class="state-closed">Closed</span>';
    
    // If specimen is placed and door is closed, stabilize weight
    if (isScaleWeighed) {
      stabilizeWeightReading();
    }
  }
  updateNextButtonState();
}

function tareScale() {
  if (!isDoorOpen) {
    alert("Please open the glass draft shield first to tare the balance.");
    return;
  }
  synth.playBeep(880, 0.12);
  isTared = true;
  DOM.balanceWeight.textContent = "0.000 g";
  DOM.balanceWeight.style.color = "var(--accent-teal)";
  DOM.btnAutoWeigh.disabled = false;
  
  DOM.draggableLeather.style.boxShadow = "0 0 15px var(--accent-cyan)";
}

function weighLeatherAutomatically() {
  if (!isDoorOpen) {
    alert("Open the glass door/draft shield first to access the pan!");
    return;
  }
  if (!isTared) {
    alert("Tare the balance first to zero the scale!");
    return;
  }
  if (!selectedLeather) return;
  
  isScaleWeighed = true;
  DOM.btnAutoWeigh.disabled = true;
  synth.playClick();
  
  // Drop specimen visual animation: HTML specimen flies to the balance and fades out
  DOM.draggableLeather.style.transition = "all 0.8s cubic-bezier(0.25, 1, 0.5, 1)";
  DOM.draggableLeather.style.transform = "scale(0.35) translate(300px, 120px)";
  DOM.draggableLeather.style.opacity = "0";
  DOM.draggableLeather.classList.add('placed');
  
  // Show the realistic SVG specimen placed exactly on the balance pan
  setTimeout(() => {
    const placedSpecimen = document.getElementById('svg-placed-specimen');
    if (placedSpecimen) {
      placedSpecimen.style.display = 'block';
    }
  }, 700);
  
  // Display reading with fluctuations (door is open)
  simulateFluctuatingWeight();
}

let scaleJitterInterval = null;

function simulateFluctuatingWeight() {
  const targetWeight = leatherSpecs[selectedLeather].dryMass;
  
  scaleJitterInterval = setInterval(() => {
    // Large fluctuation because draft shield is open
    const jitter = (Math.random() - 0.5) * 0.15;
    const tempVal = targetWeight + jitter;
    DOM.balanceWeight.textContent = `${tempVal.toFixed(3)} g`;
    DOM.balanceWeight.style.color = "var(--accent-rose)";
  }, 120);

  // Instruct user to close shield
  DOM.doorStatusIndicator.innerHTML = 'Shield: <span class="state-open" style="color: var(--accent-cyan);">Open (Fluctuating)</span>';
}

function stabilizeWeightReading() {
  if (scaleJitterInterval) {
    clearInterval(scaleJitterInterval);
    scaleJitterInterval = null;
  }
  
  const targetWeight = leatherSpecs[selectedLeather].dryMass;
  let val = parseFloat(DOM.balanceWeight.textContent);
  
  // Clean count down to exact target
  const steps = 8;
  let step = 0;
  
  const stabInterval = setInterval(() => {
    step++;
    const fraction = step / steps;
    const current = val + (targetWeight - val) * fraction;
    DOM.balanceWeight.textContent = `${current.toFixed(3)} g`;
    DOM.balanceWeight.style.color = "var(--accent-rose)";
    
    if (step === steps) {
      clearInterval(stabInterval);
      DOM.balanceWeight.style.color = "var(--accent-teal)";
      DOM.balanceWeight.textContent = `${targetWeight.toFixed(3)} g`;
      synth.playDoubleBeep();
      updateTelemetry();
      updateNextButtonState();
    }
  }, 100);
}

/* ========================================================
   STEP 2: Water Preparation Logic
   ======================================================== */
function resetWaterPrep() {
  isWaterFilled = false;
  isWaterAdjusted = false;
  
  DOM.btnPourWater.disabled = false;
  DOM.btnAdjustWater.style.display = "none";
  
  DOM.beakerContainer.style.transform = "none";
  DOM.beakerContainer.style.opacity = "1";
  DOM.pourStream.className = "pour-stream-hidden";
  DOM.prepWater.setAttribute('fill', 'rgba(56, 189, 248, 0)');
  DOM.prepWater.setAttribute('d', 'M 94,328 L 94,328 A 17,17 0 1,0 106,328 L 106,328 Z');
  document.getElementById('beaker-water').setAttribute('d', 'M32,60 L32,162 Q32,168 40,168 L110,168 Q118,168 118,162 L118,60 Z');
}

function pourWaterAction() {
  DOM.btnPourWater.disabled = true;
  synth.playClick();
  
  // Beaker tilt
  DOM.beakerContainer.classList.add('beaker-pouring');
  
  setTimeout(() => {
    DOM.pourStream.className = "pour-stream-visible";
    synth.playPour(2.2);
    
    // Lower water inside beaker
    document.getElementById('beaker-water').setAttribute('d', 'M32,135 L32,162 Q32,168 40,168 L110,168 Q118,168 118,162 L118,135 Z');
    
    // Set water fill visible and overshoot slightly above 0 mark (y=165)
    DOM.prepWater.setAttribute('fill', 'rgba(56, 189, 248, 0.45)');
    DOM.prepWater.setAttribute('y', '110');
    
    setTimeout(() => {
      DOM.pourStream.className = "pour-stream-hidden";
      DOM.beakerContainer.classList.remove('beaker-pouring');
      DOM.beakerContainer.style.opacity = "0.4";
      
      isWaterFilled = true;
      updateTelemetry();
      
      DOM.btnAdjustWater.style.display = "inline-flex";
      DOM.btnAdjustWater.disabled = false;
    }, 2200);
  }, 1000);
}

function adjustWaterAction() {
  DOM.btnAdjustWater.disabled = true;
  synth.playClick();
  
  // Fine tune adjustment (pipette draw back to 0.0 mL / y=165)
  synth.playBeep(900, 0.4, 0.05);
  
  DOM.prepWater.style.transition = "y 1s ease";
  DOM.prepWater.setAttribute('y', '165');
  
  setTimeout(() => {
    isWaterAdjusted = true;
    synth.playBeep(1000, 0.15, 0.05);
    updateTelemetry();
    updateNextButtonState();
  }, 1000);
}

/* ========================================================
   STEP 3: Specimen Insertion Logic
   ======================================================== */
function resetInsertion() {
  isSpecimenInserted = false;
  DOM.insertedLeatherSvg.style.opacity = "0";
  DOM.insertedLeatherSvg.style.transform = "translateY(-60px)";
  DOM.insertLeather.style.opacity = "1";
  DOM.insertLeather.style.transform = "none";
}

function insertLeatherAction() {
  if (isSpecimenInserted) return;
  isSpecimenInserted = true;
  synth.playClick();
  
  DOM.insertLeather.style.transition = "all 0.8s ease-in-out";
  DOM.insertLeather.style.transform = "scale(0.5) translate(200px, -100px)";
  DOM.insertLeather.style.opacity = "0";
  
  setTimeout(() => {
    DOM.insertedLeatherSvg.style.opacity = "1";
    DOM.insertedLeatherSvg.style.transform = "translateY(0)";
    
    synth.playDoor(); // Rubber stopper slide sound
    
    setTimeout(() => {
      updateNextButtonState();
    }, 800);
  }, 400);
}

/* ========================================================
   STEP 4: Tilting & Immersion Logic
   ======================================================== */
function resetImmersion() {
  isTilted = false;
  immersionStarted = false;
  immersionCompleted = false;
  window.immersionSpeedMultiplier = 1;
  if (window.immersionTimerInterval) {
    clearInterval(window.immersionTimerInterval);
  }
  
  DOM.tiltSlider.value = 0;
  DOM.tiltSlider.disabled = false;
  DOM.btnStartImmersion.disabled = true;
  DOM.btnStartImmersion.style.display = 'inline-block';
  if (DOM.btnSpeedImmersion) {
    DOM.btnSpeedImmersion.style.display = 'none';
    DOM.btnSpeedImmersion.disabled = true;
    DOM.btnSpeedImmersion.textContent = "10x Speed";
    DOM.btnSpeedImmersion.title = "Increase speed to 10x";
  }
  DOM.immersionTimer.textContent = "30:00";
  DOM.immersionTimer.className = "timer-display";
  DOM.telTimer.textContent = "00:00";
  DOM.tiltMessage.textContent = "Tilt the apparatus to 90 degrees to submerge the leather in water.";
  
  if (DOM.kubelkaDevice) {
    DOM.kubelkaDevice.setAttribute('transform', 'rotate(-90, 220, 150)');
  }
  setWaterLevelsForTilt(0);
}

function handleTiltingAction() {
  const angle = parseInt(DOM.tiltSlider.value);
  const svgAngle = angle - 90;
  
  if (DOM.kubelkaDevice) {
    DOM.kubelkaDevice.setAttribute('transform', `rotate(${svgAngle}, 220, 150)`);
  }
  
  setWaterLevelsForTilt(angle);
  
  if (angle >= 88) {
    isTilted = true;
    DOM.tiltMessage.textContent = "Perfect! The leather specimen is fully submerged. Click 'Start Immersion' to begin.";
    if (!immersionStarted && !immersionCompleted) {
      DOM.btnStartImmersion.disabled = false;
    }
  } else {
    isTilted = false;
    DOM.btnStartImmersion.disabled = true;
    DOM.tiltMessage.textContent = "Keep tilting. Reach 90 degrees to submerge the specimen.";
  }
  updateNextButtonState();
}

function setWaterLevelsForTilt(angle) {
  const percent = angle / 90;
  const svgAngle = angle - 90;
  
  // Counter-rotate the water physics group to keep water horizontal
  if (DOM.waterPhysicsStep4) {
    DOM.waterPhysicsStep4.setAttribute('transform', `rotate(${-svgAngle}, 220, 150)`);
  }
  
  // Interpolate water level (y) from 125 (filling state) to 200 (immersion state)
  const waterY = 165 + (percent * 20);
  if (DOM.tiltWaterRect) {
    DOM.tiltWaterRect.setAttribute('y', waterY);
  }
}

function startImmersionAction() {
  immersionStarted = true;
  DOM.btnStartImmersion.style.display = 'none';
  if (DOM.btnSpeedImmersion) {
    DOM.btnSpeedImmersion.style.display = 'inline-block';
    DOM.btnSpeedImmersion.disabled = false;
    DOM.btnSpeedImmersion.textContent = "10x Speed";
    DOM.btnSpeedImmersion.title = "Increase speed to 10x";
  }
  DOM.tiltSlider.disabled = true;
  DOM.immersionTimer.className = "timer-display running";
  synth.playClick();
  
  let totalSeconds = 30 * 60; // 1800 simulated seconds
  window.immersionSpeedMultiplier = 1;
  
  window.immersionTimerInterval = setInterval(() => {
    totalSeconds -= window.immersionSpeedMultiplier;
    
    if (totalSeconds <= 0) {
      totalSeconds = 0;
      clearInterval(window.immersionTimerInterval);
      immersionCompleted = true;
      DOM.immersionTimer.textContent = "00:00";
      DOM.immersionTimer.className = "timer-display";
      DOM.telTimer.textContent = "30:00";
      DOM.tiltSlider.disabled = false;
      if (DOM.btnSpeedImmersion) DOM.btnSpeedImmersion.style.display = 'none';
      
      synth.playDoubleBeep();
      DOM.tiltMessage.textContent = "Immersion finished! Please tilt the apparatus back to 0 degrees (vertical) to drain the water.";
      updateNextButtonState();
      return;
    }
    
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    const minStr = minutes < 10 ? `0${minutes}` : minutes;
    const secStr = seconds < 10 ? `0${seconds}` : seconds;
    DOM.immersionTimer.textContent = `${minStr}:${secStr}`;
    
    const elapsedTotal = 1800 - totalSeconds;
    const elapsedMin = Math.floor(elapsedTotal / 60);
    const elapsedSec = elapsedTotal % 60;
    const elMinStr = elapsedMin < 10 ? `0${elapsedMin}` : elapsedMin;
    const elSecStr = elapsedSec < 10 ? `0${elapsedSec}` : elapsedSec;
    DOM.telTimer.textContent = `${elMinStr}:${elSecStr}`;
    
    // Play light ticking sound every 5 simulated minutes
    if (minutes % 5 === 0 && seconds === 0) {
      synth.playBeep(900, 0.05, 0.02);
    }
  }, 100);
}

/* ========================================================
   STEP 5: Draining & Final Reading Logic
   ======================================================== */
function resetDraining() {
  drainingStarted = false;
  drainingCompleted = false;
  
  DOM.btnStartDrain.disabled = false;
  DOM.drainTimerVal.textContent = "60s";
  DOM.drainTimerVal.className = "timer-display miniature";
  DOM.magnifiedView.style.opacity = "0.3";
  DOM.finalVolumeValue.textContent = "-- mL";
  
  if (DOM.drainWaterRect) {
    DOM.drainWaterRect.setAttribute('y', '125');
  }
}

function startDrainingAction() {
  drainingStarted = true;
  DOM.btnStartDrain.style.display = 'none';
  if (DOM.btnLapseDrain) DOM.btnLapseDrain.style.display = 'inline-block';
  DOM.drainTimerVal.className = "timer-display miniature running";
  synth.playClick();
  
  window.drainCountdown = 60;
  const specs = leatherSpecs[selectedLeather];
  const absorbed = specs.absorbedVolume;
  
  window.targetMeniscusY = 30 + (absorbed * 30);
  
  synth.playPour(2.0);

  window.drainTimerInterval = setInterval(() => {
    window.drainCountdown--;
    DOM.drainTimerVal.textContent = `${window.drainCountdown}s`;
    
    const progress = (60 - window.drainCountdown) / 60;
    const targetY = 165 + (absorbed * 5); 
    const currentY = 185 + (progress * (targetY - 185)); 
    
    if (DOM.drainWaterRect) {
      DOM.drainWaterRect.setAttribute('y', currentY);
    }
    
    if (window.drainCountdown <= 0) {
      completeDraining();
    }
  }, 25);
}

function completeDraining() {
  clearInterval(window.drainTimerInterval);
  drainingCompleted = true;
  DOM.drainTimerVal.className = "timer-display miniature";
  DOM.drainTimerVal.textContent = "Finished";
  if (DOM.btnLapseDrain) DOM.btnLapseDrain.style.display = 'none';
  
  const specs = leatherSpecs[selectedLeather];
  const absorbed = specs.absorbedVolume;
  const targetY = 165 + (absorbed * 5);
  
  if (DOM.drainWaterRect) {
    DOM.drainWaterRect.setAttribute('y', targetY);
  }
  
  synth.playDoubleBeep();
  
  DOM.magnifiedView.style.opacity = "1";
  DOM.magnifiedView.style.transform = "scale(1.02)";
  setTimeout(() => DOM.magnifiedView.style.transform = "none", 300);
  
  DOM.zoomWater.style.transition = "d 1.5s cubic-bezier(0.25, 0.8, 0.25, 1)";
  DOM.zoomWater.setAttribute('d', `M 25,230 L 25,${window.targetMeniscusY} Q 50,${window.targetMeniscusY + 3} 75,${window.targetMeniscusY} L 75,230 Z`);
  
  setTimeout(() => {
    DOM.finalVolumeValue.textContent = `${absorbed.toFixed(1)} mL`;
    updateTelemetry();
    updateNextButtonState();
  }, 1500);
}

function lapseDrainingAction() {
  if (window.drainCountdown > 0) {
    synth.playClick();
    window.drainCountdown = 0;
    completeDraining();
  }
}

/* ========================================================
   STEP 6 & 7: Calculations & Virtual Report Logic
   ======================================================== */
function setupCalculationsScreen() {
  if (!selectedLeather) return;
  const specs = leatherSpecs[selectedLeather];
  DOM.calcM1.value = specs.dryMass.toFixed(3);
  DOM.calcV.value = specs.absorbedVolume.toFixed(1);
  DOM.calcV0.value = specs.volume.toFixed(2);
  DOM.calcDensity.value = parseFloat(specs.density).toFixed(2);
  DOM.userQCalc.value = '';
  DOM.userPCalc.value = '';
  DOM.userQCalc.disabled = false;
  DOM.userPCalc.disabled = false;
  DOM.btnCheckCalc.disabled = false;
  DOM.calcFeedback.textContent = '';
  DOM.calcFeedback.className = 'feedback-msg';
  if (DOM.solutionSteps) {
    DOM.solutionSteps.style.display = 'none';
  }
  if (DOM.btnCalcHelper) {
    DOM.btnCalcHelper.textContent = 'Show Solution Steps';
  }
  calculationVerified = false;
  
  DOM.screens[7].querySelector('#virtual-report').style.display = 'none';
}

function verifyCalculation() {
  synth.playClick();
  if (!selectedLeather) return;
  const specs = leatherSpecs[selectedLeather];
  const userQ = parseFloat(DOM.userQCalc.value);
  const userP = parseFloat(DOM.userPCalc.value);
  
  if (isNaN(userQ) || isNaN(userP)) {
    DOM.calcFeedback.textContent = "Please enter valid numeric values for both Q and P.";
    DOM.calcFeedback.className = "feedback-msg error";
    synth.playBeep(400, 0.3, 0.1);
    return;
  }
  
  const diffQ = Math.abs(userQ - specs.expectedQ);
  const diffP = Math.abs(userP - specs.expectedP);
  if (diffQ < 0.15 && diffP < 0.15) {
    calculationVerified = true;
    DOM.calcFeedback.textContent = "✓ Calculations verified! Official ISO 2417 Certificate Report generated.";
    DOM.calcFeedback.className = "feedback-msg success";
    DOM.userQCalc.disabled = true;
    DOM.userPCalc.disabled = true;
    DOM.btnCheckCalc.disabled = true;
    DOM.btnNext.textContent = "Experiment Complete ✓";
    DOM.btnNext.disabled = true;
    
    synth.playDoubleBeep();
    generateLabReport();
  } else {
    let hint = "";
    if (diffQ >= 0.15 && diffP >= 0.15) {
      hint = `Both values differ from expected. Expected Q ≈ ${specs.expectedQ.toFixed(2)}%, P ≈ ${specs.expectedP.toFixed(2)}%.`;
    } else if (diffQ >= 0.15) {
      hint = `Q is incorrect. Formula: Q = (V₁ / m₁) × 100 = (${specs.absorbedVolume} / ${specs.dryMass}) × 100 ≈ ${specs.expectedQ.toFixed(2)}%.`;
    } else {
      hint = `P is incorrect. Formula: P = (V₁ / V₀) × 100 = (${specs.absorbedVolume} / ${specs.volume.toFixed(2)}) × 100 ≈ ${specs.expectedP.toFixed(2)}%.`;
    }
    DOM.calcFeedback.textContent = `Verification check: ${hint}`;
    DOM.calcFeedback.className = "feedback-msg error";
    synth.playBeep(330, 0.3, 0.1);
  }
}

function generateLabReport() {
  const specs = leatherSpecs[selectedLeather];
  
  DOM.repLeatherType.textContent = specs.name;
  DOM.repThickness.textContent = specs.thickness;
  DOM.repDryMass.textContent = `${specs.dryMass.toFixed(3)} g`;
  DOM.repEndVolume.textContent = `${(75 - specs.absorbedVolume).toFixed(1)} mL`;
  DOM.repAbsorbedVolume.textContent = `${specs.absorbedVolume.toFixed(1)} mL`;
  DOM.repQResult.innerHTML = `<strong>${specs.expectedQ.toFixed(2)} %</strong>`;
  DOM.repPResult.innerHTML = `<strong>${specs.expectedP.toFixed(2)} %</strong>`;
  DOM.reportConclusionText.textContent = specs.conclusion;
  
  const report = DOM.screens[7].querySelector('#virtual-report');
  report.style.display = 'block';
  report.style.animation = 'slideUpFade 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards';
}

function resetSimulation() {
  selectedLeather = null;
  isSpecimenCut = false;
  isDoorOpen = false;
  isTared = false;
  isScaleWeighed = false;
  isWaterFilled = false;
  isWaterAdjusted = false;
  isSpecimenInserted = false;
  isTilted = false;
  immersionStarted = false;
  immersionCompleted = false;
  drainingStarted = false;
  drainingCompleted = false;
  calculationVerified = false;
  
  DOM.cardChrome.classList.remove('selected');
  DOM.cardVegetable.classList.remove('selected');
  
  DOM.screens[7].querySelector('#virtual-report').style.display = 'none';
  
  setStep(0);
  updateTelemetry();
}

// Start simulation on load
window?.addEventListener('DOMContentLoaded', init);
