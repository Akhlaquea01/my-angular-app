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