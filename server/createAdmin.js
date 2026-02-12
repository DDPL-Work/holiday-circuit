import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Auth from "./src/models/auth.model.js";
import env from "dotenv";

env.config({ quiet: true });

mongoose.connect(process.env.MONGO_URL);

const createAdmin = async () => {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  await Auth.create({
    name: "Super Admin",
    email: "admin@gmail.com",
    password: hashedPassword,
    role: "admin",
    isApproved: true
  });

  console.log("Admin created successfully");
};

createAdmin();
