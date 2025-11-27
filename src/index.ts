import "dotenv/config";
import express, { Request, Response } from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import { Todo } from "./models/Todo";
import { User } from "./models/User";
import cors from "cors";
import bcrypt from "bcrypt";
import { SignJWT } from "jose";

const app = express();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://todo-tracker-app-ten.vercel.app",
    ], // Allow only this origin
    // methods: ['GET', 'POST'], // Allow specific HTTP methods
    // allowedHeaders: ['Content-Type'], // Allow specific headers
  }),
);

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error("❌ Missing MONGODB_URI in .env");
  process.exit(1);
}

// middleware
app.use(morgan("dev"));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "OK", uptime: process.uptime() });
});

// read
app.get("/api/todos", async (req: Request, res: Response) => {
  const { id } = req.query;
  try {
    const todos = await Todo.find({ userId: id }).sort({
      createdAt: -1,
    });
    res.json(todos);
  } catch (error) {
    console.error("Read all error:", error);
    res.status(500).json({ error: "Failed to fetch todos" });
  }
});

const createJwtAuth = async (email: string, name: string): Promise<string> => {
  const token = await new SignJWT({
    email: email,
    name: name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .sign(JWT_SECRET);

  return token;
};

// login
app.post("/api/user-login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const message = "Invalid Email or Password";
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(401).json({ message: message });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: message });
    }

    const tokenGen = await createJwtAuth(user.email, user.name);

    return res.json({
      message: "Login successful!",
      user: { id: user._id, name: user.name, email: user.email },
      token: tokenGen,
    });
  } catch (error) {
    console.error("Create error:", error);
    return res.status(500).json({ error: "Failed to login user" });
  }
});

// create user
app.post("/api/user-create", async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (user) {
      return res.status(409).json({ message: "User Email already exist." });
    }
    const newUser = new User({
      name: name,
      email: email,
      password: await bcrypt.hash(password, 10),
    });
    newUser.save();
    return res.status(200).json({ message: "Successfully created user." });
  } catch (error) {
    console.error("Create error:", error);
    return res.status(500).json({ error: "Failed to create user" });
  }
});

// create todo
app.post("/api/todos", async (req: Request, res: Response) => {
  try {
    const { title, id, completed, priority } = req.body;

    if (!title || typeof title !== "string") {
      return res
        .status(400)
        .json({ error: "Title is required and must be a string" });
    }

    const newTodo = new Todo({
      title,
      userId: id,
      completed: completed ?? false,
      priority,
    });

    const saveTodo = await newTodo.save();
    return res.status(200).json(saveTodo);
  } catch (error) {
    console.error("Create error:", error);
    return res.status(500).json({ error: "Failed to create todo" });
  }
});

// update
app.patch("/api/todos/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, completed, priority } = req.body;
    if (
      title !== undefined &&
      (typeof title !== "string" || title.trim() === "")
    ) {
      return res
        .status(400)
        .json({ error: "Title must be a non-empty string" });
    }

    const updatedTodo = await Todo.findByIdAndUpdate(
      id,
      { title, completed, priority },
      { new: true, runValidators: true },
    );

    if (!updatedTodo) {
      return res.status(404).json({ error: "Todo not found" });
    }

    res.json(updatedTodo);
  } catch (error) {
    console.error("Update error:", error);
    return res.status(500).json({ error: "Failed to update todo" });
  }
});

// delete
app.delete("/api/todos/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedTodo = await Todo.findByIdAndDelete(id);

    if (!deletedTodo) {
      return res.status(404).json({ error: "Todo not found" });
    }

    return res.json({
      message: "Todo deleted successfully",
      id: deletedTodo._id,
    });
  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).json({ error: "Failed to delete todo" });
  }
});

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB Atlas");
    console.log("✅ Connected to database:", mongoose.connection.name);
    app.listen("10000", () => {
      console.log(`✅ Server running on port  '10000'`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });
