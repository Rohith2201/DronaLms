import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
selector: 'app-home',
standalone: true,
imports:[
CommonModule,
RouterModule,
MatButtonModule,
MatIconModule,
MatCardModule
],
template:`

<div class="landing">

<!-- ================= NAVBAR ================= -->
<header class="navbar">
<div class="logo">🚀 Drona LMS</div>

<nav>
<a routerLink="/">Home</a>
<a>Features</a>
<a>Pricing</a>
<a routerLink="/auth/login">Login</a>

<a mat-flat-button color="primary"
routerLink="/auth/register">
Get Started
</a>
</nav>
</header>


<!-- ================= HERO ================= -->
<section class="hero container">

<div class="hero-left">

<h1>
AI Powered
<span>Learning Platform</span>
for the Future
</h1>

<p>
Drona LMS helps universities, instructors and learners
build skills faster using artificial intelligence,
real-time analytics and personalized learning paths.
</p>

<div class="hero-actions">
<a mat-flat-button color="primary"
routerLink="/auth/register">
Start Free
</a>

<a mat-stroked-button>
Watch Demo
</a>
</div>

<div class="stats">
<div><h3>50K+</h3><span>Learners</span></div>
<div><h3>1200+</h3><span>Courses</span></div>
<div><h3>95%</h3><span>Completion</span></div>
</div>

</div>

<div class="hero-right">
<img
src="https://images.unsplash.com/photo-1581092795360-fd1ca04f0952"
alt="AI Learning"/>
</div>

</section>


<!-- ================= TRUST ================= -->
<section class="trust">
<p>Trusted by modern learning communities</p>

<div class="companies">
<span>Google Developers</span>
<span>AWS Academy</span>
<span>Microsoft Learn</span>
<span>Open Source</span>
</div>
</section>


<!-- ================= PRODUCT SHOWCASE ================= -->
<section class="product container">

<div class="product-text">
<h2>One Powerful Learning Dashboard</h2>

<p>
Manage courses, monitor student progress,
analyze performance and automate learning
using AI insights.
</p>

<ul>
<li>✔ Real-time analytics</li>
<li>✔ AI recommendations</li>
<li>✔ Course automation</li>
<li>✔ Certification system</li>
</ul>

</div>

<div class="product-image">
<img
src="https://images.unsplash.com/photo-1551288049-bebda4e38f71"/>
</div>

</section>


<!-- ================= FEATURES ================= -->
<section class="features container">

<h2>Why Drona LMS Wins</h2>

<div class="feature-grid">

<mat-card>
<mat-icon>psychology</mat-icon>
<h3>AI Tutor</h3>
<p>Smart assistant guiding every learner.</p>
</mat-card>

<mat-card>
<mat-icon>analytics</mat-icon>
<h3>Advanced Analytics</h3>
<p>Track growth and engagement instantly.</p>
</mat-card>

<mat-card>
<mat-icon>workspace_premium</mat-icon>
<h3>Certifications</h3>
<p>Industry-ready verified certificates.</p>
</mat-card>

<mat-card>
<mat-icon>groups</mat-icon>
<h3>Collaboration</h3>
<p>Interactive learning ecosystem.</p>
</mat-card>

</div>

</section>


<!-- ================= USE CASE ================= -->
<section class="usecase">

<h2>Built For Every Learning Ecosystem</h2>

<div class="use-grid">

<div>
<h3>🎓 Universities</h3>
<p>Digital campus learning infrastructure.</p>
</div>

<div>
<h3>👨‍🏫 Instructors</h3>
<p>Create scalable AI-powered courses.</p>
</div>

<div>
<h3>🏢 Organizations</h3>
<p>Upskill teams with intelligent learning.</p>
</div>

</div>

</section>


<!-- ================= CTA ================= -->
<section class="cta">

<h2>Join The Future of Education</h2>

<a mat-flat-button color="primary"
routerLink="/auth/register">
Launch Your Learning Platform
</a>

</section>


<!-- ================= FOOTER ================= -->
<footer>

<div class="footer-grid">

<div>
<h3>Drona LMS</h3>
<p>AI Driven Education Platform</p>
</div>

<div>
<h4>Product</h4>
<p>Features</p>
<p>Pricing</p>
<p>Security</p>
</div>

<div>
<h4>Company</h4>
<p>About</p>
<p>Careers</p>
<p>Contact</p>
</div>

</div>

<p class="copyright">
© 2026 Drona LMS — Silicon Valley Inspired
</p>

</footer>

</div>
`,
styles:[`

/* GLOBAL */

.landing{
background:#020617;
color:white;
font-family:Inter,system-ui;
}

.container{
max-width:1200px;
margin:auto;
padding:100px 24px;
}

/* NAVBAR */

.navbar{
display:flex;
justify-content:space-between;
align-items:center;
padding:20px 40px;
position:sticky;
top:0;
background:#020617cc;
backdrop-filter:blur(12px);
z-index:10;
}

nav{
display:flex;
gap:24px;
align-items:center;
}

nav a{
color:white;
text-decoration:none;
opacity:.8;
}

/* HERO */

.hero{
display:grid;
grid-template-columns:1.1fr 1fr;
align-items:center;
gap:60px;
min-height:85vh;
}

.hero h1{
font-size:60px;
font-weight:900;
line-height:1.1;
}

.hero span{
background:linear-gradient(90deg,#6366f1,#a855f7);
-webkit-background-clip:text;
-webkit-text-fill-color:transparent;
}

.hero-right img{
width:100%;
border-radius:16px;
box-shadow:0 30px 80px rgba(0,0,0,.6);
}

.hero-actions{
margin-top:24px;
display:flex;
gap:16px;
}

.stats{
display:flex;
gap:40px;
margin-top:40px;
}

.stats h3{
color:#818cf8;
}

/* TRUST */

.trust{
text-align:center;
padding:50px;
opacity:.8;
}

.companies{
display:flex;
justify-content:center;
gap:40px;
flex-wrap:wrap;
margin-top:20px;
}

/* PRODUCT */

.product{
display:grid;
grid-template-columns:1fr 1fr;
gap:60px;
align-items:center;
}

.product-image img{
width:100%;
border-radius:16px;
}

/* FEATURES */

.feature-grid{
display:grid;
grid-template-columns:repeat(auto-fit,minmax(260px,1fr));
gap:30px;
margin-top:40px;
}

mat-card{
padding:40px;
background:rgba(255,255,255,.04);
}

/* USECASE */

.usecase{
text-align:center;
padding:120px 20px;
background:#030712;
}

.use-grid{
display:flex;
justify-content:center;
gap:60px;
flex-wrap:wrap;
margin-top:40px;
}

/* CTA */

.cta{
text-align:center;
padding:120px 20px;
background:linear-gradient(135deg,#4f46e5,#9333ea);
}

.cta h2{
font-size:42px;
margin-bottom:20px;
}

/* FOOTER */

footer{
background:#01030a;
padding:80px 40px;
}

.footer-grid{
display:grid;
grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
gap:40px;
}

copyright{
text-align:center;
margin-top:40px;
opacity:.6;
}

/* RESPONSIVE */

@media(max-width:900px){
.hero,
.product{
grid-template-columns:1fr;
text-align:center;
}
.stats{
justify-content:center;
}
}

`]
})
export class HomeComponent {}