import { Schema, model, Document } from "mongoose";

export type Priority = 'low' | 'medium' | 'high'

export interface ITodo extends Document {
    title: string;
    completed: boolean;
    priority: Priority;
    createdAt: Date;
    updatedAt: Date;
}

const todoSchema = new Schema<ITodo>({
    title: {type: String, required: true},
    completed: {type: Boolean, default: false},
    priority: {type: String, enum:['low', 'medium', 'high'],default: 'high'}
}, {
    timestamps: true
})

export const Todo = model<ITodo>('Todo', todoSchema)