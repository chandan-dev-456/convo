import httpStatus from 'http-status';
import { User } from '../models/user.model.js'
import bcrypt from "bcrypt"
import crypto from "crypto"

const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        let token = crypto.randomBytes(20).toString("hex");
        user.token = token;
        await user.save();
        return res.status(httpStatus.OK).json({ token: token , message : "Login Successfully"});
    } catch (e) {
        res.json({ message: `Something went wrong ${e}` });
    }
}

const signup = async (req, res) => {
  try {
    // 1️⃣ Extract data from request body
    const { name, username, password } = req.body;

    // 3️⃣ Normalize username (IMPORTANT)
    const normalizedUsername = username.toLowerCase().trim();

    // 4️⃣ Check if user already exists
    const existingUser = await User.findOne({
      username: normalizedUsername
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists"
      });
    }

    // 5️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6️⃣ Create new user
    const newUser = new User({
      name,
      username: normalizedUsername,
      password: hashedPassword
    });

    // 7️⃣ Save user
    await newUser.save();

    // 8️⃣ Send success response
    return res.status(201).json({
      message: "Registered successfully"
    });

  } catch (error) {
    // 9️⃣ Handle duplicate key error (safety net)
    if (error.code === 11000) {
      return res.status(409).json({
        message: "User already exists"
      });
    }

    console.error(error);

    return res.status(500).json({
      message: "Something went wrong"
    });
  }
};


export { signup, login };