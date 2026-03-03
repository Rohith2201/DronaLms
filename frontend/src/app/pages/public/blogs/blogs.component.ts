import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

interface BlogPost {
  title: string;
  summary: string;
  category: string;
  readTime: string;
  author: string;
  publishedOn: string;
  link: string;
}

@Component({
  selector: 'app-blogs',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="blogs-page">
      <div class="container">
        <header class="page-header">
          <a routerLink="/" class="back-link">← Back to Home</a>
          <p class="eyebrow">INSIGHTS</p>
          <h1>Drona LMS Blogs</h1>
          <p class="subtitle">Curated learning and product insights from Drona LMS.</p>
        </header>

        <p class="loading-state" *ngIf="isLoading()">Loading blog posts...</p>
        <p class="loading-state" *ngIf="!isLoading() && !blogs().length">No posts available.</p>

        <section class="blog-grid" *ngIf="blogs().length">
          <article class="blog-card" *ngFor="let blog of blogs()">
            <div class="card-glow"></div>

            <div class="blog-top">
              <span class="badge badge-muted">{{ blog.category }}</span>
              <span class="read-time">{{ blog.readTime }}</span>
            </div>

            <h3>{{ blog.title }}</h3>
            <p class="summary">{{ blog.summary }}</p>

            <div class="blog-meta">
              <span>{{ blog.author }}</span>
              <span class="dot">•</span>
              <span>{{ blog.publishedOn }}</span>
            </div>

            <a class="read-link" [href]="blog.link" target="_blank" rel="noopener noreferrer">
              Read article →
            </a>
          </article>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .blogs-page {
      min-height: 100vh;
      background:
        radial-gradient(1200px 400px at 10% -10%, rgba(59,130,246,.18), transparent 60%),
        radial-gradient(900px 300px at 95% 0%, rgba(168,85,247,.14), transparent 60%),
        linear-gradient(180deg, var(--bg-base) 0%, var(--bg-muted) 100%);
      padding: var(--space-10) 0;
    }

    .container {
      width: min(1120px, 100% - 32px);
      margin: 0 auto;
    }

    .page-header {
      text-align: center;
      margin-bottom: var(--space-8);
    }

    .eyebrow {
      color: var(--primary);
      letter-spacing: .12em;
      font-size: .75rem;
      font-weight: 700;
      margin: 0;
    }

    .page-header h1 {
      margin: var(--space-2) 0;
      font-size: clamp(1.8rem, 3vw, 2.5rem);
      color: var(--text-heading);
    }

    .subtitle {
      color: var(--text-muted);
      max-width: 680px;
      margin: 0 auto;
    }

    .back-link {
      display: inline-block;
      margin-bottom: var(--space-3);
      font-weight: 600;
      color: var(--primary);
      text-decoration: none;
    }

    .back-link:hover {
      text-decoration: underline;
    }

    .loading-state {
      text-align: center;
      color: var(--text-muted);
      padding: var(--space-8) 0;
    }

    .blog-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--space-4);
    }

    .blog-card {
      position: relative;
      overflow: hidden;
      border-radius: 16px;
      padding: var(--space-5);
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      background: linear-gradient(180deg, rgba(15,23,42,.85), rgba(2,6,23,.9));
      border: 1px solid rgba(148,163,184,.25);
      box-shadow: 0 12px 26px rgba(2,6,23,.35);
      transition:
        transform .25s ease,
        border-color .25s ease,
        box-shadow .25s ease;
    }

    .blog-card:hover {
      transform: translateY(-6px);
      border-color: rgba(96,165,250,.8);
      box-shadow: 0 16px 30px rgba(37,99,235,.28);
    }

    .card-glow {
      position: absolute;
      width: 180px;
      height: 180px;
      top: -70px;
      right: -60px;
      background:
        radial-gradient(circle, rgba(59,130,246,.35) 0%, rgba(59,130,246,0) 70%);
      pointer-events: none;
    }

    .blog-top,
    .blog-meta {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      color: var(--text-muted);
      font-size: 0.82rem;
    }

    .blog-top {
      justify-content: space-between;
    }

    .read-time {
      opacity: .9;
    }

    .blog-card h3 {
      margin: 0;
      font-size: 1.08rem;
      line-height: 1.4;
      color: #fff;
    }

    .summary {
      margin: 0;
      color: #cbd5e1;
      line-height: 1.6;
    }

    .dot {
      opacity: .8;
    }

    .read-link {
      margin-top: auto;
      width: fit-content;
      text-decoration: none;
      color: #93c5fd;
      font-weight: 600;
      transition: color .2s ease;
    }

    .read-link:hover {
      color: #dbeafe;
    }

    @media (max-width: 1024px) {
      .blog-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 760px) {
      .blog-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class BlogsComponent implements OnInit {
  private readonly http = inject(HttpClient);

  readonly blogs = signal<BlogPost[]>([]);
  readonly isLoading = signal(true);

  ngOnInit(): void {
    this.http
      .get<BlogPost[]>('data/blogs.json')
      .pipe(catchError(() => of([] as BlogPost[])))
      .subscribe((items) => {
        this.blogs.set(items);
        this.isLoading.set(false);
      });
  }
}
