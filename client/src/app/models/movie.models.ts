export interface Movie {
  id: number;
  title: string;
  year: number;
  duration: number;
  rating: number;
  genreId: number;
  genreName: string;
  userId: number;
  authorName: string;
  posterUrl: string | null;
  createdAt: string;
}

export interface MovieDetail extends Movie {}

export interface Genre {
  id: number;
  name: string;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateMovieDto {
  title: string;
  year: number;
  duration: number;
  rating: number;
  genreId: number;
}

export interface UpdateMovieDto {
  title: string;
  year: number;
  duration: number;
  rating: number;
  genreId: number;
}

export interface User {
  id: number;
  username: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  userId: number;
}

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  errors?: Record<string, string[]>;
}

export interface MovieFilters {
  genreId?: number | null;
  minRating?: number | null;
  year?: number | null;
  sortBy?: 'rating' | 'year';
  sortOrder?: 'asc' | 'desc';
}
