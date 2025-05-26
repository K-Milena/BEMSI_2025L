import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
}

const users: User[] = [];

export const addUser = (email: string, passwordHash: string): User => {
  const newUser: User = { id: uuidv4(), email, passwordHash };
  users.push(newUser);
  return newUser;
};

export const findUserByEmail = (email: string): User | undefined => {
  return users.find(u => u.email === email);
};

