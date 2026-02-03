import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
dotenv.config();

const requireAuth = async (req, res, next) => {
  try {
    const token =
      req.cookies.jwt ||
      req.body.token ||
      req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      res.status(401).json({ message: "No token in cookie", success: false });
      return;
    }
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decode);
    req.user = decode;
    next();
  } catch (error) {
    res.status(401).json({
      message: "Invalid token",
      success: false,
      err: error.message,
    });
    return;
  }
};

export { requireAuth };
