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
    const { name, username, password } = req.body;

    // const normalizedUsername = username.toLowerCase().trim();

    const existingUser = await User.findOne({username});

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      username,
      password: hashedPassword
    });

    await newUser.save();

    return res.status(201).json({
      message: "Registered successfully"
    });

  } catch (error) {
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