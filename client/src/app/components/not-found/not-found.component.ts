import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="container py-4">
      <div class="not-found-card">
        <div class="code-404">404</div>
        <h1>Страница не найдена</h1>
        <p>Запрошенная страница не существует или была перемещена.</p>
        <a routerLink="/movies" class="btn btn-primary mt-4">Вернуться в каталог фильмов</a>
      </div>
    </div>
  `,
  styles: [`
    .py-4 { padding-top: 4rem; padding-bottom: 4rem; }
    .not-found-card {
      max-width: 500px;
      margin: 0 auto;
      text-align: center;
      background-color: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 3rem 2rem;
    }
    .code-404 {
      font-size: 5rem;
      font-weight: 800;
      color: #6366f1;
      line-height: 1;
      margin-bottom: 1rem;
    }
    h1 {
      font-size: 1.75rem;
      margin-bottom: 0.5rem;
    }
    p {
      color: var(--text-muted);
      font-size: 0.95rem;
    }
    .mt-4 { margin-top: 1.5rem; }
  `]
})
export class NotFoundComponent {}
