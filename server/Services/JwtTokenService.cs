using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using MovieCatalog.Server.Data.Entities;

namespace MovieCatalog.Server.Services;

public class JwtTokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(User user)
    {
        // Keep token generation aligned with the JWT validation settings in Program.cs.
        // The configured key is preferred; this development fallback lets a fresh
        // Codespace run without requiring per-user dotnet secrets.
        var key = _configuration["Jwt:Key"]
            ?? "MovieCatalogSecretSigningKey_2026_Minimum32CharsLong!";
        var issuer = _configuration["Jwt:Issuer"] ?? "MovieCatalogServer";
        var audience = _configuration["Jwt:Audience"] ?? "MovieCatalogClient";

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username)
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
