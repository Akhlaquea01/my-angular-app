export interface SupplierScoringResponse {
    sections: Section[];
    suppliers: Supplier[];
    overallScores: {
        [supplierId: string]: {
            score: number;
            status: 'Positive' | 'Average' | 'Negative';
            percentage: number;
        }
    };
}

export interface Section {
    id: string;
    name: string;
    order: number;
    questions: Question[];
}

export interface Question {
    id: string;
    sectionId: string;
    order: number;
    text: string;
    maxScore: number;
    responses: {
        [supplierId: string]: QuestionResponse;
    };
    applyToAllSuppliers: boolean;
}

export interface QuestionResponse {
    id: string;
    questionId: string;
    supplierId: string;
    score: number;
    answer: string;
    comments: Comment[];
    attachments: Attachment[];
    lastUpdated: string;
}

export interface Comment {
    id: string;
    questionResponseId: string;
    text: string;
    createdBy: string;
    createdAt: string;
}

export interface Attachment {
    id: string;
    questionResponseId: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    uploadedBy: string;
    uploadedAt: string;
}

export interface Supplier {
    id: string;
    name: string;
    code: string;
    totalAnswers: number;
    maxPossibleScore: number;
    currentScore: number;
} 