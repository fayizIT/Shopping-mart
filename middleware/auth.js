const { Pool } = require('pg');
const pool = new Pool({
  user: 'shoppingmart',
  host: '127.0.0.1',
  database: 'foodmart',
  password: '12345',
  port: 5432,
});

const isLogin = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.session.user_id]);
      const userData = result.rows[0];
      if (userData && !userData.blocked) {
        next(); // Proceed to the next middleware
      } else {
        delete req.session.user_id;
        return res.redirect("/login");
      }
    } else {
      return res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const isLogOut = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      const result = await pool.query('SELECT blocked FROM users WHERE id = $1', [req.session.user_id]);
      const { blocked } = result.rows[0];
      if (!blocked) {
        res.redirect("/home");
      }
    }
    next();
  } catch (error) {
    console.log(error.message);
  }
};



module.exports = {
  isLogin,
  isLogOut,
 
};
