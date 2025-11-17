import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import BlacklistedToken from "../models/BlacklistedToken";
import { triggerBadgeCheck } from "../services/badgeService";

export const register = async (req: Request, res: Response) => {
    try {
        const { username, studentId, program, password } = req.body;
        const email = `${studentId}@gordoncollege.edu.ph`;

        const existingUser = await User.findOne({ studentId });
        if (existingUser) {
            return res.status(400).json({ message: "Student ID already in use" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            studentId,
            email,
            program,
            password: hashedPassword
        });

        await newUser.save();
        await triggerBadgeCheck(newUser.studentId, "USER_REGISTERED");
        
        res.status(201).json({ 
            message: "User registered successfully",
            body: newUser 
        });

    } catch (err) {
        console.error("Registration error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

export const fetchUser = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        res.status(200).json({
            message: "User fetched successfully",
            user: user
        });
    } catch (err) {
        console.error("Fetch User error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

export const login = async (req: Request, res: Response) => {
    try {
        const { studentId, password } = req.body;
        const user = await User.findOne({ studentId });

        if (!user) {
            return res.status(400).json({ message: "No registered user found" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Incorrect Password" });
        }

        const payload = {
            userId: user._id,
            studentId: user.studentId,
            username: user.username,
            email: user.email,
            program: user.program,
            isTutor: user.isTutor
        }

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET as string,
            { expiresIn: "1h" }
        );

        res.status(200).json({
            message: "Login successful",
            token, 
            user: payload
        });
    } catch (err) {
        console.error("❌ Login error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

export const logout = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(400).json({ message: "Token not provided" });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(400).json({ message: "Token not provided" });

    // Decode token safely
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return res.status(400).json({ message: "Invalid token format" });

    const decoded = JSON.parse(Buffer.from(payloadBase64, "base64").toString());

    await BlacklistedToken.create({
      token,
      expiresAt: new Date(decoded.exp * 1000), // JWT exp is in seconds
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
