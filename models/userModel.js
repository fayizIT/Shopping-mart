
const db = require('../db');
const { QueryFile } = require('pg-promise');
const path = require('path');


const sql = {
  createUser: new QueryFile(path.join(__dirname, 'sql', 'createUser.sql')),
  getUserByEmail: new QueryFile(path.join(__dirname, 'sql', 'getUserByEmail.sql')),
  updateUser: new QueryFile(path.join(__dirname, 'sql', 'updateUser.sql')),
};

class User {
  static async createUser(name, email, mobile, password, confirmPassword, ) {
    return db.one(sql.createUser, [name, email, mobile, password, confirmPassword]);
  }

  static async getUserByEmail(email) {
    return db.oneOrNone(sql.getUserByEmail, [email]);
  }

  static async updateUser(email, updates) {
    return db.none(sql.updateUser, [email, updates]);
  }
}

module.exports = User;
