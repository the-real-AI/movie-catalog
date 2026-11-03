import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="container py-4">
      <div class="auth-card">
        <div class="auth-header">
          <span style="font-size: 2.5rem;">🔐</span>
          <h1 class="auth-title">Вход в систему</h1>
          <p class="auth-subtitle">Войдите, чтобы добавлять и редактировать фильмы</p>
        </div>

        @if (errorMessage()) {
          <div class="alert-box alert-danger">
            {{ errorMessage() }}
          </div>
        }

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label" for="username">Имя пользователя</label>
            <input
              id="username"
              type="text"
              class="form-control"
              placeholder="Введите имя пользователя"
              formControlName="username"
              [class.is-invalid]="isFieldInvalid('username')"
            />
            @if (isFieldInvalid('username')) {
              <p class="field-error">Имя пользователя обязательно.</p>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Пароль</label>
            <input
              id="password"
              type="password"
              class="form-control"
              placeholder="Введите пароль"
              formControlName="password"
              [class.is-invalid]="isFieldInvalid('password')"
            />
            @if (isFieldInvalid('password')) {
              <p class="field-error">Пароль обязателен.</p>
            }
          </div>

          <div class="test-creds">
            <strong>Тестовый аккаунт для преподавателя:</strong>
            <code>admin</code> / <code>Admin123!</code>
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-block"
            [disabled]="isLoading() || loginForm.invalid"
          >
            {{ isLoading() ? 'Выполняется вход...' : 'Войти' }}
          </button>
        </form>

        <div class="auth-footer">
          <span>Нет аккаунта?</span>
          <a routerLink="/register">Зарегистрироваться</a>
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
    .test-creds {
      background: rgba(99, 102, 241, 0.1);
      border: 1px solid rgba(99, 102, 241, 0.25);
      border-radius: 8px;
      padding: 0.75rem;
      font-size: 0.8rem;
      margin-bottom: 1rem;
      color: #c7d2fe;
    }
    .test-creds code {
      background: #1e1b4b;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
      color: #a5b4fc;
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
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  loginForm: FormGroup = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  isFieldInvalid(field: string): boolean {
    const ctrl = this.loginForm.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.isLoading.set(false);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/movies';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.isLoading.set(false);
        const problemErrors = err.error?.errors;
        if (problemErrors) {
          const firstKey = Object.keys(problemErrors)[0];
          this.errorMessage.set(problemErrors[firstKey][0]);
        } else {
          this.errorMessage.set(err.error?.detail || err.error?.message || 'Неверный логин или пароль.');
        }
      }
    });
  }
}
