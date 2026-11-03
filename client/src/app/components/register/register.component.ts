import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="container py-4">
      <div class="auth-card">
        <div class="auth-header">
          <span style="font-size: 2.5rem;">📝</span>
          <h1 class="auth-title">Регистрация</h1>
          <p class="auth-subtitle">Создайте новый профиль в каталоге фильмов</p>
        </div>

        @if (errorMessage()) {
          <div class="alert-box alert-danger">
            {{ errorMessage() }}
          </div>
        }

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label" for="reg-username">Имя пользователя (от 3 до 50 симв.) *</label>
            <input
              id="reg-username"
              type="text"
              class="form-control"
              placeholder="Придумайте логин"
              formControlName="username"
              [class.is-invalid]="isFieldInvalid('username') || serverErrors()['Username']"
            />
            @if (isFieldInvalid('username')) {
              <p class="field-error">Имя пользователя должно содержать от 3 до 50 символов.</p>
            }
            @if (serverErrors()['Username']) {
              <p class="field-error">{{ serverErrors()['Username'][0] }}</p>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-password">Пароль (от 6 символов) *</label>
            <input
              id="reg-password"
              type="password"
              class="form-control"
              placeholder="Придумайте пароль"
              formControlName="password"
              [class.is-invalid]="isFieldInvalid('password') || serverErrors()['Password']"
            />
            @if (isFieldInvalid('password')) {
              <p class="field-error">Пароль должен содержать минимум 6 символов.</p>
            }
            @if (serverErrors()['Password']) {
              <p class="field-error">{{ serverErrors()['Password'][0] }}</p>
            }
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-block"
            [disabled]="isLoading() || registerForm.invalid"
          >
            {{ isLoading() ? 'Регистрация...' : 'Зарегистрироваться' }}
          </button>
        </form>

        <div class="auth-footer">
          <span>Уже есть аккаунт?</span>
          <a routerLink="/login">Войти</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .py-4 { padding-top: 3rem; padding-bottom: 3rem; }
    .auth-card {
      max-width: 440px;
      margin: 0 auto;
      background-color: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 2.5rem;
    }
    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .auth-title {
      font-size: 1.6rem;
      font-weight: 700;
      margin: 0.5rem 0 0.25rem;
    }
    .auth-subtitle {
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    .btn-block {
      width: 100%;
      margin-top: 1rem;
      padding: 0.75rem;
    }
    .auth-footer {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.9rem;
      color: var(--text-muted);
      display: flex;
      justify-content: center;
      gap: 0.5rem;
    }
    .alert-box {
      padding: 0.75rem 1rem;
      border-radius: 8px;
      margin-bottom: 1.25rem;
      font-size: 0.85rem;
    }
    .alert-danger {
      background-color: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #fca5a5;
    }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  serverErrors = signal<Record<string, string[]>>({});

  registerForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  isFieldInvalid(field: string): boolean {
    const ctrl = this.registerForm.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.serverErrors.set({});

    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/movies']);
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err.status === 400 && err.error?.errors) {
          this.serverErrors.set(err.error.errors);
          const firstKey = Object.keys(err.error.errors)[0];
          this.errorMessage.set(err.error.errors[firstKey][0]);
        } else {
          this.errorMessage.set(err.error?.detail || err.error?.message || 'Ошибка регистрации.');
        }
      }
    });
  }
}
