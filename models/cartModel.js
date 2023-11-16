const db = require('../db');
const { QueryFile } = require('pg-promise');
const path = require('path');

// Define SQL queries
const sql = {
  createCart: new QueryFile(path.join(__dirname, 'sql', 'createCart.sql')),
  addToCart: new QueryFile(path.join(__dirname, 'sql', 'addToCart.sql')),
  viewCart: new QueryFile(path.join(__dirname, 'sql', 'viewCart.sql')),
  removeItemFromCart: new QueryFile(path.join(__dirname, 'sql', 'removeItemFromCart.sql')),
  calculateTotalPrice: new QueryFile(path.join(__dirname, 'sql', 'calculateTotalPrice.sql')),
};

class Cart {
  static async createCart(userId) {
    return db.one(sql.createCart, [userId]);
  }

  static async addToCart(userId, productId, kg) {
    return db.one(sql.addToCart, [userId, productId, kg]);
  }

  static async viewCart(userId) {
    return db.any(sql.viewCart, [userId]);
  }

  static async removeItemFromCart(userId, productId) {
    return db.none(sql.removeItemFromCart, [userId, productId]);
  }

  static async calculateTotalPrice(userId) {
    return db.one(sql.calculateTotalPrice, [userId]);
  }
}

module.exports = Cart;
