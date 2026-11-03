import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MovieService } from '../../services/movie.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-movie-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container py-4">
      <div class="mb-4">
        <a routerLink="/movies" class="btn btn-secondary btn-sm">← Назад к каталогу</a>
      </div>

      <!-- 4 Состояния экрана: Загрузка, Ошибка, Пусто, Данные -->

      <!-- 1. Загрузка -->
      @if (movieResource.isLoading()) {
        <div class="state-box state-loading">
          <div class="spinner"></div>
          <p>Загрузка информации о фильме...</p>
        </div>
      }

      <!-- 2. Ошибка -->
      @else if (movieResource.error()) {
        <div class="state-box state-error">
          <h3>Ошибка загрузки фильма</h3>
          <p>Возможно фильм был удален или сервер недоступен.</p>
          <a routerLink="/movies" class="btn btn-secondary mt-3">Вернуться в каталог</a>
        </div>
      }

      <!-- 3. Пусто -->
      @else if (!movie()) {
        <div class="state-box state-empty">
          <h3>Фильм не найден</h3>
          <p>Запись с указанным ID отсутствует в базе данных.</p>
          <a routerLink="/movies" class="btn btn-primary mt-3">В каталог</a>
        </div>
      }

      <!-- 4. Данные -->
      @else {
        <div class="detail-card">
          <div class="detail-grid">
            <!-- Постер -->
            <div class="poster-column">
              <div class="detail-poster-box">
                @if (posterUrl()) {
                  <img [src]="posterUrl()" [alt]="movie()!.title" class="detail-poster" />
                } @else {
                  <div class="no-poster">
                    <span style="font-size: 3rem;">🎬</span>
                    <p>Постер пока не загружен</p>
                  </div>
                }
              </div>

              <!-- Загрузка постера (Видно только автору) -->
              @if (isAuthor()) {
                <div class="upload-section">
                  <h4>Загрузить постер</h4>
                  <p class="upload-hint">Форматы: JPG, PNG, WEBP (до 5 МБ)</p>
                  
                  <label class="btn btn-secondary btn-upload">
                    {{ isUploading() ? 'Загрузка...' : 'Выбрать файл постера' }}
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      (change)="onFileSelected($event)"
                      [disabled]="isUploading()"
                      style="display: none;"
                    />
                  </label>

                  @if (uploadError()) {
                    <p class="field-error">{{ uploadError() }}</p>
                  }
                  @if (uploadSuccess()) {
                    <p class="field-success">Постер успешно обновлен!</p>
                  }
                </div>
              }
            </div>

            <!-- Данные о фильме -->
            <div class="info-column">
              <div class="badges-row">
                <span class="badge badge-genre">{{ movie()!.genreName }}</span>
                <span class="badge badge-rating">★ {{ movie()!.rating.toFixed(1) }} / 10</span>
              </div>

              <h1 class="movie-headline">{{ movie()!.title }}</h1>

              <div class="meta-list">
                <div class="meta-item">
                  <span class="meta-label">Год выпуска:</span>
                  <span class="meta-value">{{ movie()!.year }} г.</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Длительность:</span>
                  <span class="meta-value">{{ movie()!.duration }} минут ({{ formatDuration(movie()!.duration) }})</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Жанр (справочник):</span>
                  <span class="meta-value">{{ movie()!.genreName }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Автор записи:</span>
                  <span class="meta-value author-highlight">{{ movie()!.authorName }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Дата добавления:</span>
                  <span class="meta-value">{{ movie()!.createdAt | date:'dd.MM.yyyy HH:mm' }}</span>
                </div>
              </div>

              <!-- Кнопки действий: Видны только автору записи -->
              @if (isAuthor()) {
                <div class="author-actions">
                  <span class="author-badge">Вы автор этой записи</span>
                  <div class="action-buttons">
                    <a [routerLink]="['/movies', movie()!.id, 'edit']" class="btn btn-primary">
                      ✏ Редактировать фильм
                    </a>
                    <button (click)="onDelete()" class="btn btn-danger">
                      🗑 Удалить фильм
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .py-4 { padding-top: 2rem; padding-bottom: 3rem; }
    .mb-4 { margin-bottom: 1.5rem; }
    .detail-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 2.5rem;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: 340px 1fr;
      gap: 3rem;
    }
    @media (max-width: 800px) {
      .detail-grid { grid-template-columns: 1fr; }
    }
    .detail-poster-box {
      width: 100%;
      height: 460px;
      background-color: #0b1120;
      border-radius: var(--radius);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--border);
    }
    .detail-poster {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .no-poster {
      text-align: center;
      color: var(--text-muted);
    }
    .upload-section {
      margin-top: 1.5rem;
      padding: 1.25rem;
      background-color: rgba(15, 23, 42, 0.6);
      border-radius: 8px;
      border: 1px dashed var(--border);
      text-align: center;
    }
    .upload-section h4 {
      font-size: 0.95rem;
      margin-bottom: 0.25rem;
    }
    .upload-hint {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 0.75rem;
    }
    .btn-upload {
      display: block;
      width: 100%;
      cursor: pointer;
    }
    .field-success {
      color: var(--success);
      font-size: 0.85rem;
      margin-top: 0.5rem;
    }
    .badges-row {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      margin-bottom: 1rem;
    }
    .movie-headline {
      font-size: 2.25rem;
      font-weight: 700;
      line-height: 1.2;
      margin-bottom: 2rem;
    }
    .meta-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid var(--border);
      margin-bottom: 2rem;
    }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .meta-label {
      width: 170px;
      color: var(--text-muted);
      font-size: 0.95rem;
    }
    .meta-value {
      font-size: 1.05rem;
      font-weight: 500;
    }
    .author-highlight {
      color: #818cf8;
      font-weight: 600;
    }
    .author-actions {
      background-color: rgba(99, 102, 241, 0.08);
      border: 1px solid rgba(99, 102, 241, 0.25);
      border-radius: var(--radius);
      padding: 1.5rem;
    }
    .author-badge {
      display: inline-block;
      font-size: 0.85rem;
      color: #818cf8;
      font-weight: 600;
      margin-bottom: 1rem;
    }
    .action-buttons {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .btn-sm { padding: 0.4rem 0.85rem; font-size: 0.85rem; }
    .mt-3 { margin-top: 1rem; }
  `]
})
export class MovieDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private movieService = inject(MovieService);
  authService = inject(AuthService);

  movieId = signal<number>(Number(this.route.snapshot.paramMap.get('id')));
  movieResource = this.movieService.getMovieResource(() => this.movieId());

  movie = computed(() => this.movieResource.value());

  isAuthor = computed(() => {
    const m = this.movie();
    if (!m) return false;
    return this.authService.isAuthor(m.userId);
  });

  posterUrl = computed(() => {
    const url = this.movie()?.posterUrl;
    if (!url) return null;
    return url.startsWith('http') ? url : `${environment.apiUrl}${url}`;
  });

  isUploading = signal<boolean>(false);
  uploadError = signal<string | null>(null);
  uploadSuccess = signal<boolean>(false);

  formatDuration(mins: number): string {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h} ч. ${m} мин.` : `${m} мин.`;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.uploadError.set(null);
    this.uploadSuccess.set(false);

    // Client-side quick checks
    if (file.size > 5 * 1024 * 1024) {
      this.uploadError.set('Размер файла превышает 5 МБ.');
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
      this.uploadError.set('Разрешены только форматы JPG, PNG, WEBP.');
      return;
    }

    this.isUploading.set(true);
    this.movieService.uploadPoster(this.movieId(), file).subscribe({
      next: () => {
        this.isUploading.set(false);
        this.uploadSuccess.set(true);
        this.movieResource.reload();
      },
      error: (err) => {
        this.isUploading.set(false);
        const serverMsg = err.error?.errors?.File?.[0] || err.error?.detail || 'Ошибка загрузки файла.';
        this.uploadError.set(serverMsg);
      }
    });
  }

  onDelete(): void {
    const m = this.movie();
    if (!m) return;

    if (confirm(`Вы действительно хотите удалить фильм "${m.title}"?`)) {
      this.movieService.deleteMovie(m.id).subscribe({
        next: () => {
          this.router.navigate(['/movies']);
        },
        error: (err) => {
          alert(err.error?.detail || 'Не удалось удалить фильм.');
        }
      });
    }
  }
}
