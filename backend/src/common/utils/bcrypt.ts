import * as bcrypt from 'bcrypt';

const saltRounds = +(process.env?.SALT_ROUND || 10);

export const generatePasswordHash = (password: string): string => {
  const salt = bcrypt.genSaltSync(saltRounds, 'b');
  const hashed = bcrypt.hashSync(password, salt);
  return hashed;
};

export const comparePassword = (
  hashedPassword: string,
  password: string,
): boolean => {
  const isMatched = bcrypt.compareSync(password, hashedPassword);
  return isMatched;
};
