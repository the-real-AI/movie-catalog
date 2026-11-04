using FluentValidation;
using MovieCatalog.Server.Data;
using MovieCatalog.Server.DTOs;

namespace MovieCatalog.Server.Validators;

public class CreateMovieDtoValidator : AbstractValidator<CreateMovieDto>
{
    public CreateMovieDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Название фильма обязательно для заполнения.")
            .MaximumLength(200).WithMessage("Название не должно превышать 200 символов.");

        RuleFor(x => x.Year)
            .InclusiveBetween(1895, DateTime.UtcNow.Year + 5)
            .WithMessage($"Год выпуска должен быть в диапазоне от 1895 до {DateTime.UtcNow.Year + 5}.");

        RuleFor(x => x.Duration)
            .GreaterThan(0).WithMessage("Длительность должна быть больше 0 минут.")
            .LessThanOrEqualTo(1000).WithMessage("Длительность не должна превышать 1000 минут.");

        RuleFor(x => x.Rating)
            .InclusiveBetween(0.0, 10.0).WithMessage("Рейтинг должен быть в диапазоне от 0.0 до 10.0.");

        RuleFor(x => x.GenreId)
            .GreaterThan(0).WithMessage("Необходимо выбрать жанр из справочника.");

        RuleFor(x => x.WatchUrl)
            .Must(uri => string.IsNullOrEmpty(uri) || Uri.TryCreate(uri, UriKind.Absolute, out _))
            .WithMessage("Ссылка на просмотр должна быть корректным URL (например, https://...).")
            .MaximumLength(1000).WithMessage("Ссылка не должна превышать 1000 символов.");
    }
}

public class UpdateMovieDtoValidator : AbstractValidator<UpdateMovieDto>
{
    public UpdateMovieDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Название фильма обязательно для заполнения.")
            .MaximumLength(200).WithMessage("Название не должно превышать 200 символов.");

        RuleFor(x => x.Year)
            .InclusiveBetween(1895, DateTime.UtcNow.Year + 5)
            .WithMessage($"Год выпуска должен быть в диапазоне от 1895 до {DateTime.UtcNow.Year + 5}.");

        RuleFor(x => x.Duration)
            .GreaterThan(0).WithMessage("Длительность должна быть больше 0 минут.")
            .LessThanOrEqualTo(1000).WithMessage("Длительность не должна превышать 1000 минут.");

        RuleFor(x => x.Rating)
            .InclusiveBetween(0.0, 10.0).WithMessage("Рейтинг должен быть в диапазоне от 0.0 до 10.0.");

        RuleFor(x => x.GenreId)
            .GreaterThan(0).WithMessage("Необходимо выбрать жанр из справочника.");

        RuleFor(x => x.WatchUrl)
            .Must(uri => string.IsNullOrEmpty(uri) || Uri.TryCreate(uri, UriKind.Absolute, out _))
            .WithMessage("Ссылка на просмотр должна быть корректным URL (например, https://...).")
            .MaximumLength(1000).WithMessage("Ссылка не должна превышать 1000 символов.");
    }
}

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("Имя пользователя обязательно.")
            .MinimumLength(3).WithMessage("Имя пользователя должно содержать минимум 3 символа.")
            .MaximumLength(50).WithMessage("Имя пользователя не должно превышать 50 символов.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Пароль обязателен.")
            .MinimumLength(6).WithMessage("Пароль должен содержать минимум 6 символов.");
    }
}

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Username).NotEmpty().WithMessage("Имя пользователя обязательно.");
        RuleFor(x => x.Password).NotEmpty().WithMessage("Пароль обязателен.");
    }
}
