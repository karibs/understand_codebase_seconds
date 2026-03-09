<script setup>
import { ref } from 'vue'

const emit = defineEmits(['start'])

const basePath = import.meta.env.BASE_URL || '/'
const showModal = ref(false)

function openDownloadModal() {
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

function confirmDownload() {
  showModal.value = false
  window.location.href = `${basePath}architect-backend.zip`
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
        <div class="download-group">
          <button class="btn-download" @click="openDownloadModal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download Backend
          </button>
          <div class="download-callout">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            Download &amp; run this first — required to scan your local files
          </div>
        </div>
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

    <!-- Supported Technologies -->
    <section class="tech-section" id="technologies">
      <h2 class="section-title">Supported Technologies</h2>
      <p class="section-desc">
        Architect automatically detects the frameworks and languages in your project.
        No configuration needed — just point it at a folder.
      </p>
      <div class="tech-grid">
        <span class="tech-badge">JavaScript</span>
        <span class="tech-badge">TypeScript</span>
        <span class="tech-badge">Python</span>
        <span class="tech-badge">Vue.js</span>
        <span class="tech-badge">React</span>
        <span class="tech-badge">Angular</span>
        <span class="tech-badge">Node.js</span>
        <span class="tech-badge">Flask</span>
        <span class="tech-badge">FastAPI</span>
        <span class="tech-badge">Django</span>
        <span class="tech-badge">Next.js</span>
        <span class="tech-badge">Nuxt.js</span>
        <span class="tech-badge">Go</span>
        <span class="tech-badge">Rust</span>
        <span class="tech-badge">Java</span>
        <span class="tech-badge">C#</span>
        <span class="tech-badge">Ruby</span>
        <span class="tech-badge">PHP</span>
        <span class="tech-badge">Swift</span>
        <span class="tech-badge">Kotlin</span>
        <span class="tech-badge">Dart / Flutter</span>
        <span class="tech-badge">C / C++</span>
      </div>
    </section>

    <!-- Use Cases -->
    <section class="usecases-section" id="use-cases">
      <h2 class="section-title">Who Uses Architect?</h2>
      <div class="usecases-grid">
        <div class="usecase-card">
          <div class="usecase-icon">&#x1F4BB;</div>
          <h3>Developers Onboarding to a New Codebase</h3>
          <p>
            Get oriented to an unfamiliar project in minutes. See how files
            relate to each other, which folders contain business logic, and
            how the frontend connects to the backend — without reading every
            file manually.
          </p>
        </div>
        <div class="usecase-card">
          <div class="usecase-icon">&#x1F4CA;</div>
          <h3>Tech Leads Reviewing Large Pull Requests</h3>
          <p>
            Understand which modules a pull request touches before diving in.
            Spot architectural inconsistencies, trace dependency chains, and
            review with full context of the overall project structure.
          </p>
        </div>
        <div class="usecase-card">
          <div class="usecase-icon">&#x1F527;</div>
          <h3>Freelancers Scoping Legacy Projects</h3>
          <p>
            Quickly size up inherited codebases you've never seen. Count
            components, detect the tech stack, and deliver accurate estimates
            to clients — without spending hours browsing a file tree manually.
          </p>
        </div>
      </div>
    </section>

    <!-- Ad Slot #2 -->
    <div class="ad-slot">
      <!-- Google AdSense ad unit goes here -->
    </div>

    <!-- FAQ -->
    <section class="faq-section" id="faq">
      <h2 class="section-title">Frequently Asked Questions</h2>
      <div class="faq-list">
        <div class="faq-item">
          <h3 class="faq-q">Do I need an internet connection to use Architect?</h3>
          <p class="faq-a">
            The web interface requires an internet connection to load in your browser.
            However, all file analysis runs entirely on your local machine through the
            downloaded backend server. Your project files never leave your computer.
          </p>
        </div>
        <div class="faq-item">
          <h3 class="faq-q">What operating systems are supported?</h3>
          <p class="faq-a">
            The Architect backend runs on Windows, macOS, and Linux. Any system with
            Python 3.10 or later installed is supported. Platform-specific start scripts
            (<code>start.bat</code> for Windows, <code>start.sh</code> for macOS/Linux)
            are included in the download.
          </p>
        </div>
        <div class="faq-item">
          <h3 class="faq-q">Is there a project size limit?</h3>
          <p class="faq-a">
            There is no hard limit. Architect is designed to handle projects with
            thousands of files efficiently. Analysis time depends on local hardware,
            but most projects — including large monorepos — complete in just a few seconds.
          </p>
        </div>
        <div class="faq-item">
          <h3 class="faq-q">Does Architect send my code to the cloud?</h3>
          <p class="faq-a">
            No. The backend server runs entirely on <code>localhost</code> and makes
            no outbound network requests. Your source code, file names, and project
            structure remain on your machine at all times. No third-party service
            ever processes your files.
          </p>
        </div>
        <div class="faq-item">
          <h3 class="faq-q">Can I use Architect with private or proprietary code?</h3>
          <p class="faq-a">
            Yes. Because all analysis happens locally, Architect is safe to use on
            confidential or proprietary codebases. There is no account creation,
            no telemetry, and no cloud upload — ever.
          </p>
        </div>
        <div class="faq-item">
          <h3 class="faq-q">How does the graph visualization work?</h3>
          <p class="faq-a">
            Architect parses your project's file tree and dependency manifests
            (such as <code>package.json</code>, <code>requirements.txt</code>,
            or <code>go.mod</code>) to build a graph of nodes (files and folders)
            and edges (imports and relationships). The result is rendered in your
            browser as an interactive, pannable, and zoomable node graph.
          </p>
        </div>
        <div class="faq-item">
          <h3 class="faq-q">Is Architect free?</h3>
          <p class="faq-a">
            Yes, Architect is completely free to use. The web interface is hosted
            at no cost, and the backend you download is free to inspect and run.
            No subscription, no sign-up, and no payment is required.
          </p>
        </div>
        <div class="faq-item">
          <h3 class="faq-q">What Python version do I need?</h3>
          <p class="faq-a">
            Python 3.10 or newer is required to run the backend. If you don't
            have Python installed, download it from
            <a href="https://www.python.org/downloads/" target="_blank" rel="noopener">python.org</a>.
            The start script will automatically install all required packages
            on first run using <code>pip</code>.
          </p>
        </div>
      </div>
    </section>

    <!-- Privacy Policy -->
    <section class="privacy-section" id="privacy">
      <div class="privacy-inner">
        <h2 class="privacy-title">Privacy Policy</h2>
        <p>
          Architect ("the Service") is a browser-based tool that helps you
          visualize and understand local software projects. This privacy
          policy describes how we handle information in connection with the
          Service.
        </p>
        <h3>Information We Collect</h3>
        <p>
          The Architect web interface does not collect, store, or transmit
          any personal data or project files. The local backend agent that
          you download and run on your computer reads files from directories
          you explicitly select. This data is processed entirely on your
          machine and is never sent to any remote server.
        </p>
        <p>
          We use standard web server access logs which may record your IP
          address, browser type, and pages visited. This information is used
          solely for operating and improving the Service and is never sold to
          third parties.
        </p>
        <h3>Cookies &amp; Third-Party Advertising</h3>
        <p>
          This site may display advertisements served by Google AdSense.
          Google may use cookies to show ads based on your prior visits to
          this and other websites. You can opt out of personalized advertising
          by visiting
          <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener">Google Ads Settings</a>.
          We do not control the content of third-party advertisements.
        </p>
        <h3>Contact</h3>
        <p>
          If you have questions about this privacy policy, please open an
          issue in the project repository or contact us through the site.
        </p>
      </div>
    </section>

    <!-- Footer -->
    <footer class="landing-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <span class="logo-mark logo-sm">A</span>
          <span class="footer-brand-name">Architect</span>
        </div>
        <p class="footer-tagline">Free, local-first project analysis and visualization.</p>
        <nav class="footer-nav" aria-label="Footer navigation">
          <a href="#technologies">Technologies</a>
          <a href="#use-cases">Use Cases</a>
          <a href="#faq">FAQ</a>
          <a href="#privacy">Privacy Policy</a>
        </nav>
        <p class="footer-copy">&copy; 2026 Architect — Project Analyzer. All rights reserved.</p>
      </div>
    </footer>

    <!-- Download Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-card">
          <button class="modal-close" @click="closeModal">&times;</button>

          <div class="modal-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>

          <h3 class="modal-title">About the Backend</h3>

          <div class="modal-body">
            <p class="modal-desc">
              The backend is a lightweight Python server that runs
              <strong>locally on your computer</strong>. It is required to
              scan and analyze your project files.
            </p>

            <div class="modal-section">
              <h4>What it does</h4>
              <ul>
                <li>Reads file names and contents from the project folder you select</li>
                <li>Detects frameworks, languages, and dependencies</li>
                <li>Builds an interactive graph of file relationships</li>
              </ul>
            </div>

            <div class="modal-section">
              <h4>Security</h4>
              <ul>
                <li>Runs on <strong>localhost only</strong> &mdash; not accessible from the internet</li>
                <li><strong>No data is sent</strong> to any external server</li>
                <li><strong>Read-only</strong> &mdash; never writes, modifies, or deletes your files</li>
                <li>No AI keys or cloud services required</li>
              </ul>
            </div>

            <div class="modal-section">
              <h4>How to run</h4>
              <ol>
                <li>Unzip the downloaded file</li>
                <li>Double-click <code>start.bat</code> (Windows) or run <code>./start.sh</code> (Mac/Linux)</li>
                <li>The server starts at <code>http://localhost:5000</code></li>
              </ol>
              <p class="modal-note">Requires Python 3.10+. Dependencies are installed automatically.</p>
            </div>
          </div>

          <div class="modal-actions">
            <button class="modal-btn-cancel" @click="closeModal">Cancel</button>
            <button class="modal-btn-download" @click="confirmDownload">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download ZIP
            </button>
          </div>
        </div>
      </div>
    </Teleport>
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

.download-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.download-callout {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.4rem 0.875rem;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.12), rgba(245, 158, 11, 0.08));
  border: 1.5px solid rgba(251, 191, 36, 0.5);
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #92400E;
  white-space: nowrap;
  position: relative;
  animation: pulse-callout 2.5s ease-in-out infinite;
}

.download-callout svg {
  color: #D97706;
  flex-shrink: 0;
}

@keyframes pulse-callout {
  0%, 100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); }
  50% { box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.2); }
}

/* ---------- Ad Slots ---------- */
.ad-slot {
  max-width: 960px;
  width: 100%;
  margin: 1.5rem auto;
  padding: 0 2rem;
  min-height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
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
  padding: 2.5rem 2rem;
  border-top: 1px solid #F1F5F9;
  background: #fff;
}

/* ---------- Modal ---------- */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1.5rem;
}

.modal-card {
  background: #fff;
  border-radius: 20px;
  max-width: 520px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  padding: 2rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  position: relative;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1.25rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #94A3B8;
  cursor: pointer;
  line-height: 1;
  padding: 0.25rem;
}

.modal-close:hover {
  color: #1a1a2e;
}

.modal-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, #DBEAFE, #EFF6FF);
  color: #3B82F6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #1a1a2e;
  text-align: center;
  margin-bottom: 1rem;
}

.modal-body {
  text-align: left;
}

.modal-desc {
  font-size: 0.9rem;
  color: #475569;
  line-height: 1.65;
  margin-bottom: 1.25rem;
}

.modal-section {
  margin-bottom: 1rem;
}

.modal-section h4 {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #6366F1;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.modal-section ul,
.modal-section ol {
  margin: 0;
  padding-left: 1.25rem;
  font-size: 0.85rem;
  color: #475569;
  line-height: 1.7;
}

.modal-section li {
  margin-bottom: 0.2rem;
}

.modal-section code {
  background: #F1F5F9;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #6366F1;
}

.modal-note {
  font-size: 0.8rem;
  color: #94A3B8;
  margin-top: 0.5rem;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid #F1F5F9;
}

.modal-btn-cancel {
  padding: 0.625rem 1.25rem;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  background: #fff;
  color: #64748B;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.2s;
}

.modal-btn-cancel:hover {
  border-color: #CBD5E1;
}

.modal-btn-download {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.5rem;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
  transition: transform 0.15s, box-shadow 0.15s;
}

.modal-btn-download:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

/* ---------- Technologies ---------- */
.tech-section {
  max-width: 960px;
  margin: 0 auto;
  padding: 3rem 2rem;
  text-align: center;
}

.section-desc {
  font-size: 1rem;
  color: #64748B;
  max-width: 560px;
  margin: -1.5rem auto 2rem;
  line-height: 1.7;
}

.tech-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.625rem;
  justify-content: center;
}

.tech-badge {
  padding: 0.4rem 1rem;
  background: #fff;
  border: 1.5px solid #E2E8F0;
  border-radius: 20px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #334155;
  transition: border-color 0.2s, color 0.2s;
}

.tech-badge:hover {
  border-color: #6366F1;
  color: #6366F1;
}

/* ---------- Use Cases ---------- */
.usecases-section {
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem 2rem 3rem;
}

.usecases-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
  margin-top: 0;
}

.usecase-card {
  background: #fff;
  border: 1px solid #F1F5F9;
  border-radius: 16px;
  padding: 2rem 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.usecase-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.usecase-card h3 {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 0.625rem;
  line-height: 1.4;
}

.usecase-card p {
  font-size: 0.875rem;
  color: #64748B;
  line-height: 1.65;
}

/* ---------- FAQ ---------- */
.faq-section {
  max-width: 760px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.faq-item {
  background: #fff;
  border: 1px solid #F1F5F9;
  border-radius: 14px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.faq-q {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 0.625rem;
  line-height: 1.4;
}

.faq-a {
  font-size: 0.875rem;
  color: #475569;
  line-height: 1.7;
}

.faq-a code {
  background: #F1F5F9;
  padding: 0.1rem 0.375rem;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #6366F1;
}

.faq-a a {
  color: #6366F1;
  text-decoration: underline;
  text-decoration-color: rgba(99, 102, 241, 0.3);
}

.faq-a a:hover {
  text-decoration-color: #6366F1;
}

/* ---------- Privacy ---------- */
.privacy-section {
  background: #F8FAFC;
  border-top: 1px solid #F1F5F9;
  border-bottom: 1px solid #F1F5F9;
  padding: 3rem 2rem;
  margin-top: 2rem;
}

.privacy-inner {
  max-width: 760px;
  margin: 0 auto;
}

.privacy-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1a1a2e;
  margin-bottom: 1rem;
  letter-spacing: -0.02em;
}

.privacy-section h3 {
  font-size: 1rem;
  font-weight: 700;
  color: #334155;
  margin: 1.5rem 0 0.5rem;
}

.privacy-section p {
  font-size: 0.875rem;
  color: #475569;
  line-height: 1.75;
  margin-bottom: 0.5rem;
}

.privacy-section a {
  color: #6366F1;
  text-decoration: underline;
  text-decoration-color: rgba(99, 102, 241, 0.3);
}

.privacy-section a:hover {
  text-decoration-color: #6366F1;
}

/* ---------- Footer ---------- */
.footer-inner {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  text-align: center;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo-sm {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.footer-brand-name {
  font-size: 1rem;
  font-weight: 800;
  color: #1a1a2e;
}

.footer-tagline {
  font-size: 0.8125rem;
  color: #94A3B8;
}

.footer-nav {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.footer-nav a {
  font-size: 0.8125rem;
  color: #64748B;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.footer-nav a:hover {
  color: #6366F1;
}

.footer-copy {
  font-size: 0.75rem;
  color: #CBD5E1;
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

  .usecases-grid {
    grid-template-columns: 1fr;
  }

  .tech-section,
  .usecases-section,
  .faq-section {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }

  .footer-nav {
    gap: 1rem;
  }
}
</style>
