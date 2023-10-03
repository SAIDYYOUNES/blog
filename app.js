const express = require("express");
const expressLayouts = require("express-ejs-layouts");
require("dotenv").config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({extended:true}))
const mysql = require("mysql2/promise");
// app.set("views", "./views");
app.use(expressLayouts)
app.set("view engine", "ejs");

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

global.db = pool;

app.get('/', async (req, res) => {
    try {
      const connection = await pool.getConnection();
      const [rows, fields] = await connection.execute('SELECT * FROM post');
      res.render('home', { posts: rows });
      connection.release();
    } catch (err) {
      console.error('Error fetching posts from database: ', err);
      res.status(500).send('Error fetching posts from database');
    }
  });
  app.get('/post/:id', async (req, res) => {
    let id = req.params.id
    try {
      const connection = await pool.getConnection();
      const [rows, fields] = await connection.execute(`SELECT * FROM post where id=${id}`);
      res.render('show', { post: rows[0]});
      console.log(rows[0]);
     
      connection.release();
    } catch (err) {
      console.log(err);
      console.error('Error fetching post from database: ', err);
      res.status(500).send('Error fetching post from database');
    }
  });
  app.get('/add', async (req, res) => {
    
      res.render('addPost');
     
  });
  app.post('/create',async (req, res) => {
    const post = req.body;
    // console.log(post);
    const connection = await pool.getConnection();
    const sql = 'INSERT INTO post SET ?';
    connection.query(sql, post, (err, result) => {
      if (err) {
        console.error('Error inserting data: ', err);
        return;
      }
      console.log(result);
      // res.render('insert', { layout: 'layout' });
    }
    );
  })
  app.get('/deletepost/:id', async (req, res) => {
    let id = req.params.id
    const connection = await pool.getConnection();
    try {
      const sql = 'DELETE FROM post where id=?';
      connection.query(sql, id,(err, result) => {
        if (err) {
          console.error('Error inserting data: ', err);
          return;
        }
        console.log(result);
      }
        );
      res.status(200).send('post deleted');
      connection.release();
    } catch (err) {
      console.log(err);
      console.error('Error fetching post from database: ', err);
      res.status(500).send('Error fetching post from database');
    }
  });

app.listen(3000);
