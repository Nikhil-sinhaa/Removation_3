import jwt from 'jsonwebtoken';

const JWT_SECRET = 'ffb2c50f4f8da3741954140e1b2e545c6efc7caeba37f6b3f7b166e80d1bfe24';
const token = jwt.sign(
  { id: '6a1091f6740cbeb1bc74fdb6', email: 'nikhilkumarsinha4321@gmail.com' },
  JWT_SECRET,
  { expiresIn: '7d' }
);

console.log('JWT Token:');
console.log(token);
