using System.Security.Claims;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MovieCatalog.Server.Data;
using MovieCatalog.Server.Data.Entities;
using MovieCatalog.Server.DTOs;

namespace MovieCatalog.Server.Endpoints;

public static class MovieEndpoints
{
    public static RouteGroupBuilder MapMovieEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/movies").WithTags("Movies");

        // 1. GET /api/movies - Paginated, filtered, sorted list (Public) -> 200 OK
        group.MapGet("/", async (
            AppDbContext db,
            [FromQuery] int? page,
            [FromQuery] int? pageSize,
            [FromQuery] int? genreId,
            [FromQuery] double? minRating,
            [FromQuery] int? year,
            [FromQuery] string? sortBy,
            [FromQuery] string? sortOrder) =>
        {
            var currentPage = Math.Max(1, page ?? 1);
            var size = Math.Clamp(pageSize ?? 6, 1, 50);

            var query = db.Movies
                .Include(m => m.Genre)
                .Include(m => m.User)
                .AsNoTracking();

            // Filters
            if (genreId.HasValue && genreId > 0)
            {
                query = query.Where(m => m.GenreId == genreId.Value);
            }

            if (minRating.HasValue)
            {
                query = query.Where(m => m.Rating >= minRating.Value);
            }

            if (year.HasValue && year > 0)
            {
                query = query.Where(m => m.Year == year.Value);
            }

            // Sorting: по рейтингу или по году (asc/desc)
            var isDescending = string.Equals(sortOrder, "desc", StringComparison.OrdinalIgnoreCase);

            query = (sortBy?.ToLower()) switch
            {
                "rating" => isDescending
                    ? query.OrderByDescending(m => m.Rating).ThenByDescending(m => m.Id)
                    : query.OrderBy(m => m.Rating).ThenBy(m => m.Id),
                "year" => isDescending
                    ? query.OrderByDescending(m => m.Year).ThenByDescending(m => m.Id)
                    : query.OrderBy(m => m.Year).ThenBy(m => m.Id),
                _ => query.OrderByDescending(m => m.CreatedAt).ThenByDescending(m => m.Id)
            };

            var total = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(total / (double)size);

            var items = await query
                .Skip((currentPage - 1) * size)
                .Take(size)
                .Select(m => new MovieDto(
                    m.Id,
                    m.Title,
                    m.Year,
                    m.Duration,
                    m.Rating,
                    m.GenreId,
                    m.Genre.Name,
                    m.UserId,
                    m.User.Username,
                    m.PosterUrl,
                    m.WatchUrl,
                    m.CreatedAt
                ))
                .ToListAsync();

            return Results.Ok(new PagedResult<MovieDto>(items, total, currentPage, size, totalPages));
        })
        .Produces<PagedResult<MovieDto>>(StatusCodes.Status200OK);

        // 2. GET /api/movies/{id} - Single movie details (Public) -> 200 OK or 404
        group.MapGet("/{id:int}", async (int id, AppDbContext db) =>
        {
            var movie = await db.Movies
                .Include(m => m.Genre)
                .Include(m => m.User)
                .AsNoTracking()
                .FirstOrDefaultAsync(m => m.Id == id);

            if (movie == null)
            {
                return Results.NotFound(new { message = $"Фильм с идентификатором {id} не найден." });
            }

            return Results.Ok(new MovieDetailDto(
                movie.Id,
                movie.Title,
                movie.Year,
                movie.Duration,
                movie.Rating,
                movie.GenreId,
                movie.Genre.Name,
                movie.UserId,
                movie.User.Username,
                movie.PosterUrl,
                movie.WatchUrl,
                movie.CreatedAt
            ));
        })
        .Produces<MovieDetailDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound);

        // 3. POST /api/movies - Create movie (Authorized) -> 201 Created, 400 Bad Request, 401 Unauthorized
        group.MapPost("/", async (
            [FromBody] CreateMovieDto dto,
            IValidator<CreateMovieDto> validator,
            ClaimsPrincipal principal,
            AppDbContext db) =>
        {
            var userIdStr = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdStr == null || !int.TryParse(userIdStr, out var userId))
            {
                return Results.Unauthorized();
            }

            var validation = await validator.ValidateAsync(dto);
            if (!validation.IsValid)
            {
                var errors = validation.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
                return Results.ValidationProblem(errors);
            }

            // Genre existence check
            var genreExists = await db.Genres.AnyAsync(g => g.Id == dto.GenreId);
            if (!genreExists)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["GenreId"] = ["Выбранный жанр не существует в справочнике."]
                });
            }

            // Special rule: не больше 20 фильмов на одного пользователя!
            var userMoviesCount = await db.Movies.CountAsync(m => m.UserId == userId);
            if (userMoviesCount >= 20)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["MovieLimit"] = ["Достигнут лимит: нельзя создать более 20 фильмов на одного пользователя."]
                });
            }

            var movie = new Movie
            {
                Title = dto.Title.Trim(),
                Year = dto.Year,
                Duration = dto.Duration,
                Rating = Math.Round(dto.Rating, 1),
                GenreId = dto.GenreId,
                PosterUrl = dto.PosterUrl,
                WatchUrl = string.IsNullOrWhiteSpace(dto.WatchUrl) ? null : dto.WatchUrl.Trim(),
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            db.Movies.Add(movie);
            await db.SaveChangesAsync();

            // Load genre & user info for DTO
            await db.Entry(movie).Reference(m => m.Genre).LoadAsync();
            await db.Entry(movie).Reference(m => m.User).LoadAsync();

            var resultDto = new MovieDetailDto(
                movie.Id,
                movie.Title,
                movie.Year,
                movie.Duration,
                movie.Rating,
                movie.GenreId,
                movie.Genre.Name,
                movie.UserId,
                movie.User.Username,
                movie.PosterUrl,
                movie.WatchUrl,
                movie.CreatedAt
            );

            return Results.Created($"/api/movies/{movie.Id}", resultDto);
        })
        .RequireAuthorization()
        .Produces<MovieDetailDto>(StatusCodes.Status201Created)
        .Produces<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized);

        // 4. PUT /api/movies/{id} - Update movie (Author only) -> 204 NoContent, 400, 401, 403, 404
        group.MapPut("/{id:int}", async (
            int id,
            [FromBody] UpdateMovieDto dto,
            IValidator<UpdateMovieDto> validator,
            ClaimsPrincipal principal,
            AppDbContext db) =>
        {
            var userIdStr = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdStr == null || !int.TryParse(userIdStr, out var userId))
            {
                return Results.Unauthorized();
            }

            var movie = await db.Movies.FirstOrDefaultAsync(m => m.Id == id);
            if (movie == null)
            {
                return Results.NotFound(new { message = $"Фильм с идентификатором {id} не найден." });
            }

            // Authorization check: только автор может менять
            if (movie.UserId != userId)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status403Forbidden,
                    title: "Forbidden",
                    detail: "У вас нет прав на редактирование этого фильма. Только автор может вносить изменения."
                );
            }

            var validation = await validator.ValidateAsync(dto);
            if (!validation.IsValid)
            {
                var errors = validation.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
                return Results.ValidationProblem(errors);
            }

            var genreExists = await db.Genres.AnyAsync(g => g.Id == dto.GenreId);
            if (!genreExists)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["GenreId"] = ["Выбранный жанр не существует в справочнике."]
                });
            }

            movie.Title = dto.Title.Trim();
            movie.Year = dto.Year;
            movie.Duration = dto.Duration;
            movie.Rating = Math.Round(dto.Rating, 1);
            movie.GenreId = dto.GenreId;
            if (dto.PosterUrl != null) movie.PosterUrl = dto.PosterUrl;
            movie.WatchUrl = string.IsNullOrWhiteSpace(dto.WatchUrl) ? null : dto.WatchUrl.Trim();

            await db.SaveChangesAsync();

            return Results.NoContent();
        })
        .RequireAuthorization()
        .Produces(StatusCodes.Status204NoContent)
        .Produces<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status403Forbidden)
        .Produces(StatusCodes.Status404NotFound);

        // 5. DELETE /api/movies/{id} - Delete movie (Author only) -> 204 NoContent, 401, 403, 404
        group.MapDelete("/{id:int}", async (
            int id,
            ClaimsPrincipal principal,
            IWebHostEnvironment env,
            AppDbContext db) =>
        {
            var userIdStr = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdStr == null || !int.TryParse(userIdStr, out var userId))
            {
                return Results.Unauthorized();
            }

            var movie = await db.Movies.FirstOrDefaultAsync(m => m.Id == id);
            if (movie == null)
            {
                return Results.NotFound(new { message = $"Фильм с идентификатором {id} не найден." });
            }

            // Authorization check: только автор может удалять
            if (movie.UserId != userId)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status403Forbidden,
                    title: "Forbidden",
                    detail: "У вас нет прав на удаление этого фильма. Только автор может удалить запись."
                );
            }

            // Delete poster file if present
            if (!string.IsNullOrEmpty(movie.PosterUrl))
            {
                var relativePath = movie.PosterUrl.TrimStart('/');
                var filePath = Path.Combine(env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"), relativePath);
                if (File.Exists(filePath))
                {
                    try { File.Delete(filePath); } catch { /* ignore */ }
                }
            }

            db.Movies.Remove(movie);
            await db.SaveChangesAsync();

            return Results.NoContent();
        })
        .RequireAuthorization()
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status403Forbidden)
        .Produces(StatusCodes.Status404NotFound);

        // POST /api/movies/{id}/poster - Upload movie poster (Author only, max 5MB, jpg/png/webp, Guid filename)
        group.MapPost("/{id:int}/poster", async (
            int id,
            IFormFile file,
            ClaimsPrincipal principal,
            IWebHostEnvironment env,
            AppDbContext db) =>
        {
            var userIdStr = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdStr == null || !int.TryParse(userIdStr, out var userId))
            {
                return Results.Unauthorized();
            }

            var movie = await db.Movies.FirstOrDefaultAsync(m => m.Id == id);
            if (movie == null)
            {
                return Results.NotFound(new { message = $"Фильм с идентификатором {id} не найден." });
            }

            if (movie.UserId != userId)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status403Forbidden,
                    title: "Forbidden",
                    detail: "Только автор может загружать постер к фильму."
                );
            }

            if (file == null || file.Length == 0)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["File"] = ["Файл не выбран."]
                });
            }

            // Max 5 MB check
            const long maxFileSize = 5 * 1024 * 1024;
            if (file.Length > maxFileSize)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["File"] = ["Размер файла превышает 5 МБ."]
                });
            }

            // Allowed extensions: jpg, jpeg, png, webp
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            if (!allowedExtensions.Contains(extension))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["File"] = ["Разрешены только форматы .jpg, .jpeg, .png и .webp."]
                });
            }

            var webRoot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
            var uploadsDir = Path.Combine(webRoot, "uploads");
            Directory.CreateDirectory(uploadsDir);

            // Remove old poster if exists
            if (!string.IsNullOrEmpty(movie.PosterUrl))
            {
                var oldFilePath = Path.Combine(webRoot, movie.PosterUrl.TrimStart('/'));
                if (File.Exists(oldFilePath))
                {
                    try { File.Delete(oldFilePath); } catch { /* ignore */ }
                }
            }

            // Guid-based unique filename
            var uniqueFileName = $"{Guid.NewGuid():N}{extension}";
            var targetPath = Path.Combine(uploadsDir, uniqueFileName);

            using (var stream = new FileStream(targetPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            movie.PosterUrl = $"/uploads/{uniqueFileName}";
            await db.SaveChangesAsync();

            return Results.Ok(new { posterUrl = movie.PosterUrl });
        })
        .RequireAuthorization()
        .DisableAntiforgery()
        .Produces(StatusCodes.Status200OK)
        .Produces<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status403Forbidden)
        .Produces(StatusCodes.Status404NotFound);

        return group;
    }
}
