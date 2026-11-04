namespace MovieCatalog.Server.DTOs;

public record MovieDto(
    int Id,
    string Title,
    int Year,
    int Duration,
    double Rating,
    int GenreId,
    string GenreName,
    int UserId,
    string AuthorName,
    string? PosterUrl,
    string? WatchUrl,
    DateTime CreatedAt
);

public record MovieDetailDto(
    int Id,
    string Title,
    int Year,
    int Duration,
    double Rating,
    int GenreId,
    string GenreName,
    int UserId,
    string AuthorName,
    string? PosterUrl,
    string? WatchUrl,
    DateTime CreatedAt
);

public record CreateMovieDto(
    string Title,
    int Year,
    int Duration,
    double Rating,
    int GenreId,
    string? PosterUrl = null,
    string? WatchUrl = null
);

public record UpdateMovieDto(
    string Title,
    int Year,
    int Duration,
    double Rating,
    int GenreId,
    string? PosterUrl = null,
    string? WatchUrl = null
);

public record PagedResult<T>(
    List<T> Items,
    int Total,
    int Page,
    int PageSize,
    int TotalPages
);
