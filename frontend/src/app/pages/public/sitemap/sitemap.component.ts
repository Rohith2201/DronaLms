import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface SitemapLink {
  label: string;
  route: string;
  description: string;
  priority: string;
}

@Component({
  selector: 'app-sitemap',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sitemap-page">
      <div class="container">
        <header class="page-header">
          <a routerLink="/" class="back-link">← Back to Home</a>
          <h1>Site Map</h1>
          <p>All important pages in one place for users and search engines.</p>
        </header>

        <section class="card card-glass seo-note">
          <h2>SEO information</h2>
          <p>
            This page is human-readable. Crawlers also use <strong>/sitemap.xml</strong> and <strong>/robots.txt</strong>
            from the public folder for indexing.
          </p>
        </section>

        <section class="links-grid">
          <a class="card card-hover link-item" *ngFor="let link of links" [routerLink]="link.route">
            <div class="top-row">
              <h3>{{ link.label }}</h3>
              <span class="badge badge-muted">Priority {{ link.priority }}</span>
            </div>
            <p>{{ link.description }}</p>
            <span class="route">{{ link.route }}</span>
          </a>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .sitemap-page {
      min-height: 100vh;
      background: linear-gradient(180deg, var(--bg-base) 0%, var(--bg-muted) 100%);
      padding: var(--space-10) 0;
    }

    .container {
      width: min(1100px, 100% - 32px);
      margin: 0 auto;
    }

    .page-header {
      text-align: center;
      margin-bottom: var(--space-8);

      h1 {
        margin: var(--space-2) 0;
      }

      p {
        max-width: 680px;
        margin: 0 auto;
      }
    }

    .back-link {
      font-weight: 600;
      color: var(--primary);
    }

    .seo-note {
      padding: var(--space-6);
      margin-bottom: var(--space-6);
    }

    .links-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--space-4);
    }

    .link-item {
      display: block;
      padding: var(--space-5);
    }

    .top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2);
      margin-bottom: var(--space-2);
    }

    .route {
      color: var(--text-muted);
      font-size: 0.82rem;
      font-weight: 600;
    }

    @media (max-width: 960px) {
      .links-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SitemapComponent {
  readonly links: SitemapLink[] = [
    { label: 'Home', route: '/', description: 'Primary landing page with platform highlights.', priority: '1.0' },
    { label: 'Blogs', route: '/blogs', description: 'Latest platform stories and updates.', priority: '0.8' },
    { label: 'Sitemap', route: '/sitemap', description: 'Page and SEO navigation map.', priority: '0.9' },
    { label: 'Login', route: '/auth/login', description: 'Authenticate existing users.', priority: '0.7' },
    { label: 'Signup', route: '/auth/register', description: 'Create a learner or instructor account.', priority: '0.7' },
    { label: 'Verify Certificate', route: '/verify-certificate', description: 'Public certificate authenticity check.', priority: '0.6' }
  ];
}
