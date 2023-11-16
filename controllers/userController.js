const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const config = require('../config/config');
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const pool = new Pool({
  user: 'your_postgres_user',
  host: 'localhost',
  database: 'your_database',
  password: 'your_password',
  port: 5432,
});

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

const insertUser = async (req, res) => {
  try {
    if (req.body.password !== req.body.confirmPassword) {
      return res.render('users/signup', { message: 'Passwords do not match' });
    }

    const email = req.body.email;
    const mobile = req.body.mobile;

    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1 OR mobile = $2', [email, mobile]);

    if (existingUser.rows.length > 0) {
      if (existingUser.rows[0].email === email) {
        return res.render('users/signup', {
          message: 'Email already exists, please use a different email',
        });
      } else if (existingUser.rows[0].mobile === mobile) {
        return res.render('users/signup', {
          message: 'Mobile number already exists, please use a different mobile number',
        });
      }
    }

    const spassword = await securePassword(req.body.password);

    const user = await pool.query(
      'INSERT INTO users (name, email, mobile, password, is_admin) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.body.name, req.body.email, req.body.mobile, spassword, 0]
    );

    if (user.rows.length > 0) {
      sendVerifyMail(req.body.name, req.body.email, user.rows[0]._id);
      res.redirect('/success'); // Redirect to the success page
    } else {
      res.render('users/signup', { message: 'Your registration has failed' });
    }
  } catch (error) {
    res.render('error', { error });
  }
};

//welcome page
const loadwelcome = async (req, res) => {
  try {
    const productData = await Product.find({ unlist: false }).lean()
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.render("users/index", { Product: productData });
  } catch (error) {
    console.log(error.message);
    res.render("error", { error });
  }
};


//login the page
const loadlogin = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.render("users/login");
  } catch (error) {
    console.log(error.message);
    res.render("error", { error });
  }
};



const verifyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const userData = result.rows[0];

    if (!userData) {
      return res.render('users/login', { message: 'Email and password are incorrect' });
    }

    const passwordMatch = await bcrypt.compare(password, userData.password);

    if (!passwordMatch) {
      return res.render('users/login', { message: 'Email and password are incorrect' });
    }

    if (userData.is_verified === 0) {
      return res.render('users/login', { message: 'Please verify your email' });
    } else {
      req.session.user_id = userData.id;
      req.session.blocked = userData.blocked;

      const walletResult = await pool.query('SELECT * FROM wallet WHERE user_id = $1', [userData.id]);
      const wallet = walletResult.rows[0];

      if (wallet) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        return res.redirect('/home');
      }
    }
  } catch (error) {
    console.log(error.message);
    res.render('error', { error });
  }
};

const loadindex = async (req, res) => {
  try {
    const productResult = await pool.query('SELECT * FROM products WHERE unlist = false');
    const productData = productResult.rows;

    const categoryResult = await pool.query('SELECT * FROM categories WHERE unlist = false');
    const categoryData = categoryResult.rows;

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.session.user_id]);
    const userData = userResult.rows[0];

    res.render('users/index', { user: userData, Product: productData, category: categoryData });
  } catch (error) {
    console.log(error.message);
    res.render('error', { error });
  }
};




//logout 
const userLogout = async (req, res) => {
  try {
    delete req.session.user_id;
    res.redirect('/');
  } catch (error) {
    console.log(error.message);
  }
};



const addToCart = async (req, res) => {
  try {
    const proId = req.body.productId;
    let cart = await pool.query('SELECT * FROM cart WHERE user_id = $1', [req.session.user_id]);

    if (cart.rows.length === 0) {
      await pool.query('INSERT INTO cart (user_id, products) VALUES ($1, $2)', [req.session.user_id, []]);
      cart = await pool.query('SELECT * FROM cart WHERE user_id = $1', [req.session.user_id]);
    }

    const existingProductIndex = cart.rows[0].products.findIndex((product) => product.productId.toString() === proId);

    if (existingProductIndex === -1) {
      const product = await pool.query('SELECT * FROM products WHERE id = $1', [proId]);
      const total = product.rows[0].price;
      await pool.query('UPDATE cart SET products = array_append(products, $1) WHERE user_id = $2', [{ productId: proId, kg: 1, total }, req.session.user_id]);
    } else {
      const product = await pool.query('SELECT * FROM products WHERE id = $1', [proId]);
      const existingProduct = cart.rows[0].products[existingProductIndex];
      if (existingProduct.kg + 1 > product.rows[0].inStock) {
        return res.status(400).json({ message: 'stock limit reached' });
      }
      await pool.query('UPDATE cart SET products[$1].kg = products[$1].kg + 1, products[$1].total = products[$1].total + $2 WHERE user_id = $3', [existingProductIndex, product.rows[0].price, req.session.user_id]);
    }

    const updatedCart = await pool.query('SELECT * FROM cart WHERE user_id = $1', [req.session.user_id]);

    const total = updatedCart.rows[0].products.reduce((sum, product) => sum + product.total, 0);

    res.status(200).json({ message: 'Product added to cart successfully', total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getCart = async (req, res) => {
  try {
    const cart = await pool.query('SELECT * FROM cart WHERE user_id = $1', [req.session.user_id]);

    if (cart.rows.length === 0) {
      return res.render('users/cart');
    }

    const products = cart.rows[0].products.map((product) => {
      const total = Number(product.kg) * Number(product.total);
      return {
        _id: product.productId,
        item: product.item,
        images: product.images,
        price: product.price,
        description: product.description,
        kg: product.kg,
        total,
        user_id: req.session.user_id,
      };
    });

    const total = products.reduce((sum, product) => sum + Number(product.total), 0);
    const totalCount = products.length;
    const finalAmount = total;

    res.render('users/cart', {
      products,
      total,
      totalCount,
      subtotal: total,
      finalAmount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

const changeQuantity = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const productId = req.body.productId;
    const kg = req.body.kg;
    const count = req.body.count;

    const cart = await pool.query('SELECT * FROM cart WHERE user_id = $1', [userId]);

    const findProduct = cart.rows[0].products.find((product) => product.productId === productId);

    const sumProductKgAndCount = parseInt(findProduct.kg) + parseInt(count);

    const product = await pool.query('SELECT * FROM products WHERE id = $1', [productId]);

    if (sumProductKgAndCount > product.rows[0].inStock) {
      const response = { outOfStock: true };
      return res.send(response);
    }

    const updatedCart = await pool.query('UPDATE cart SET products[$1].kg = products[$1].kg + $2 WHERE user_id = $3 RETURNING *', [productId, count, userId]);

    const subtotal = updatedCart.rows[0].products.reduce((acc, product) => {
      return acc + product.total;
    }, 0);

    const response = {
      kg: findProduct.kg,
      subtotal: subtotal,
      productTotal: findProduct.total
    };

    return res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};





  

module.exports = {
  insertUser,
  verifyLogin,
  loadwelcome,
  loadlogin,
  loadindex,
  userLogout,
  addToCart,
  getCart,
  changeQuantity,
};