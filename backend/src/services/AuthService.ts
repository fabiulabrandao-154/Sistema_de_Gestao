import User from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'futgestao-secret';

export class AuthService {
  async register(data: any) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await User.create({
      email: data.email,
      name: data.name,
      password: hashedPassword,
    });
    const token = jwt.sign({ id: user._id }, JWT_SECRET);
    return { user: { id: user._id, email: user.email, name: user.name }, token };
  }

  async login(data: any) {
    const user = await User.findOne({ email: data.email });
    if (!user || !(await bcrypt.compare(data.password, user.password))) {
      throw new Error('Invalid credentials');
    }
    const token = jwt.sign({ id: user._id }, JWT_SECRET);
    return { user: { id: user._id, email: user.email, name: user.name }, token };
  }
}
