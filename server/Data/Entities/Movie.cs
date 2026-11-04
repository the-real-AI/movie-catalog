namespace MovieCatalog.Server.Data.Entities;

public class Movie
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int Year { get; set; }
    public int Duration { get; set; }
    public double Rating { get; set; }
    public string? PosterUrl { get; set; }
    public string? WatchUrl { get; set; }


    public int GenreId { get; set; }
    public Genre Genre { get; set; } = null!;

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
