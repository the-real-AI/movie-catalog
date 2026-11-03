using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class AddMovieFilterSortIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Movies_GenreId",
                table: "Movies");

            migrationBuilder.CreateIndex(
                name: "IX_Movies_GenreId_Year",
                table: "Movies",
                columns: new[] { "GenreId", "Year" });

            migrationBuilder.CreateIndex(
                name: "IX_Movies_Rating",
                table: "Movies",
                column: "Rating");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Movies_GenreId_Year",
                table: "Movies");

            migrationBuilder.DropIndex(
                name: "IX_Movies_Rating",
                table: "Movies");

            migrationBuilder.CreateIndex(
                name: "IX_Movies_GenreId",
                table: "Movies",
                column: "GenreId");
        }
    }
}
