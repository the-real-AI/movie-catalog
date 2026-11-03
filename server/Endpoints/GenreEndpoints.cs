using Microsoft.EntityFrameworkCore;
using MovieCatalog.Server.Data;
using MovieCatalog.Server.DTOs;

namespace MovieCatalog.Server.Endpoints;

public static class GenreEndpoints
{
    public static RouteGroupBuilder MapGenreEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/genres").WithTags("Genres");

        group.MapGet("/", async (AppDbContext db) =>
        {
            var genres = await db.Genres
                .AsNoTracking()
                .OrderBy(g => g.Name)
                .Select(g => new GenreDto(g.Id, g.Name))
                .ToListAsync();

            return Results.Ok(genres);
        })
        .Produces<List<GenreDto>>(StatusCodes.Status200OK);

        return group;
    }
}
