using System.Text;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MovieCatalog.Server.Data;
using MovieCatalog.Server.Endpoints;
using MovieCatalog.Server.Services;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Database: SQLite
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=movies.db";
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(connectionString));

// FluentValidation
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// Services
builder.Services.AddSingleton<JwtTokenService>();

// JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "MovieCatalogSecretSigningKey_2026_Minimum32CharsLong!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "MovieCatalogServer";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "MovieCatalogClient";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// CORS for Angular client
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:4200", "https://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// OpenAPI & Scalar
builder.Services.AddOpenApi();

var app = builder.Build();

// Ensure wwwroot/uploads directory exists for posters
var webRoot = app.Environment.WebRootPath ?? Path.Combine(app.Environment.ContentRootPath, "wwwroot");
var uploadsPath = Path.Combine(webRoot, "uploads");
Directory.CreateDirectory(uploadsPath);

app.UseCors();
app.UseStaticFiles();

// OpenAPI & Scalar Documentation
app.MapOpenApi();
app.MapScalarApiReference(options =>
{
    options.WithTitle("Movie Catalog API (.NET 10)")
           .WithTheme(ScalarTheme.Moon);
});

// Root redirect to Scalar API documentation
app.MapGet("/", () => Results.Redirect("/scalar/v1"));

app.UseAuthentication();
app.UseAuthorization();

// Register Minimal API Endpoints
app.MapAuthEndpoints();
app.MapGenreEndpoints();
app.MapMovieEndpoints();

// Ensure seed admin user has valid BCrypt hash for "Admin123!"
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var admin = await db.Users.FirstOrDefaultAsync(u => u.Username == "admin");
    if (admin != null && !BCrypt.Net.BCrypt.Verify("Admin123!", admin.PasswordHash))
    {
        admin.PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!");
        await db.SaveChangesAsync();
    }
}

app.Run();
