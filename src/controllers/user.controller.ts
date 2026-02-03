import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User, { IUser } from "../model/user.model.js";

// Helper: Generate Token
const generateToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET as string, {
    expiresIn: "30d",
  });
};

// Helper: Set Cookie & Send Response
const sendTokenResponse = (user: IUser, statusCode: number, res: Response) => {
  try {
    // ✅ FIX: Use .toString() instead of 'as string'
    const token = generateToken(user._id.toString(), user.role);

    // Cookie Options
    const options = {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      httpOnly: true, // Prevents client-side JS from reading the cookie
      secure: process.env.NODE_ENV === "production", // HTTPS in production
      sameSite:
        process.env.NODE_ENV === "production"
          ? ("none" as const)
          : ("lax" as const),
    };

    res.status(statusCode).cookie("token", token, options).json({
      success: true,
      _id: user._id, // Mongoose automatically serializes this to string in JSON
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong while sending token",
      error: error,
      success: false,
    });
  }
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
export const registerUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { name, email, password, role } = req.body;

  try {
    if (!name || !email || !password || !role) {
      res.status(400).json({ message: "Please fill in all fields" });
      return;
    }

    if (role === "admin") {
      res.status(403).json({
        message: "Admin accounts cannot be created via public signup.",
      });
      return;
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    // Encrypt Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    if (user) {
      sendTokenResponse(user, 201, res);
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong while registering user",
      error: error,
      success: false,
    });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    // Compare Password
    const isMatch = await bcrypt.compare(password, user.password as string);

    if (isMatch) {
      sendTokenResponse(user, 200, res);
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong while logging in",
      error: error,
      success: false,
    });
  }
};

// @desc    Log user out / clear cookie
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = async (_: Request, res: Response) => {
  try {
    res.cookie("token", "none", {
      expires: new Date(Date.now() + 10 * 1000), // Expire in 10 seconds
      httpOnly: true,
    });

    res.status(200).json({ success: true, message: "User logged out" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong while logging out",
      error: error,
      success: false,
    });
  }
};
