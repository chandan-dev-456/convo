import { Router } from "express";
import { signup, login } from "../controllers/user.controller.js";
const router = Router();

router.route('/login')
    .post(login);
router.route('/signup')
    .post(signup);
    
export default router;
