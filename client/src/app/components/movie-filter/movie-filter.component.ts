import { Component, effect, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Genre, MovieFilters } from '../../models/movie.models';

@Component({
  selector: 'app-movie-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="filter-panel">
      <div class="filter-header">
        <h2>Фильтры и сортировка</h2>
        <button (click)="onReset()" class="btn-text">Сбросить</button>
      </div>

      <div class="filter-grid">
        <!-- Жанр -->
        <div class="form-group">
          <label class="form-label" for="filter-genre">Жанр:</label>
          <select
            id="filter-genre"
            class="form-control"
            [ngModel]="selectedGenreId()"
            (ngModelChange)="onGenreChange($event)"
          >
            <option [ngValue]="null">Все жанры</option>
            @for (genre of genres(); track genre.id) {
              <option [ngValue]="genre.id">{{ genre.name }}</option>
            }
          </select>
        </div>

        <!-- Рейтинг от -->
        <div class="form-group">
          <label class="form-label" for="filter-rating">
            Рейтинг от: <strong>{{ minRating() ?? 0 }}</strong>
          </label>
          <input
            id="filter-rating"
            type="range"
            min="0"
            max="10"
            step="0.5"
            class="range-control"
            [ngModel]="minRating() ?? 0"
            (ngModelChange)="onRatingChange($event)"
          />
        </div>

        <!-- Год -->
        <div class="form-group">
          <label class="form-label" for="filter-year">Год:</label>
          <input
            id="filter-year"
            type="number"
            placeholder="Например, 2024"
            class="form-control"
            [ngModel]="year()"
            (ngModelChange)="onYearChange($event)"
          />
        </div>

        <!-- Сортировка -->
        <div class="form-group">
          <label class="form-label" for="filter-sort">Сортировать по:</label>
          <div class="sort-controls">
            <select
              id="filter-sort"
              class="form-control"
              [ngModel]="sortBy()"
              (ngModelChange)="onSortByChange($event)"
            >
              <option value="rating">По рейтингу</option>
              <option value="year">По году выпуска</option>
            </select>

            <button
              type="button"
              (click)="toggleOrder()"
              class="btn btn-secondary btn-icon"
              [title]="sortOrder() === 'desc' ? 'По убыванию' : 'По возрастанию'"
            >
              {{ sortOrder() === 'desc' ? '↓ Убыв.' : '↑ Возр.' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filter-panel {
      background-color: var(--bg-card);
      border-radius: var(--radius);
      border: 1px solid var(--border);
      padding: 1.5rem;
      margin-bottom: 2rem;
    }
    .filter-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }
    .filter-header h2 {
      font-size: 1.15rem;
      font-weight: 600;
    }
    .btn-text {
      background: none;
      color: var(--text-muted);
      font-size: 0.85rem;
      text-decoration: underline;
    }
    .btn-text:hover {
      color: var(--primary);
    }
    .filter-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
    }
    .range-control {
      width: 100%;
      accent-color: var(--primary);
      cursor: pointer;
    }
    .sort-controls {
      display: flex;
      gap: 0.5rem;
    }
    .btn-icon {
      padding: 0.65rem 0.9rem;
      white-space: nowrap;
      font-size: 0.85rem;
    }
  `]
})
export class MovieFilterComponent {
  genres = input.required<Genre[]>();
  initialFilters = input<MovieFilters>({});

  filterChange = output<MovieFilters>();

  selectedGenreId = signal<number | null>(null);
  minRating = signal<number | null>(null);
  year = signal<number | null>(null);
  sortBy = signal<'rating' | 'year'>('rating');
  sortOrder = signal<'asc' | 'desc'>('desc');

  constructor() {
    effect(() => {
      const init = this.initialFilters();
      if (init.genreId !== undefined) this.selectedGenreId.set(init.genreId);
      if (init.minRating !== undefined) this.minRating.set(init.minRating);
      if (init.year !== undefined) this.year.set(init.year);
      if (init.sortBy) this.sortBy.set(init.sortBy);
      if (init.sortOrder) this.sortOrder.set(init.sortOrder);
    });
  }

  onGenreChange(val: number | null): void {
    this.selectedGenreId.set(val ? Number(val) : null);
    this.emitChange();
  }

  onRatingChange(val: number): void {
    this.minRating.set(val > 0 ? val : null);
    this.emitChange();
  }

  onYearChange(val: number | null): void {
    this.year.set(val ? Number(val) : null);
    this.emitChange();
  }

  onSortByChange(val: 'rating' | 'year'): void {
    this.sortBy.set(val);
    this.emitChange();
  }

  toggleOrder(): void {
    this.sortOrder.set(this.sortOrder() === 'desc' ? 'asc' : 'desc');
    this.emitChange();
  }

  onReset(): void {
    this.selectedGenreId.set(null);
    this.minRating.set(null);
    this.year.set(null);
    this.sortBy.set('rating');
    this.sortOrder.set('desc');
    this.emitChange();
  }

  private emitChange(): void {
    this.filterChange.emit({
      genreId: this.selectedGenreId(),
      minRating: this.minRating(),
      year: this.year(),
      sortBy: this.sortBy(),
      sortOrder: this.sortOrder()
    });
  }
}
