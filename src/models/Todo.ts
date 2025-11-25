import { Schema, model, Document, Types } from "mongoose";
import { Schema, model, Document, Types } from "mongoose";

export type Priority = "low" | "medium" | "high";
export type Priority = "low" | "medium" | "high";

export interface ITodo extends Document {
  title: string;
  completed: boolean;
  priority: Priority;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  completed: boolean;
  priority: Priority;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const todoSchema = new Schema<ITodo>(
  {
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "high",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

todoSchema.index({ userId: 1 });
export const Todo = model<ITodo>("Todo", todoSchema);

const todoSchema = new Schema<ITodo>(
  {
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "high",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

todoSchema.index({ userId: 1 });
export const Todo = model<ITodo>("Todo", todoSchema);
