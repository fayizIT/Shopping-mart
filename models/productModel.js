const db = require('../db');
const { QueryFile } = require('pg-promise');
const path = require('path');


const sql = {
  getAllProducts: new QueryFile(path.join(__dirname, 'sql', 'getAllProducts.sql')),
  getProductById: new QueryFile(path.join(__dirname, 'sql', 'getProductById.sql')),

};

class ProductModel {
  static async getAllProducts() {
    return db.any(sql.getAllProducts);
  }

  static async getProductById(productId) {
    return db.one(sql.getProductById, [productId]);
  }



}

module.exports = ProductModel;
