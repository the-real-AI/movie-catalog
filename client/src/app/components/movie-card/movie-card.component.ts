import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Movie } from '../../models/movie.models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-movie-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="movie-card">
      <div class="poster-container">
        @if (fullPosterUrl()) {
          <img [src]="fullPosterUrl()" [alt]="movie().title" class="poster-img" />
        } @else {
          <div class="poster-placeholder">
            <span class="placeholder-icon">🎬</span>
            <span>Нет постера</span>
          </div>
        }
        <div class="rating-tag">★ {{ movie().rating.toFixed(1) }}</div>
      </div>

      <div class="card-content">
        <div class="card-header">
          <span class="badge badge-genre">{{ movie().genreName }}</span>
          <span class="year-text">{{ movie().year }} г.</span>
        </div>

        <h3 class="movie-title">
          <a [routerLink]="['/movies', movie().id]">{{ movie().title }}</a>
        </h3>

        <div class="movie-meta">
          <span>⏱ {{ movie().duration }} мин.</span>
          <span class="author-text">Автор: {{ movie().authorName }}</span>
        </div>

        <div class="card-actions">
          <a [routerLink]="['/movies', movie().id]" class="btn btn-secondary btn-sm">Подробнее</a>

          @if (isAuthor()) {
            <a [routerLink]="['/movies', movie().id, 'edit']" class="btn btn-primary btn-sm">Изменить</a>
            <button (click)="onDelete()" class="btn btn-danger btn-sm" title="Удалить">✕</button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .movie-card {
      background-color: var(--bg-card);
      border-radius: var(--radius);
      border: 1px solid var(--border);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .movie-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
      border-color: rgba(99, 102, 241, 0.4);
    }
    .poster-container {
      position: relative;
      height: 240px;
      background-color: #0b1120;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .poster-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .poster-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-muted);
      font-size: 0.85rem;
    }
    .placeholder-icon {
      font-size: 2.5rem;
    }
    .rating-tag {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(4px);
      color: #fbbf24;
      font-weight: 700;
      font-size: 0.85rem;
      padding: 0.25rem 0.6rem;
      border-radius: 8px;
      border: 1px solid rgba(251, 191, 36, 0.3);
    }
    .card-content {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .year-text {
      font-size: 0.85rem;
      color: var(--text-muted);
      font-weight: 500;
    }
    .movie-title {
      font-size: 1.15rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      line-height: 1.3;
    }
    .movie-title a {
      color: var(--text-primary);
    }
    .movie-title a:hover {
      color: var(--primary);
    }
    .movie-meta {
      display: flex;
      justify-content: space-between;
      font-size: 0.825rem;
      color: var(--text-muted);
      margin-top: auto;
      padding-top: 0.75rem;
      border-top: 1px solid rgba(51, 65, 85, 0.5);
    }
    .card-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
    }
    .btn-sm {
      padding: 0.35rem 0.75rem;
      font-size: 0.85rem;
    }
  `]
})
export class MovieCardComponent {
  movie = input.required<Movie>();
  currentUserId = input<number | null>(null);

  delete = output<number>();

  isAuthor = computed(() => {
    const uid = this.currentUserId();
    return uid !== null && uid === this.movie().userId;
  });

  fullPosterUrl = computed(() => {
    const url = this.movie().posterUrl;
    if (!url) return null;
    return url.startsWith('http') ? url : `${environment.apiUrl}${url}`;
  });

  onDelete(): void {
    if (confirm(`Вы уверены, что хотите удалить фильм "${this.movie().title}"?`)) {
      this.delete.emit(this.movie().id);
    }
  }
}
