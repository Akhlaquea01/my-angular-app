import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SupplierScoringResponse } from '../models/supplier-scoring.model';

@Injectable({
  providedIn: 'root'
})
export class SupplierScoringService {
  constructor(private http: HttpClient) {}

  getSupplierScoringData(): Observable<SupplierScoringResponse> {
    return this.http.get<SupplierScoringResponse>('/assets/mock-data/supplier-scoring-example.json');
  }
} 