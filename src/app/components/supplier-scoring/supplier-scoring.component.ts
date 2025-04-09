import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, NgZone, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { fromEvent, Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

interface Question {
  id: number;
  text: string;
  applyForAll: boolean;
  score: number;
}

interface Supplier {
  id: number;
  name: string;
  code: string;
  answersCount: number;
  totalQuestions: number;
  score: number;
  status: 'positive' | 'average' | 'negative';
  answers: SupplierAnswer[];
}

interface SupplierAnswer {
  questionId: number;
  answer: string;
  score: number;
  hasAttachments: boolean;
}

@Component({
  selector: 'app-supplier-scoring',
  templateUrl: './supplier-scoring.component.html',
  styleUrls: ['./supplier-scoring.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class SupplierScoringComponent implements OnInit, AfterViewInit, OnDestroy {
  questions: Question[] = [];
  suppliers: Supplier[] = [];
  overallQuestions: number = 0;
  
  @ViewChild('questionsContent') questionsContent!: ElementRef<HTMLElement>;
  @ViewChild('suppliersContent') suppliersContent!: ElementRef<HTMLElement>;
  @ViewChild('suppliersHeader') suppliersHeader!: ElementRef<HTMLElement>;

  private isScrolling = false;
  private destroy$ = new Subject<void>();

  constructor(private ngZone: NgZone) {
    this.initializeData();
  }

  ngOnInit(): void {
    // Initialization logic
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

  private initializeData(): void {
    // Initialize questions
    this.questions = [
      {
        id: 1,
        text: 'What is your company\'s core expertise and primary product or service offerings?',
        applyForAll: false,
        score: 0
      },
      {
        id: 2,
        text: 'What is your company\'s core expertise and primary product or service offerings?',
        applyForAll: true,
        score: 0
      },
      {
        id: 3,
        text: 'What is your company\'s core expertise and primary product or service offerings?',
        applyForAll: false,
        score: 0
      }
    ];

    // Initialize suppliers
    this.suppliers = [
      {
        id: 1,
        name: 'Supplier 1',
        code: '12345678',
        answersCount: 10,
        totalQuestions: 10,
        score: 80,
        status: 'positive',
        answers: this.generateAnswers(1)
      },
      {
        id: 2,
        name: 'Supplier 2',
        code: '12345678',
        answersCount: 10,
        totalQuestions: 10,
        score: 50,
        status: 'average',
        answers: this.generateAnswers(2)
      },
      {
        id: 3,
        name: 'Supplier 3',
        code: '12345678',
        answersCount: 10,
        totalQuestions: 10,
        score: 30,
        status: 'negative',
        answers: this.generateAnswers(3)
      },
      {
        id: 4,
        name: 'Supplier 4',
        code: '12345678',
        answersCount: 10,
        totalQuestions: 10,
        score: 75,
        status: 'positive',
        answers: this.generateAnswers(4)
      }
    ];

    this.overallQuestions = this.questions.length;
  }

  private generateAnswers(supplierId: number): SupplierAnswer[] {
    return this.questions.map(question => ({
      questionId: question.id,
      answer: `Our company specializes in [core expertise], and our primary products/services include [specific products or services]`,
      score: 10,
      hasAttachments: question.id === 3
    }));
  }

  private setupScrollSync(): void {
    if (!this.questionsContent?.nativeElement || !this.suppliersContent?.nativeElement || !this.suppliersHeader?.nativeElement) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      let scrollTimeout: number;

      const syncScroll = (source: HTMLElement, target: HTMLElement, isHorizontal = false) => {
        if (this.isScrolling) return;
        
        this.isScrolling = true;
        
        if (isHorizontal) {
          // For horizontal scroll, sync immediately
          target.scrollLeft = source.scrollLeft;
        } else {
          // For vertical scroll, use ratio calculation
          const sourceScrollRatio = source.scrollTop / (source.scrollHeight - source.clientHeight);
          const targetScrollPosition = Math.round(sourceScrollRatio * (target.scrollHeight - target.clientHeight));
          
          if (target.scrollTop !== targetScrollPosition) {
            target.scrollTop = targetScrollPosition;
          }
        }

        // Clear any existing timeout
        if (scrollTimeout) {
          window.clearTimeout(scrollTimeout);
        }
        
        // Set a new timeout to reset isScrolling
        scrollTimeout = window.setTimeout(() => {
          this.isScrolling = false;
        }, 50);
      };

      // Questions scroll - vertical only
      fromEvent(this.questionsContent.nativeElement, 'scroll')
        .pipe(
          takeUntil(this.destroy$),
          debounceTime(5)
        )
        .subscribe(() => {
          syncScroll(this.questionsContent.nativeElement, this.suppliersContent.nativeElement);
        });

      // Suppliers content scroll - both vertical and horizontal
      fromEvent(this.suppliersContent.nativeElement, 'scroll')
        .pipe(
          takeUntil(this.destroy$),
          debounceTime(5)
        )
        .subscribe(() => {
          // Sync vertical scroll with questions
          syncScroll(this.suppliersContent.nativeElement, this.questionsContent.nativeElement);
          // Sync horizontal scroll with header immediately
          this.suppliersHeader.nativeElement.scrollLeft = this.suppliersContent.nativeElement.scrollLeft;
        });

      // Suppliers header scroll - horizontal only
      fromEvent(this.suppliersHeader.nativeElement, 'scroll')
        .pipe(
          takeUntil(this.destroy$),
          debounceTime(5)
        )
        .subscribe(() => {
          // Sync horizontal scroll with content immediately
          this.suppliersContent.nativeElement.scrollLeft = this.suppliersHeader.nativeElement.scrollLeft;
        });
    });
  }

  onApplyForAllChange(question: Question): void {
    if (question.applyForAll) {
      this.suppliers.forEach(supplier => {
        const answer = supplier.answers.find(a => a.questionId === question.id);
        if (answer) {
          answer.score = question.score;
        }
      });
    }
  }

  addQuestion(): void {
    const newQuestion: Question = {
      id: this.questions.length + 1,
      text: `New question ${this.questions.length + 1}?`,
      applyForAll: false,
      score: 0
    };

    this.questions.push(newQuestion);
    this.overallQuestions = this.questions.length;

    // Add corresponding answers for each supplier
    this.suppliers.forEach(supplier => {
      supplier.answers.push({
        questionId: newQuestion.id,
        answer: 'No answer provided yet',
        score: 0,
        hasAttachments: false
      });
    });
  }

  addSupplier(): void {
    const newSupplier: Supplier = {
      id: this.suppliers.length + 1,
      name: `Supplier ${this.suppliers.length + 1}`,
      code: '12345678',
      answersCount: 0,
      totalQuestions: this.questions.length,
      score: 0,
      status: 'average',
      answers: this.questions.map(question => ({
        questionId: question.id,
        answer: 'No answer provided yet',
        score: 0,
        hasAttachments: false
      }))
    };

    this.suppliers.push(newSupplier);
  }
} 