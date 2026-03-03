import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="landing">

    <!-- NAVBAR -->
    <header class="navbar">
      <div class="container nav-content">
        <div class="logo">Drona LMS</div>

        <nav class="nav-links">
          <a href="#features">Features</a>
          <a routerLink="/blogs">Blogs</a>
          <a routerLink="/sitemap">Sitemap</a>
        </nav>

        <div class="auth-links">
          <a routerLink="/verify-certificate">Verify</a>
          <a routerLink="/auth/login" class="btn-outline">Login</a>
          <a routerLink="/auth/register" class="btn-glow">Signup</a>
        </div>
      </div>
    </header>

    <!-- HERO -->
    <section class="hero container">
      <div class="badge">🚀 AI Powered Learning is Live</div>

      <h1>
        Drona LMS –
        <span>Learning Made Simple</span>
      </h1>

      <p>
      Ultimate LMS platform to manage courses, track progress, and engage learners with ease.
      </p>

      <a routerLink="/auth/register" class="btn-glow large">
        Start Exploring →
      </a>
    </section>

        <!-- FEATURES -->
        <section id="features" class="section container">
    
          <h2 style="color: #ffffff;" class="section-title">A Smarter Way to Manage Learning</h2>
    
          <div class="grid-2">
            <div class="glass-card">
              <h3>Course Management</h3>
              <p>
                Create, organize, and deliver courses with structured modules,
                lessons, and resources.
              </p>
            </div>
    
            <div class="glass-card">
              <h3>Assignments & Quizzes</h3>
              <p>
                Build assessments, collect submissions, and evaluate learners
                with automated and manual grading.
              </p>
            </div>
          </div>
    
          <div class="grid-2 mt">
            <div class="glass-card">
              <h3>Live Classes & Discussions</h3>
              <p>
                Run interactive sessions and enable learner collaboration
                through announcements and discussions.
              </p>
            </div>
    
            <div class="glass-card">
              <h3>Progress Tracking & Reports</h3>
              <p>
                Monitor completion rates, performance trends, and engagement
                with real-time analytics.
              </p>
            </div>
          </div>
    
        </section>
    

    <!-- WHY CHOOSE -->
    <section class="section container">
      <h2 style="color: #ffffff;" class="section-title">Why Choose Drona LMS?</h2>

      <div class="grid-3">
        <div class="glass-card small">
          <h4>Easy Course Creation</h4>
          <p>Design and publish courses quickly with a structured content builder.</p>
        </div>

        <div class="glass-card small">
          <h4>Engaged Learning Experience</h4>
          <p>Keep learners active with quizzes, assignments, discussions, and live sessions.</p>
        </div>

        <div class="glass-card small">
          <h4>Actionable Insights</h4>
          <p>Track learner progress, completion rates, and performance through smart reports.</p>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta container">
      <h2 style="color: #ffffff;">Join thousands of successful learners</h2>
      <a routerLink="/auth/register" class="btn-glow large">
        Get Started Now
      </a>
    </section>

    <!-- FOOTER -->
    <footer class="footer">
      <div class="container footer-grid">

        <div>
          <h3>Drona LMS</h3>
          <p>AI-powered learning for the next generation.</p>
        </div>

        <div>
          <h4>Product</h4>
          <a href="#features">Features</a>
          <a routerLink="/verify-certificate">Verify Certificate</a>
          <a routerLink="/blogs">Blogs</a>
        </div>

        <div>
          <h4>Company</h4>
          <a routerLink="/sitemap">Sitemap</a>
          <a routerLink="/auth/login">Login</a>
          <a routerLink="/auth/register">Signup</a>
        </div>

      </div>

      <div class="footer-bottom">
        © 2026 Drona LMS. All rights reserved.
      </div>
    </footer>

  </div>
  `,
  styles: [`

  .landing {
    background: #000;
    color: white;
    font-family: 'Inter', sans-serif;
  }

  .container {
    width: min(1100px, 92%);
    margin: 0 auto;
  }

  /* NAVBAR */
  .navbar {
    padding: 20px 0;
    border-bottom: 1px solid #111;
  }

  .nav-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo {
    font-weight: 700;
    font-size: 1.2rem;
    background: linear-gradient(90deg, #3b82f6, #a855f7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .nav-links {
    display: flex;
    gap: 24px;
    opacity: 0.8;
  }

  .auth-links {
    display: flex;
    gap: 20px;
    align-items: center;
  }

  /* HERO */
  .hero {
    text-align: center;
    padding: 100px 0;
  }

  .badge {
    display: inline-block;
    padding: 6px 16px;
    background: #111;
    border-radius: 999px;
    font-size: 0.8rem;
    margin-bottom: 20px;
  }

  .hero h1 {
    font-size: 3rem;
    margin-bottom: 20px;
  }

  .hero h1 span {
    background: linear-gradient(90deg, #3b82f6, #a855f7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .hero p {
    max-width: 600px;
    margin: 0 auto 40px;
    opacity: 0.7;
  }

  /* BUTTON */
  .btn-glow {
    background: linear-gradient(90deg, #3b82f6, #a855f7);
    padding: 12px 24px;
    border-radius: 8px;
    color: white;
    font-weight: 600;
    transition: 0.3s;
    display: inline-block;
  }

  .btn-glow:hover {
    box-shadow: 0 0 20px rgba(168,85,247,0.6);
    transform: translateY(-2px);
  }

  .btn-outline {
    background: #000;
    border: 1px solid #fff;
    color: #fff;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    transition: 0.3s;
    display: inline-block;
  }

  .btn-outline:hover {
    background: #111;
    transform: translateY(-2px);
  }

  .large {
    padding: 14px 32px;
    font-size: 1rem;
  }

  /* SECTIONS */
  .section {
    padding: 80px 0;
  }

  .section-title {
    text-align: center;
    margin-bottom: 40px;
  }

  .purple {
    color: #a855f7;
  }

  /* GRIDS */
  .grid-2 {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 30px;
  }

  .grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 30px;
  }

  .mt {
    margin-top: 30px;
  }

  /* GLASS CARD */
  .glass-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    padding: 30px;
    border-radius: 14px;
    backdrop-filter: blur(8px);
    transition: 0.3s;
  }

  .glass-card:hover {
    border-color: #a855f7;
    transform: translateY(-5px);
  }

  .small {
    padding: 20px;
  }

  /* CTA */
  .cta {
    text-align: center;
    padding: 100px 0;
  }

  /* FOOTER */
  .footer {
    border-top: 1px solid #111;
    padding: 60px 0 30px;
  }

  .footer-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 40px;
  }

  .footer a {
    display: block;
    margin-top: 8px;
    opacity: 0.7;
  }

  .footer-bottom {
    text-align: center;
    margin-top: 40px;
    opacity: 0.6;
    font-size: 0.85rem;
  }

  @media (max-width: 900px) {
    .grid-2,
    .grid-3,
    .footer-grid {
      grid-template-columns: 1fr;
    }

    .hero h1 {
      font-size: 2.2rem;
    }
  }
    .landing {
  background: #000;
  color: #f5f5f5; /* Strong readable white */
  font-family: 'Inter', sans-serif;
}

a {
  color: #e5e7eb;
  text-decoration: none;
}

a:hover {
  color: #ffffff;
}

/* NAVBAR */
.navbar {
  padding: 20px 0;
  border-bottom: 1px solid #1f2937;
  background: #000;
}

.logo {
  font-weight: 700;
  font-size: 1.2rem;
  background: linear-gradient(90deg, #3b82f6, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nav-links a {
  color: #d1d5db;
}

.nav-links a:hover {
  color: #ffffff;
}

.auth-links a {
  color: #d1d5db;
}

/* HERO */
.hero {
  text-align: center;
  padding: 100px 0;
}

.hero h1 {
  font-size: 3rem;
  margin-bottom: 20px;
  color: #ffffff; /* Explicit white */
}

.hero p {
  max-width: 600px;
  margin: 0 auto 40px;
  color: #cbd5e1; /* Brighter gray */
}

/* BADGE */
.badge {
  display: inline-block;
  padding: 6px 16px;
  background: #111827;
  border-radius: 999px;
  font-size: 0.8rem;
  margin-bottom: 20px;
  color: #e5e7eb;
}

/* GLASS CARD FIX */
.glass-card {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  padding: 30px;
  border-radius: 14px;
  backdrop-filter: blur(8px);
  transition: 0.3s;
  color: #f3f4f6; /* Force readable */
}

.glass-card h3,
.glass-card h4 {
  color: #ffffff;
}

.glass-card p {
  color: #cbd5e1;
}

/* FOOTER FIX */
.footer {
  border-top: 1px solid #1f2937;
  padding: 60px 0 30px;
  background: #000;
  color: #d1d5db;
}

.footer h3,
.footer h4 {
  color: #ffffff;
}

.footer a {
  color: #9ca3af;
}

.footer a:hover {
  color: #ffffff;
}

.footer-bottom {
  text-align: center;
  margin-top: 40px;
  color: #6b7280;
  font-size: 0.85rem;
}

  `]
})
export class HomeComponent {}