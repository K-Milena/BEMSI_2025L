"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserByEmail = exports.addUser = void 0;
const uuid_1 = require("uuid");
const users = [];
const addUser = (email, passwordHash) => {
    const newUser = { id: (0, uuid_1.v4)(), email, passwordHash };
    users.push(newUser);
    return newUser;
};
exports.addUser = addUser;
const findUserByEmail = (email) => {
    return users.find(u => u.email === email);
};
exports.findUserByEmail = findUserByEmail;
