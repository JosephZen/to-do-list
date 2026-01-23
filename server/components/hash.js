// components/hash.js
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

// Function to scramble the password
export const hashPassword = async (plainPassword) => {
    return await bcrypt.hash(plainPassword, SALT_ROUNDS);
};

// Function to check if the password matches
export const comparePassword = async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
};