import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SupplierScoringResponse, Section } from '../models/supplier-scoring.model';

@Injectable({
  providedIn: 'root'
})
export class SupplierScoringService {
  constructor(private http: HttpClient) {}

  getSupplierScoringData(limit?: number, offset?: number, sectionId?: string): Observable<SupplierScoringResponse> {
    let params = new HttpParams();
    
    if (limit !== undefined) {
      params = params.set('limit', limit.toString());
    }
    
    if (offset !== undefined) {
      params = params.set('offset', offset.toString());
    }
    
    if (sectionId) {
      params = params.set('sectionId', sectionId);
    }
    
    return this.http.get<SupplierScoringResponse>('/assets/mock-data/supplier-scoring-example.json', { params });
  }
  
  // New method to get paginated questions for a specific section
  getPaginatedQuestions(sectionId: string, limit: number = 5, offset: number = 0): Observable<Section> {
    let params = new HttpParams()
      .set('sectionId', sectionId)
      .set('limit', limit.toString())
      .set('offset', offset.toString());
    
    return this.http.get<Section>(`/assets/mock-data/supplier-scoring-example.json`, { params });
  }
} 