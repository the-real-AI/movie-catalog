import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, httpResource } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateMovieDto,
  Genre,
  Movie,
  MovieDetail,
  PagedResult,
  UpdateMovieDto
} from '../models/movie.models';
import { environment } from '../../environments/environment';

export interface MoviesQueryParams {
  page: number;
  pageSize: number;
  genreId?: number | null;
  minRating?: number | null;
  year?: number | null;
  sortBy?: 'rating' | 'year';
  sortOrder?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root'
})
export class MovieService {
  private http = inject(HttpClient);

  // Declarative read via httpResource (Angular modern Signal Resource API)
  getMoviesResource(paramsFn: () => MoviesQueryParams) {
    return httpResource<PagedResult<Movie>>(() => {
      const p = paramsFn();
      let httpParams = new HttpParams()
        .set('page', p.page.toString())
        .set('pageSize', p.pageSize.toString());

      if (p.genreId && p.genreId > 0) {
        httpParams = httpParams.set('genreId', p.genreId.toString());
      }
      if (p.minRating !== undefined && p.minRating !== null) {
        httpParams = httpParams.set('minRating', p.minRating.toString());
      }
      if (p.year && p.year > 0) {
        httpParams = httpParams.set('year', p.year.toString());
      }
      if (p.sortBy) {
        httpParams = httpParams.set('sortBy', p.sortBy);
      }
      if (p.sortOrder) {
        httpParams = httpParams.set('sortOrder', p.sortOrder);
      }

      return {
        url: `${environment.apiUrl}/api/movies`,
        params: httpParams
      };
    });
  }

  // Declarative single item read via httpResource
  getMovieResource(idFn: () => number) {
    return httpResource<MovieDetail>(() => {
      const id = idFn();
      return {
        url: `${environment.apiUrl}/api/movies/${id}`
      };
    });
  }

  // Declarative genres list via httpResource
  getGenresResource() {
    return httpResource<Genre[]>(() => ({
      url: `${environment.apiUrl}/api/genres`
    }));
  }

  // Standard mutations via HttpClient
  createMovie(dto: CreateMovieDto): Observable<MovieDetail> {
    return this.http.post<MovieDetail>(`${environment.apiUrl}/api/movies`, dto);
  }

  updateMovie(id: number, dto: UpdateMovieDto): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}/api/movies/${id}`, dto);
  }

  deleteMovie(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/api/movies/${id}`);
  }

  uploadPoster(id: number, file: File): Observable<{ posterUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ posterUrl: string }>(`${environment.apiUrl}/api/movies/${id}/poster`, formData);
  }
}
