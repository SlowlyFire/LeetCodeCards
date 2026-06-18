import { Schema, model, Document, Types } from 'mongoose';

export interface IQuestion extends Document {
  number: number;
  title: string;
  section: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  // Reference to a Pattern document — stored as an ObjectId in MongoDB
  patternId: Types.ObjectId;
  timeComplexity: string;
  spaceComplexity: string;
  // Subjective rating 1–5
  myDifficulty: number;
  status: 'Solved' | 'Review' | 'Skipped' | 'Not Started';
  problemStatement: string;
  mySolution: string;
  notes: string;
  // Spaced repetition bucket — new questions start as "Hot" until reviewed enough
  srBucket: 'Hot' | 'Warm' | 'Mastered';
  lastReviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    number: { type: Number },
    title: { type: String, required: true },
    section: { type: String, default: '' },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
    },
    // ref: 'Pattern' lets Mongoose populate the full Pattern doc with .populate('patternId')
    patternId: { type: Schema.Types.ObjectId, ref: 'Pattern' },
    timeComplexity: { type: String, default: '' },
    spaceComplexity: { type: String, default: '' },
    myDifficulty: { type: Number, min: 1, max: 5 },
    status: {
      type: String,
      enum: ['Solved', 'Review', 'Skipped', 'Not Started'],
      default: 'Not Started',
    },
    problemStatement: { type: String, default: '' },
    mySolution: { type: String, default: '' },
    notes: { type: String, default: '' },
    srBucket: {
      type: String,
      enum: ['Hot', 'Warm', 'Mastered'],
      default: 'Hot',
    },
    lastReviewedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

export const Question = model<IQuestion>('Question', QuestionSchema);
