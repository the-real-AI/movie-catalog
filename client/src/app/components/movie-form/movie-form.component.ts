import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MovieService } from '../../services/movie.service';
import { CreateMovieDto, Genre, UpdateMovieDto } from '../../models/movie.models';

@Component({
  selector: 'app-movie-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="container py-4">
      <div class="form-card">
        <div class="form-header">
          <h1 class="form-title">
            {{ isEditMode() ? 'Редактирование фильма' : 'Добавление нового фильма' }}
          </h1>
          <p class="form-subtitle">
            Заполните данные о фильме в соответствии с требованиями каталога
          </p>
        </div>

        <!-- Особая ошибка сервера (например, лимит 20 фильмов) -->
        @if (generalServerError()) {
          <div class="alert-box alert-danger">
            <strong>Ошибка сервера:</strong> {{ generalServerError() }}
          </div>
        }

        <form [formGroup]="movieForm" (ngSubmit)="onSubmit()">
          <!-- Название -->
          <div class="form-group">
            <label class="form-label" for="title">Название фильма *</label>
            <input
              id="title"
              type="text"
              class="form-control"
              placeholder="Например, Интерстеллар"
              formControlName="title"
              [class.is-invalid]="isFieldInvalid('title') || serverErrors()['Title']"
            />
            @if (isFieldInvalid('title')) {
              <p class="field-error">Название обязательно (до 200 символов).</p>
            }
            @if (serverErrors()['Title']) {
              <p class="field-error">{{ serverErrors()['Title'][0] }}</p>
            }
          </div>

          <div class="form-row-2">
            <!-- Год выпуска -->
            <div class="form-group">
              <label class="form-label" for="year">Год выпуска (1895–{{ maxYear }}) *</label>
              <input
                id="year"
                type="number"
                class="form-control"
                placeholder="2024"
                formControlName="year"
                [class.is-invalid]="isFieldInvalid('year') || serverErrors()['Year']"
              />
              @if (isFieldInvalid('year')) {
                <p class="field-error">Год должен быть в диапазоне от 1895 до {{ maxYear }}.</p>
              }
              @if (serverErrors()['Year']) {
                <p class="field-error">{{ serverErrors()['Year'][0] }}</p>
              }
            </div>

            <!-- Длительность -->
            <div class="form-group">
              <label class="form-label" for="duration">Длительность (в минутах) *</label>
              <input
                id="duration"
                type="number"
                class="form-control"
                placeholder="120"
                formControlName="duration"
                [class.is-invalid]="isFieldInvalid('duration') || serverErrors()['Duration']"
              />
              @if (isFieldInvalid('duration')) {
                <p class="field-error">Длительность должна быть от 1 до 1000 минут.</p>
              }
              @if (serverErrors()['Duration']) {
                <p class="field-error">{{ serverErrors()['Duration'][0] }}</p>
              }
            </div>
          </div>

          <div class="form-row-2">
            <!-- Рейтинг -->
            <div class="form-group">
              <label class="form-label" for="rating">Рейтинг (0.0 – 10.0) *</label>
              <input
                id="rating"
                type="number"
                step="0.1"
                min="0"
                max="10"
                class="form-control"
                placeholder="8.5"
                formControlName="rating"
                [class.is-invalid]="isFieldInvalid('rating') || serverErrors()['Rating']"
              />
              @if (isFieldInvalid('rating')) {
                <p class="field-error">Рейтинг должен быть от 0.0 до 10.0.</p>
              }
              @if (serverErrors()['Rating']) {
                <p class="field-error">{{ serverErrors()['Rating'][0] }}</p>
              }
            </div>

            <!-- Жанр (Справочник) -->
            <div class="form-group">
              <label class="form-label" for="genreId">Жанр (из справочника) *</label>
              <select
                id="genreId"
                class="form-control"
                formControlName="genreId"
                [class.is-invalid]="isFieldInvalid('genreId') || serverErrors()['GenreId']"
              >
                <option [ngValue]="null" disabled>Выберите жанр...</option>
                @for (genre of genres(); track genre.id) {
                  <option [ngValue]="genre.id">{{ genre.name }}</option>
                }
              </select>
              @if (isFieldInvalid('genreId')) {
                <p class="field-error">Пожалуйста, выберите жанр.</p>
              }
              @if (serverErrors()['GenreId']) {
                <p class="field-error">{{ serverErrors()['GenreId'][0] }}</p>
              }
            </div>
          </div>

          <!-- Кнопки отправки -->
          <div class="form-actions">
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="isSubmitting() || movieForm.invalid"
            >
              {{ isSubmitting() ? 'Сохранение...' : (isEditMode() ? 'Сохранить изменения' : 'Создать фильм') }}
            </button>
            <a routerLink="/movies" class="btn btn-secondary">Отмена</a>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .py-4 { padding-top: 2rem; padding-bottom: 3rem; }
    .form-card {
      max-width: 650px;
      margin: 0 auto;
      background-color: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 2.5rem;
    }
    .form-header {
      margin-bottom: 2rem;
    }
    .form-title {
      font-size: 1.75rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    .form-subtitle {
      color: var(--text-muted);
      font-size: 0.95rem;
    }
    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
    }
    @media (max-width: 600px) {
      .form-row-2 { grid-template-columns: 1fr; }
    }
    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
    }
    .is-invalid {
      border-color: var(--danger) !important;
    }
    .alert-box {
      padding: 1rem 1.25rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
    }
    .alert-danger {
      background-color: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #fca5a5;
    }
  `]
})
export class MovieFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private movieService = inject(MovieService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  maxYear = new Date().getFullYear() + 5;
  isEditMode = signal<boolean>(false);
  movieId = signal<number | null>(null);
  isSubmitting = signal<boolean>(false);
  serverErrors = signal<Record<string, string[]>>({});
  generalServerError = signal<string | null>(null);

  genresResource = this.movieService.getGenresResource();
  genres = signal<Genre[]>([]);

  movieForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    year: [new Date().getFullYear(), [Validators.required, Validators.min(1895), Validators.max(this.maxYear)]],
    duration: [120, [Validators.required, Validators.min(1), Validators.max(1000)]],
    rating: [8.0, [Validators.required, Validators.min(0), Validators.max(10)]],
    genreId: [null, [Validators.required, Validators.min(1)]]
  });

  ngOnInit(): void {
    // Genres from resource
    const sub = this.genresResource.value;
    // Set genres when ready
    setInterval(() => {
      const val = this.genresResource.value();
      if (val && this.genres().length === 0) {
        this.genres.set(val);
      }
    }, 100);

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode.set(true);
      const id = Number(idParam);
      this.movieId.set(id);

      // Fetch existing movie to populate form
      const resource = this.movieService.getMovieResource(() => id);
      const checkInterval = setInterval(() => {
        const movie = resource.value();
        if (movie) {
          this.movieForm.patchValue({
            title: movie.title,
            year: movie.year,
            duration: movie.duration,
            rating: movie.rating,
            genreId: movie.genreId
          });
          clearInterval(checkInterval);
        }
      }, 100);
    }
  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.movieForm.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  onSubmit(): void {
    this.serverErrors.set({});
    this.generalServerError.set(null);

    if (this.movieForm.invalid) {
      this.movieForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formVal = this.movieForm.value;

    if (this.isEditMode()) {
      const dto: UpdateMovieDto = {
        title: formVal.title,
        year: Number(formVal.year),
        duration: Number(formVal.duration),
        rating: Number(formVal.rating),
        genreId: Number(formVal.genreId)
      };

      this.movieService.updateMovie(this.movieId()!, dto).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.router.navigate(['/movies', this.movieId()]);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.handleServerErrors(err);
        }
      });
    } else {
      const dto: CreateMovieDto = {
        title: formVal.title,
        year: Number(formVal.year),
        duration: Number(formVal.duration),
        rating: Number(formVal.rating),
        genreId: Number(formVal.genreId)
      };

      this.movieService.createMovie(dto).subscribe({
        next: (created) => {
          this.isSubmitting.set(false);
          this.router.navigate(['/movies', created.id]);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.handleServerErrors(err);
        }
      });
    }
  }

  private handleServerErrors(err: any): void {
    if (err.status === 400 && err.error?.errors) {
      this.serverErrors.set(err.error.errors);

      // Check for special limit error: "MovieLimit" or "User"
      const limitErr = err.error.errors['MovieLimit'] || err.error.errors['User'];
      if (limitErr && limitErr.length > 0) {
        this.generalServerError.set(limitErr[0]);
      }
    } else if (err.status === 403) {
      this.generalServerError.set(err.error?.detail || 'У вас нет прав на редактирование этого фильма.');
    } else if (err.status === 401) {
      this.generalServerError.set('Сессия истекла. Пожалуйста, выполните вход повторно.');
    } else {
      this.generalServerError.set(err.error?.detail || err.error?.message || 'Произошла непредвиденная ошибка на сервере.');
    }
  }
}
