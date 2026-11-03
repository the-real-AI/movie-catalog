using System.Security.Claims;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MovieCatalog.Server.Data;
using MovieCatalog.Server.Data.Entities;
using MovieCatalog.Server.DTOs;
using MovieCatalog.Server.Services;

namespace MovieCatalog.Server.Endpoints;

public static class AuthEndpoints
{
    public static RouteGroupBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Authentication");

        group.MapPost("/register", async (
            [FromBody] RegisterRequest request,
            IValidator<RegisterRequest> validator,
            AppDbContext db,
            JwtTokenService jwt) =>
        {
            var validation = await validator.ValidateAsync(request);
            if (!validation.IsValid)
            {
                var errors = validation.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
                return Results.ValidationProblem(errors);
            }

            var normalizedUsername = request.Username.Trim();
            var exists = await db.Users.AnyAsync(u => u.Username.ToLower() == normalizedUsername.ToLower());
            if (exists)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["Username"] = ["Пользователь с таким именем уже существует."]
                });
            }

            var user = new User
            {
                Username = normalizedUsername,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                CreatedAt = DateTime.UtcNow
            };

            db.Users.Add(user);
            await db.SaveChangesAsync();

            var token = jwt.GenerateToken(user);
            return Results.Created($"/api/auth/me", new AuthResponse(token, user.Username, user.Id));
        })
        .Produces<AuthResponse>(StatusCodes.Status201Created)
        .Produces<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest);

        group.MapPost("/login", async (
            [FromBody] LoginRequest request,
            IValidator<LoginRequest> validator,
            AppDbContext db,
            JwtTokenService jwt) =>
        {
            var validation = await validator.ValidateAsync(request);
            if (!validation.IsValid)
            {
                var errors = validation.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
                return Results.ValidationProblem(errors);
            }

            var normalizedUsername = request.Username.Trim();
            var user = await db.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == normalizedUsername.ToLower());
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["Credentials"] = ["Неверное имя пользователя или пароль."]
                });
            }

            var token = jwt.GenerateToken(user);
            return Results.Ok(new AuthResponse(token, user.Username, user.Id));
        })
        .Produces<AuthResponse>(StatusCodes.Status200OK)
        .Produces<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest);

        group.MapGet("/me", (ClaimsPrincipal user) =>
        {
            var userIdStr = user.FindFirstValue(ClaimTypes.NameIdentifier);
            var username = user.FindFirstValue(ClaimTypes.Name);

            if (userIdStr == null || !int.TryParse(userIdStr, out var userId) || username == null)
            {
                return Results.Unauthorized();
            }

            return Results.Ok(new UserInfoDto(userId, username));
        })
        .RequireAuthorization()
        .Produces<UserInfoDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized);

        return group;
    }
}
