import Auth from "../models/auth.model.js";
import ApiError from "../utils/ApiError.js";
// import TravelQuery from "../models/travelQuery.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import env from "dotenv"


// ========================== Register Agent ==========================

export const registerAgent = async (req, res, next) => {
  try {
    const { name, email, password, companyName,  gstNumber, phone  } = req.body;

    const existingUser = await Auth.findOne({ email });
    if (existingUser) {
      return next(new ApiError(400, "Email already exists"));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await Auth.create({
      name,
      email,
      password: hashedPassword,
      role: "agent",
      companyName,
      gstNumber,
      phone,
      isApproved: false
    });

    res.status(201).json({
      success: true,
      message: "Registered successfully. Waiting for admin approval."
    });

  } catch (error) {
    next(error);
  }
};


// ========================== Login Agent ==========================

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await Auth.findOne({ email });

    if (!user) {
      return next(new ApiError(400, "Invalid credentials"));
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return next(new ApiError(400, "Invalid credentials"));
    }

    // Only agents need approval
    if (user.role === "agent" && !user.isApproved) {
      return next(new ApiError(403, "Admin approval pending"));
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "3d" }
    );

    res.status(200).json({
      message: "Login successful",
      success: true,
      token,
      role: user.role
    });

  } catch (error) {
    next(error);
  }
};
