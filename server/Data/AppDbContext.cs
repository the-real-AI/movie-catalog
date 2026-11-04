using Microsoft.EntityFrameworkCore;
using MovieCatalog.Server.Data.Entities;

namespace MovieCatalog.Server.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Movie> Movies => Set<Movie>();
    public DbSet<Genre> Genres => Set<Genre>();
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Movie configuration
        modelBuilder.Entity<Movie>(entity =>
        {
            entity.HasKey(m => m.Id);
            entity.Property(m => m.Title).IsRequired().HasMaxLength(200);
            entity.Property(m => m.Year).IsRequired();
            entity.Property(m => m.Duration).IsRequired();
            entity.Property(m => m.Rating).IsRequired();
            entity.Property(m => m.PosterUrl).HasMaxLength(500);
            entity.Property(m => m.WatchUrl).HasMaxLength(1000);

            entity.HasOne(m => m.Genre)
                  .WithMany(g => g.Movies)
                  .HasForeignKey(m => m.GenreId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(m => m.User)
                  .WithMany(u => u.Movies)
                  .HasForeignKey(m => m.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(m => new { m.GenreId, m.Year });
            entity.HasIndex(m => m.Rating);
        });

        // Genre configuration
        modelBuilder.Entity<Genre>(entity =>
        {
            entity.HasKey(g => g.Id);
            entity.Property(g => g.Name).IsRequired().HasMaxLength(100);
        });

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.Property(u => u.Username).IsRequired().HasMaxLength(50);
            entity.HasIndex(u => u.Username).IsUnique();
            entity.Property(u => u.PasswordHash).IsRequired();
        });

        // Seed Genres (справочник)
        modelBuilder.Entity<Genre>().HasData(
            new Genre { Id = 1, Name = "Драма" },
            new Genre { Id = 2, Name = "Комедия" },
            new Genre { Id = 3, Name = "Фантастика" },
            new Genre { Id = 4, Name = "Боевик" },
            new Genre { Id = 5, Name = "Триллер" }
        );

        // Seed User (admin / Admin123!)
        // BCrypt hash for "Admin123!"
        modelBuilder.Entity<User>().HasData(
            new User
            {
                Id = 1,
                Username = "admin",
                PasswordHash = "$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            }
        );

        // Seed 5 initial movies (начальные данные через HasData: 5 записей)
        modelBuilder.Entity<Movie>().HasData(
            new Movie
            {
                Id = 1,
                Title = "Интерстеллар",
                Year = 2014,
                Duration = 169,
                Rating = 8.7,
                GenreId = 3, // Фантастика
                UserId = 1,
                PosterUrl = "/uploads/interstellar.jpg",
                WatchUrl = "https://www.kinopoisk.ru/film/258687/",
                CreatedAt = new DateTime(2026, 1, 1, 10, 0, 0, DateTimeKind.Utc)
            },
            new Movie
            {
                Id = 2,
                Title = "Побег из Шоушенка",
                Year = 1994,
                Duration = 142,
                Rating = 9.3,
                GenreId = 1, // Драма
                UserId = 1,
                PosterUrl = "/uploads/shawshank.jpg",
                WatchUrl = "https://www.kinopoisk.ru/film/326/",
                CreatedAt = new DateTime(2026, 1, 1, 11, 0, 0, DateTimeKind.Utc)
            },
            new Movie
            {
                Id = 3,
                Title = "Темный рыцарь",
                Year = 2008,
                Duration = 152,
                Rating = 9.0,
                GenreId = 4, // Боевик
                UserId = 1,
                PosterUrl = "/uploads/dark_knight.jpg",
                WatchUrl = "https://www.kinopoisk.ru/film/111543/",
                CreatedAt = new DateTime(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc)
            },
            new Movie
            {
                Id = 4,
                Title = "1+1 (Неприкасаемые)",
                Year = 2011,
                Duration = 112,
                Rating = 8.5,
                GenreId = 2, // Комедия
                UserId = 1,
                PosterUrl = "/uploads/intouchables.jpg",
                WatchUrl = "https://www.kinopoisk.ru/film/535341/",
                CreatedAt = new DateTime(2026, 1, 1, 13, 0, 0, DateTimeKind.Utc)
            },
            new Movie
            {
                Id = 5,
                Title = "Начало",
                Year = 2010,
                Duration = 148,
                Rating = 8.8,
                GenreId = 3, // Фантастика
                UserId = 1,
                PosterUrl = "/uploads/inception.jpg",
                WatchUrl = "https://www.kinopoisk.ru/film/447301/",
                CreatedAt = new DateTime(2026, 1, 1, 14, 0, 0, DateTimeKind.Utc)
            }
        );
    }
}
