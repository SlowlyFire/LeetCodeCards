import { Schema, model, Document } from 'mongoose';

// TypeScript interface — gives us type safety when creating/reading Pattern documents
export interface IPattern extends Document {
  name: string;
  globalCategory: string;
  whenToUse: string;
  keyInsight: string;
  template: string;
  pitfalls: string;
  signalWords: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PatternSchema = new Schema<IPattern>(
  {
    name: { type: String, required: true, unique: true },
    globalCategory: { type: String, default: '' },
    whenToUse: { type: String, default: '' },
    keyInsight: { type: String, default: '' },
    // Multi-line code skeleton stored as a plain string
    template: { type: String, default: '' },
    pitfalls: { type: String, default: '' },
    // Array of hint phrases, e.g. ["next greater element", "monotonic"]
    signalWords: { type: [String], default: [] },
  },
  {
    // timestamps: true automatically manages createdAt and updatedAt
    timestamps: true,
  }
);

export const Pattern = model<IPattern>('Pattern', PatternSchema);
