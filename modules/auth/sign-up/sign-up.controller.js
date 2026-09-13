import bcrypt from 'bcrypt';

import insertNewUser from './sign-up.query.js';

export default async function signUp(req, res, next) {
  const saltRounds = 10;
  const { email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    await insertNewUser(email, hashedPassword);
    return res.status(201).json({ message: 'User Created' });
  } catch (error) {
    next(error);
  }
}
