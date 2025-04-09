import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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
export class SupplierScoringComponent implements OnInit {
  questions: Question[] = [];
  suppliers: Supplier[] = [];
  overallQuestions: number = 0;

  constructor() {
    this.initializeData();
  }

  ngOnInit(): void {
    this.setupScrollSync();
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
    const questionsContent = document.getElementById('questionsContent');
    const suppliersContent = document.getElementById('suppliersContent');
    let isScrolling = false;

    const syncVerticalScroll = (source: HTMLElement, target: HTMLElement) => {
      if (!isScrolling) {
        isScrolling = true;
        target.scrollTop = source.scrollTop;
        setTimeout(() => {
          isScrolling = false;
        }, 50);
      }
    };

    if (questionsContent && suppliersContent) {
      questionsContent.addEventListener('scroll', () => {
        syncVerticalScroll(questionsContent, suppliersContent);
      });

      suppliersContent.addEventListener('scroll', () => {
        syncVerticalScroll(suppliersContent, questionsContent);
      });
    }
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