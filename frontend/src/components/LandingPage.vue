<script setup>
const emit = defineEmits(['start'])

const GITHUB_REPO = 'https://github.com/karibs/understand_codebase_seconds'

function downloadBackend() {
  window.open(`${GITHUB_REPO}/archive/refs/heads/main.zip`, '_blank')
}
</script>

<template>
  <div class="landing">
    <!-- Header -->
    <header class="landing-header">
      <div class="landing-inner">
        <h1 class="landing-logo">
          <span class="logo-mark">A</span>
          Architect
        </h1>
        <button class="header-cta" @click="emit('start')">Get Started</button>
      </div>
    </header>

    <!-- Hero -->
    <section class="hero">
      <div class="hero-badge">Project Analyzer</div>
      <h2 class="hero-title">
        Understand your codebase<br>
        <span class="hero-gradient">in seconds</span>
      </h2>
      <p class="hero-subtitle">
        Detect frameworks, visualize project structure as an interactive graph,
        and preview source files — all from your browser.
      </p>
      <div class="hero-actions">
        <button class="btn-start" @click="emit('start')">
          Start Analyzing
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </button>
        <button class="btn-download" @click="downloadBackend">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download Backend
        </button>
      </div>
    </section>

    <!-- Ad Slot #1 -->
    <div class="ad-slot">
      <!-- Google AdSense -->
    </div>

    <!-- Feature Cards -->
    <section class="features">
      <div class="feature-card">
        <div class="feature-icon icon-blue">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>
        <h3 class="feature-title">Structure Analysis</h3>
        <p class="feature-desc">
          Automatically detect frameworks, languages, and project architecture from the file tree.
        </p>
      </div>
      <div class="feature-card">
        <div class="feature-icon icon-violet">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><path d="M11 18H8a2 2 0 0 1-2-2V9"/></svg>
        </div>
        <h3 class="feature-title">Graph Visualization</h3>
        <p class="feature-desc">
          See your entire project as an interactive node graph with file relationships and dependencies.
        </p>
      </div>
      <div class="feature-card">
        <div class="feature-icon icon-orange">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
        </div>
        <h3 class="feature-title">Code Preview</h3>
        <p class="feature-desc">
          Click any file node to preview source code with syntax highlighting and line numbers.
        </p>
      </div>
    </section>

    <!-- How It Works -->
    <section class="how-it-works">
      <h2 class="section-title">How It Works</h2>
      <div class="steps">
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-body">
            <h4 class="step-title">Download &amp; Run Backend</h4>
            <p class="step-desc">
              Download the Python backend, install dependencies with pip, and start the local server.
            </p>
          </div>
        </div>
        <div class="step-connector"></div>
        <div class="step">
          <div class="step-number">2</div>
          <div class="step-body">
            <h4 class="step-title">Enter Project Path</h4>
            <p class="step-desc">
              Provide the path to any local project folder you want to analyze.
            </p>
          </div>
        </div>
        <div class="step-connector"></div>
        <div class="step">
          <div class="step-number">3</div>
          <div class="step-body">
            <h4 class="step-title">Explore the Graph</h4>
            <p class="step-desc">
              Browse the interactive workflow graph, inspect files, and understand your codebase.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Ad Slot #2 -->
    <div class="ad-slot">
      <!-- Google AdSense -->
    </div>

    <!-- Footer -->
    <footer class="landing-footer">
      <p>&copy; 2026 Architect &mdash; Project Analyzer</p>
    </footer>
  </div>
</template>

<style scoped>
.landing {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #FAFBFF;
  color: #1a1a2e;
}

/* ---------- Header ---------- */
.landing-header {
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 10;
}

.landing-inner {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.landing-logo {
  font-size: 1.35rem;
  font-weight: 800;
  color: #1a1a2e;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  letter-spacing: -0.01em;
}

.logo-mark {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  color: #fff;
  font-size: 1.1rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.header-cta {
  padding: 0.5rem 1.25rem;
  background: #1a1a2e;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.header-cta:hover {
  background: #2d2d4e;
}

/* ---------- Hero ---------- */
.hero {
  max-width: 960px;
  width: 100%;
  margin: 0 auto;
  padding: 6rem 2rem 4rem;
  text-align: center;
}

.hero-badge {
  display: inline-block;
  padding: 0.35rem 1rem;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
  color: #6366F1;
  font-size: 0.8125rem;
  font-weight: 700;
  border-radius: 20px;
  border: 1px solid rgba(99, 102, 241, 0.2);
  margin-bottom: 1.5rem;
  letter-spacing: 0.02em;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.15;
  color: #1a1a2e;
  margin-bottom: 1.25rem;
  letter-spacing: -0.03em;
}

.hero-gradient {
  background: linear-gradient(135deg, #6366F1, #EC4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.15rem;
  color: #64748B;
  max-width: 560px;
  margin: 0 auto 2.5rem;
  line-height: 1.75;
}

.hero-actions {
  display: flex;
  gap: 0.875rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-start {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  font-size: 0.9375rem;
  font-weight: 700;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  color: #fff;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.35);
  transition: transform 0.15s, box-shadow 0.15s;
}

.btn-start:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 28px rgba(99, 102, 241, 0.45);
}

.btn-download {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  font-size: 0.9375rem;
  font-weight: 600;
  border: 1.5px solid #E2E8F0;
  border-radius: 12px;
  cursor: pointer;
  background: #fff;
  color: #334155;
  transition: border-color 0.2s, background 0.2s;
}

.btn-download:hover {
  border-color: #6366F1;
  background: #F8F7FF;
}

/* ---------- Ad Slots ---------- */
.ad-slot {
  max-width: 960px;
  width: 100%;
  margin: 1.5rem auto;
  padding: 0 2rem;
}

.ad-slot::before {
  content: '';
  display: block;
  min-height: 90px;
  border: 1.5px dashed #E2E8F0;
  border-radius: 12px;
  background: #fff;
}

/* ---------- Feature Cards ---------- */
.features {
  max-width: 960px;
  margin: 1rem auto;
  padding: 2rem;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}

.feature-card {
  background: #fff;
  border: 1px solid #F1F5F9;
  border-radius: 16px;
  padding: 2rem 1.5rem;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s, box-shadow 0.2s;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
}

.feature-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
}

.icon-blue {
  background: linear-gradient(135deg, #DBEAFE, #EFF6FF);
  color: #3B82F6;
}

.icon-violet {
  background: linear-gradient(135deg, #EDE9FE, #F5F3FF);
  color: #8B5CF6;
}

.icon-orange {
  background: linear-gradient(135deg, #FFEDD5, #FFF7ED);
  color: #F97316;
}

.feature-title {
  font-size: 1.0625rem;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 0.5rem;
}

.feature-desc {
  font-size: 0.875rem;
  color: #64748B;
  line-height: 1.65;
}

/* ---------- How It Works ---------- */
.how-it-works {
  max-width: 960px;
  margin: 2rem auto;
  padding: 3rem 2rem;
}

.section-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #1a1a2e;
  text-align: center;
  margin-bottom: 3rem;
  letter-spacing: -0.02em;
}

.steps {
  display: flex;
  align-items: flex-start;
  gap: 0;
}

.step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.step-connector {
  width: 60px;
  flex-shrink: 0;
  border-top: 2px dashed #CBD5E1;
  margin-top: 22px;
}

.step-number {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  color: #fff;
  font-size: 1.125rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
}

.step-body {
  max-width: 220px;
}

.step-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 0.375rem;
}

.step-desc {
  font-size: 0.8125rem;
  color: #64748B;
  line-height: 1.6;
}

/* ---------- Footer ---------- */
.landing-footer {
  margin-top: auto;
  padding: 2rem;
  text-align: center;
  color: #94A3B8;
  font-size: 0.8125rem;
  border-top: 1px solid #F1F5F9;
}

/* ---------- Responsive ---------- */
@media (max-width: 768px) {
  .hero {
    padding: 4rem 1.5rem 3rem;
  }

  .hero-title {
    font-size: 2.25rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .hero-actions {
    flex-direction: column;
    align-items: center;
  }

  .features {
    grid-template-columns: 1fr;
    padding: 1.5rem;
  }

  .steps {
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }

  .step-connector {
    width: 2px;
    height: 32px;
    border-top: none;
    border-left: 2px dashed #CBD5E1;
    margin-top: 0;
  }
}
</style>
