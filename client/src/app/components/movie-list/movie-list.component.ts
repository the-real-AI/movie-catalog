import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MovieCardComponent } from '../movie-card/movie-card.component';
import { MovieFilterComponent } from '../movie-filter/movie-filter.component';
import { MovieService, MoviesQueryParams } from '../../services/movie.service';
import { AuthService } from '../../services/auth.service';
import { MovieFilters } from '../../models/movie.models';

@Component({
  selector: 'app-movie-list',
  standalone: true,
  imports: [CommonModule, RouterLink, MovieCardComponent, MovieFilterComponent],
  template: `
    <div class="container py-4">
      <div class="page-title-row">
        <div>
          <h1 class="page-heading">Каталог фильмов</h1>
          <p class="page-subheading">Ибрагимов А — Вариант «Каталог фильмов»</p>
        </div>

        @if (authService.isLoggedIn()) {
          <a routerLink="/movies/new" class="btn btn-primary">+ Добавить фильм</a>
        }
      </div>

      <!-- Фильтры -->
      <app-movie-filter
        [genres]="genresResource.value() ?? []"
        [initialFilters]="currentFilters()"
        (filterChange)="onFilterChanged($event)"
      />

      <!-- 4 Состояния экрана: Загрузка, Ошибка, Пусто, Данные -->

      <!-- 1. Состояние: Загрузка -->
      @if (moviesResource.isLoading()) {
        <div class="state-box state-loading">
          <div class="spinner"></div>
          <p>Загрузка каталога фильмов...</p>
        </div>
      }

      <!-- 2. Состояние: Ошибка -->
      @else if (moviesResource.error()) {
        <div class="state-box state-error">
          <h3>Ошибка загрузки данных</h3>
          <p>Не удалось подключиться к серверу API или произошла ошибка.</p>
          <button (click)="reload()" class="btn btn-secondary mt-3">Повторить попытку</button>
        </div>
      }

      <!-- 3. Состояние: Пусто -->
      @else if (!hasMovies()) {
        <div class="state-box state-empty">
          <span style="font-size: 3rem;">🎬</span>
          <h3>Фильмы не найдены</h3>
          <p>По выбранным фильтрам записей нет. Попробуйте сбросить фильтры.</p>
          @if (authService.isLoggedIn()) {
            <a routerLink="/movies/new" class="btn btn-primary mt-3">Добавить первый фильм</a>
          }
        </div>
      }

      <!-- 4. Состояние: Данные -->
      @else {
        <div class="catalog-summary">
          <span>Найдено фильмов: <strong>{{ totalCount() }}</strong></span>
          <span>Страница {{ page() }} из {{ totalPages() }}</span>
        </div>

        <div class="movies-grid">
          @for (movie of movies(); track movie.id) {
            <app-movie-card
              [movie]="movie"
              [currentUserId]="authService.currentUserId()"
              (delete)="deleteMovie($event)"
            />
          }
        </div>

        <!-- Пагинация: кнопки «Назад» и «Вперёд» -->
        <div class="pagination-controls">
          <button
            class="btn btn-secondary"
            [disabled]="page() <= 1"
            (click)="prevPage()"
          >
            ← Назад
          </button>

          <span class="pagination-info">
            Страница <strong>{{ page() }}</strong> из <strong>{{ totalPages() }}</strong>
          </span>

          <button
            class="btn btn-secondary"
            [disabled]="page() >= totalPages()"
            (click)="nextPage()"
          >
            Вперёд →
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .py-4 {
      padding-top: 2rem;
      padding-bottom: 3rem;
    }
    .page-title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .page-heading {
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .page-subheading {
      color: var(--text-muted);
      font-size: 0.95rem;
      margin-top: 0.25rem;
    }
    .catalog-summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      font-size: 0.9rem;
      color: var(--text-muted);
    }
    .movies-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.75rem;
      margin-bottom: 2.5rem;
    }
    .pagination-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1.5rem;
      margin-top: 2rem;
    }
    .pagination-info {
      font-size: 0.95rem;
      color: var(--text-muted);
    }
    .mt-3 {
      margin-top: 1rem;
    }
  `]
})
export class MovieListComponent {
  private movieService = inject(MovieService);
  authService = inject(AuthService);

  // Pagination & Filter Signals
  page = signal<number>(1);
  pageSize = signal<number>(6);
  genreId = signal<number | null>(null);
  minRating = signal<number | null>(null);
  year = signal<number | null>(null);
  sortBy = signal<'rating' | 'year'>('rating');
  sortOrder = signal<'asc' | 'desc'>('desc');

  // Active filter snapshot for child component
  currentFilters = computed<MovieFilters>(() => ({
    genreId: this.genreId(),
    minRating: this.minRating(),
    year: this.year(),
    sortBy: this.sortBy(),
    sortOrder: this.sortOrder()
  }));

  // Query parameter signal for declarative httpResource
  queryParams = computed<MoviesQueryParams>(() => ({
    page: this.page(),
    pageSize: this.pageSize(),
    genreId: this.genreId(),
    minRating: this.minRating(),
    year: this.year(),
    sortBy: this.sortBy(),
    sortOrder: this.sortOrder()
  }));

  // Modern Angular httpResource
  genresResource = this.movieService.getGenresResource();
  moviesResource = this.movieService.getMoviesResource(() => this.queryParams());

  movies = computed(() => this.moviesResource.value()?.items ?? []);
  totalCount = computed(() => this.moviesResource.value()?.total ?? 0);
  totalPages = computed(() => Math.max(1, this.moviesResource.value()?.totalPages ?? 1));
  hasMovies = computed(() => this.movies().length > 0);

  onFilterChanged(filters: MovieFilters): void {
    this.genreId.set(filters.genreId ?? null);
    this.minRating.set(filters.minRating ?? null);
    this.year.set(filters.year ?? null);
    if (filters.sortBy) this.sortBy.set(filters.sortBy);
    if (filters.sortOrder) this.sortOrder.set(filters.sortOrder);
    this.page.set(1); // Reset to page 1 upon filter change
  }

  prevPage(): void {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.update((p) => p + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  deleteMovie(id: number): void {
    this.movieService.deleteMovie(id).subscribe({
      next: () => {
        this.moviesResource.reload();
      },
      error: (err) => {
        alert(err.error?.detail || err.error?.message || 'Не удалось удалить фильм.');
      }
    });
  }

  reload(): void {
    this.moviesResource.reload();
  }
}
