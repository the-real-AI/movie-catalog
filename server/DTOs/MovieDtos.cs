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
    DateTime CreatedAt
);

public record CreateMovieDto(
    string Title,
    int Year,
    int Duration,
    double Rating,
    int GenreId
);

public record UpdateMovieDto(
    string Title,
    int Year,
    int Duration,
    double Rating,
    int GenreId
);

public record PagedResult<T>(
    List<T> Items,
    int Total,
    int Page,
    int PageSize,
    int TotalPages
);
