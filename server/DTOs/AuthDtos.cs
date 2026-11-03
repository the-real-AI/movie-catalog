namespace MovieCatalog.Server.DTOs;

public record RegisterRequest(string Username, string Password);

public record LoginRequest(string Username, string Password);

public record AuthResponse(string Token, string Username, int UserId);

public record UserInfoDto(int UserId, string Username);
