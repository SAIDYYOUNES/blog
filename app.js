const express = require("express");
const pool = require("./db");
const expressLayouts = require("express-ejs-layouts");

const multer = require('multer');
const fs = require("fs/promises")
const path = require('path')
const app = express();
const upload = multer({ dest: 'uploads/' });
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressLayouts);
app.set("view engine", "ejs");

// console.log(pool);

app.get("/", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows1, fields1] = await connection.execute("SELECT * FROM post");
    const [rows2, fields2] = await connection.execute("SELECT * FROM category");
    res.render("home", { posts: rows1, categories: rows2 });
    connection.release();
  } catch (err) {
    console.error("Error fetching posts from database: ", err);
    res.status(500).send("Error fetching posts from database");
  }
});
app.post("/search", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows1, fields1] = await connection.execute(`SELECT * FROM post where titre LIKE '%${req.body.search}%' 
     or contenu LIKE '%${req.body.search}%' 
     `);
    const [rows2, fields2] = await connection.execute("SELECT * FROM category");
    res.render("home", { posts: rows1, categories: rows2 });
    connection.release();
  } catch (err) {
    console.error("Error fetching posts from database: ", err);
    res.status(500).send("Error fetching posts from database");
  }
});
app.post('/addcategory',async(req,res)=>{
  let a = req.body
  const connection = await pool.getConnection();
const sql = "INSERT INTO category SET ?";
  try {
     await connection.query(sql, a)
     res.redirect('categories')
  }
  catch(err){
    console.error("Error in insertion: ", err);
    res.status(500).send("Error in insertion");
  }
})
app.get("/categories", async (req, res) => {
  const connection = await pool.getConnection();
  
  const [rows2, fields2] = await connection.execute("SELECT * FROM category");

  res.render('categories',{categories:rows2})
})
app.get("/post/:id", async (req, res) => {
  let id = req.params.id;
  try {
    const connection = await pool.getConnection();
    const [rows1, fields1] = await connection.execute(
      `SELECT * FROM post where id=${id}`
    );
    const [rows2, fields2] = await connection.execute("SELECT * FROM category");
    const [rows3, fields3] = await connection.execute(`SELECT *FROM  postcategory INNER JOIN category ON category.id = postcategory.categoryId where postId=${id}`);
    res.render("show", { post: rows1[0], categories: rows2,postcategories:rows3 });
    // console.log(rows[0]);

    connection.release();
  } catch (err) {
    console.log(err);
    console.error("Error fetching post from database: ", err);
    res.status(500).send("Error fetching post from database");
  }
});
app.get("/editpost/:id", async (req, res) => {
  let id = req.params.id;
  try {
    const connection = await pool.getConnection();
    const [rows, fields] = await connection.execute(
      `SELECT * FROM post where id=${id}`
    );
    const [rows2, fields2] = await connection.execute("SELECT * FROM category");
    const [rows3, fields3] = await connection.execute(`SELECT *FROM  postcategory INNER JOIN category ON category.id = postcategory.categoryId where postId=${id}`);
    res.render("edit", { post: rows[0], categories: rows2 , postcategories:rows3 });
    // console.log(rows[0]);

    connection.release();
  } catch (err) {
    console.log(err);
    console.error("Error fetching post from database: ", err);
    res.status(500).send("Error fetching post from database");
  }
});

app.get("/add", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows, fields] = await connection.execute("SELECT * FROM category");
    res.render("addPost", { categories: rows });
    connection.release();
  } catch (err) {
    console.error("Error fetching categories from database: ", err);
    res.status(500).send("Error fetching categories from database");
  }
});
app.post("/create",upload.single('img'), async (req, res) => {
  // console.log(req.file);
  // return
 
  const tmp = req.file;
  let  imagePath = './uploads/'+tmp.filename+ path.extname(tmp.originalname)
  const post = {
    titre: req.body.titre,
    contenu: req.body.contenu,
    img: imagePath,
  };
  const data = await fs.readFile(tmp.path);
  await fs.writeFile(imagePath,data)
const connection = await pool.getConnection();
const sql = "INSERT INTO post SET ?";
  try {
    console.log("try");
    let result= await connection.query(sql, post)
    
// id=result[0].insertId
req.body.categories.forEach((element) => {
    const sql = 'INSERT INTO postcategory SET ?';
    connection.query(sql,{postId:result[0].insertId,categoryId:element})
  });
  res.redirect(`post/${result[0].insertId}`)
  

// console.log('id',id);
//     .catch(err)(
//       console.error(err)
// )
   
  } catch (err) {
    console.log('err');
    console.error("Error inserting data: ", err);
    return;
  }
});
app.post("/update", async (req, res) => {
  // let id = 0;
  const post = {
    titre: req.body.titre,
    contenu: req.body.contenu,
    img: req.body.img,
    // id: req.body.id,
  };
 
  
const connection = await pool.getConnection();
const sql =` UPDATE post SET  ? WHERE id = ${req.body.id}`;
  try {
    console.log("try");
    let result= await connection.query(sql, post)
    if(req.body.categories){
      console.log('categoriechange');
      connection.execute(`delete from postcategory where postId=${req.body.id}`)
      req.body.categories.forEach((element) => {
          const sql = 'INSERT INTO postcategory SET ?';
          connection.query(sql,{postId:req.body.id,categoryId:element})
        });
    }
// id=result[0].insertId
  res.redirect(`post/${req.body.id}`)
  

// console.log('id',id);
//     .catch(err)(
//       console.error(err)
// )
   
  } catch (err) {
    console.log('err');
    console.error("Error inserting data: ", err);
    return;
  }
});
app.post("/deletepost/:id", async (req, res) => {
  let id = req.params.id;
  const connection = await pool.getConnection();
  console.log(id);
  const sql = `DELETE FROM post where id=${id}`;
  await connection.execute(sql
    )
    connection.release()
    res.redirect("/")
  try {
// //     .then(
// //     )
  } catch (err) {
    console.log(err);
    console.error("Error deleting post from database: ", err);
    res.status(500).send("Error fetching post from database");
  }
});

console.log("running on port 3000");
app.listen(3000);
