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
  visibleQuestionsCount: number = 5;
  isLoading: boolean = false;
  loadedQuestions: any[] = [];
  totalQuestionsInSection: number = 0;
  updatedScores: Map<string, Map<string, number>> = new Map(); // questionId -> (supplierId -> score)
  
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

    // Load initial data without questions
    this.loadInitialData();
  }
  
  loadInitialData(): void {
    this.isLoading = true;
    
    this.supplierScoringService.getSupplierScoringData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.supplierData = data;
        this.sections = this.supplierData.sections.sort((a, b) => a.order - b.order);
        this.suppliers = this.supplierData.suppliers;
        
        // Set the first section as current if available
        if (this.sections.length > 0) {
          this.currentSection = this.sections[0];
          this.totalQuestionsInSection = this.currentSection.questions.length;
          
          // Load first batch of questions
          this.loadQuestionsForSection(this.currentSection.id, 0, this.visibleQuestionsCount);
        }
        
        this.isLoading = false;
      });
  }
  
  loadQuestionsForSection(sectionId: string, offset: number, limit: number): void {
    this.isLoading = true;
    
    // In a real API, this would fetch only the paginated questions
    // For now, we'll simulate pagination by slicing the questions array
    const section = this.sections.find(s => s.id === sectionId);
    
    if (section) {
      // Simulate API delay
      setTimeout(() => {
        const paginatedQuestions = section.questions.slice(offset, offset + limit);
        
        // If this is the first load, replace the questions
        if (offset === 0) {
          this.loadedQuestions = paginatedQuestions;
        } else {
          // Otherwise, append the new questions
          this.loadedQuestions = [...this.loadedQuestions, ...paginatedQuestions];
        }
        
        this.isLoading = false;
      }, 500); // Simulate network delay
    } else {
      this.isLoading = false;
    }
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
    if (this.currentSection?.id === section.id) {
      this.currentSection = null;
    } else {
      this.currentSection = section;
      this.totalQuestionsInSection = section.questions.length;
      this.visibleQuestionsCount = 5;
      
      // Load first batch of questions for the new section
      this.loadQuestionsForSection(section.id, 0, this.visibleQuestionsCount);
    }
  }

  updateScore(questionId: string, supplierId: string, scoreValue: string) {
    const score = parseInt(scoreValue, 10);
    
    // Update the score in our tracking Map
    if (!this.updatedScores.has(questionId)) {
      this.updatedScores.set(questionId, new Map());
    }
    this.updatedScores.get(questionId)?.set(supplierId, score);

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
      
      // Log the update
      this.logScoreUpdate(questionId, supplierId, score);
    }
  }

  private logScoreUpdate(questionId: string, supplierId: string, score: number) {
    const question = this.sections
      .flatMap(s => s.questions)
      .find(q => q.id === questionId);
    
    const supplier = this.suppliers.find(s => s.id === supplierId);
    
    console.log('Score Updated:', {
      timestamp: new Date().toISOString(),
      question: {
        id: questionId,
        text: question?.text,
        sectionId: question?.sectionId
      },
      supplier: {
        id: supplierId,
        name: supplier?.name
      },
      score: score,
      overallScore: this.supplierData.overallScores[supplierId]
    });
  }

  getAllUpdatedData(): any {
    const updatedData = {
      timestamp: new Date().toISOString(),
      sections: this.sections,
      suppliers: this.suppliers,
      overallScores: this.supplierData.overallScores,
      scoreUpdates: Array.from(this.updatedScores.entries()).map(([questionId, supplierScores]) => ({
        questionId,
        question: this.sections.flatMap(s => s.questions).find(q => q.id === questionId)?.text,
        scores: Array.from(supplierScores.entries()).map(([supplierId, score]) => ({
          supplierId,
          supplierName: this.suppliers.find(s => s.id === supplierId)?.name,
          score
        }))
      }))
    };

    console.log('Complete Updated Data:', updatedData);
    return updatedData;
  }

  // Add a button click handler for the template
  logAllUpdatedData(): void {
    console.log('Getting all updated data...');
    this.getAllUpdatedData();
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

  getVisibleQuestions(): any[] {
    return this.loadedQuestions;
  }

  loadMoreQuestions(): void {
    console.log('Loading more questions');
    console.log('Before:', this.visibleQuestionsCount);
    
    if (this.currentSection) {
      // Load more questions for the current section
      this.loadQuestionsForSection(
        this.currentSection.id, 
        this.visibleQuestionsCount, 
        5
      );
      
      // Increase the visible count for the next load
      this.visibleQuestionsCount += 5;
      console.log('After:', this.visibleQuestionsCount);
    }
  }

  hasMoreQuestions(): boolean {
    if (!this.currentSection) return false;
    const hasMore = this.visibleQuestionsCount < this.totalQuestionsInSection;
    console.log('Has more questions:', hasMore);
    console.log('Current visible:', this.visibleQuestionsCount);
    console.log('Total available:', this.totalQuestionsInSection);
    return hasMore;
  }
} 