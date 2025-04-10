import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, NgZone, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { fromEvent, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SupplierScoringResponse, Section, Supplier } from '../../models/supplier-scoring.model';
import { SupplierScoringService } from '../../services/supplier-scoring.service';

@Component({
  selector: 'app-supplier-scoring',
  templateUrl: './supplier-scoring.component.html',
  styleUrls: ['./supplier-scoring.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule]
})
export class SupplierScoringComponent implements OnInit, AfterViewInit, OnDestroy {
  supplierData!: SupplierScoringResponse;
  sections: Section[] = [];
  suppliers: Supplier[] = [];
  currentSection: Section | null = null;
  
  @ViewChild('suppliersContent') suppliersContent!: ElementRef<HTMLElement>;
  @ViewChild('suppliersHeader') suppliersHeader!: ElementRef<HTMLElement>;

  private destroy$ = new Subject<void>();

  constructor(
    private ngZone: NgZone,
    private supplierScoringService: SupplierScoringService
  ) {}

  ngOnInit(): void {
    // Initialize with empty data structure
    this.supplierData = {
      sections: [],
      suppliers: [],
      overallScores: {}
    };

    // Load data from service
    this.supplierScoringService.getSupplierScoringData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.supplierData = data;
        this.sections = this.supplierData.sections.sort((a, b) => a.order - b.order);
        this.suppliers = this.supplierData.suppliers;
        this.currentSection = this.sections[0];
      });
  }
  
  ngAfterViewInit(): void {
    // Wait for next tick to ensure DOM is ready
    setTimeout(() => {
      this.setupScrollSync();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupScrollSync(): void {
    if (!this.suppliersContent?.nativeElement || !this.suppliersHeader?.nativeElement) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const content = this.suppliersContent.nativeElement;
      const header = this.suppliersHeader.nativeElement;
      let isScrolling = false;

      const syncScroll = (source: HTMLElement, target: HTMLElement) => {
        if (!isScrolling) {
          isScrolling = true;
          target.scrollLeft = source.scrollLeft;
          requestAnimationFrame(() => {
            isScrolling = false;
          });
        }
      };

      // Sync content scroll to header
      fromEvent(content, 'scroll').pipe(
        takeUntil(this.destroy$)
      ).subscribe(() => {
        syncScroll(content, header);
      });

      // Sync header scroll to content
      fromEvent(header, 'scroll').pipe(
        takeUntil(this.destroy$)
      ).subscribe(() => {
        syncScroll(header, content);
      });

      // Handle wheel events on header
      fromEvent(header, 'wheel').pipe(
        takeUntil(this.destroy$)
      ).subscribe((e: Event) => {
        const wheelEvent = e as WheelEvent;
        if (Math.abs(wheelEvent.deltaX) > Math.abs(wheelEvent.deltaY)) {
          wheelEvent.preventDefault();
          content.scrollLeft += wheelEvent.deltaX;
        }
      });
    });
  }

  getScoreClass(score: number): string {
    if (score >= 75) return 'positive';
    if (score >= 50) return 'average';
    return 'negative';
  }

  getScoreStatus(score: number): 'Positive' | 'Average' | 'Negative' {
    if (score >= 75) return 'Positive';
    if (score >= 50) return 'Average';
    return 'Negative';
  }

  toggleSection(section: Section) {
    this.currentSection = this.currentSection?.id === section.id ? null : section;
  }

  updateScore(questionId: string, supplierId: string, scoreValue: string) {
    const score = parseInt(scoreValue, 10);
    if (isNaN(score)) return;

    const question = this.sections
      .flatMap(s => s.questions)
      .find(q => q.id === questionId);
    
    if (question) {
      if (!question.responses[supplierId]) {
        question.responses[supplierId] = {
          id: `resp-${questionId}-${supplierId}`,
          questionId,
          supplierId,
          score,
          answer: '',
          comments: [],
          attachments: [],
          lastUpdated: new Date().toISOString()
        };
      } else {
        question.responses[supplierId].score = score;
        question.responses[supplierId].lastUpdated = new Date().toISOString();
      }

      // Update overall scores
      this.updateOverallScore(supplierId);
    }
  }

  private updateOverallScore(supplierId: string) {
    const supplierResponses = this.sections
      .flatMap(s => s.questions)
      .map(q => q.responses[supplierId])
      .filter(r => r !== undefined);

    const totalScore = supplierResponses.reduce((sum, response) => sum + response.score, 0);
    const maxPossibleScore = this.sections.flatMap(s => s.questions).length * 10;
    const percentage = Math.round((totalScore / maxPossibleScore) * 100);

    this.supplierData.overallScores[supplierId] = {
      score: totalScore,
      status: this.getScoreStatus(percentage),
      percentage
    };

    // Update supplier's current score
    const supplier = this.suppliers.find(s => s.id === supplierId);
    if (supplier) {
      supplier.currentScore = percentage;
    }
  }

  applyScoreToAll(questionId: string, score: number) {
    const question = this.sections
      .flatMap(s => s.questions)
      .find(q => q.id === questionId);
    
    if (question && question.applyToAllSuppliers) {
      this.suppliers.forEach(supplier => {
        this.updateScore(questionId, supplier.id, score.toString());
      });
    }
  }

  getTotalQuestions(): number {
    return this.sections.reduce((total, section) => total + section.questions.length, 0);
  }
} 