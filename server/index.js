import express from 'express';
import { pool } from './db.js';
import { hashPassword, comparePassword } from './components/hash.js';
import session from 'express-session';
import cors from 'cors';
import dotenv from 'dotenv'; 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ 1. TRUST PROXY: Essential for Vercel/Render communication
app.set('trust proxy', 1);

// ✅ 2. CORS: Dynamic - allows Vercel in Prod, Localhost in Dev
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', 
  credentials: true,               
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(express.json());

// ✅ 3. COOKIES: Secure in Prod, Loose in Dev
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // True on Render
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // None required for cross-site
    maxAge: 1000 * 60 * 60 * 24 
  }
}));


app.post('/register', async (req, res) => {
  const { username, name, password, confirm } = req.body;
  
  if (!username || !password || !confirm || !name) {
      return res.status(400).json({ success: false, message: 'Please provide all fields.' });
  }

  if (password !== confirm) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
  }
  
  try {
    const userCheck = await pool.query('SELECT * FROM user_accounts WHERE username = $1', [username]);
    if (userCheck.rows.length > 0) {
        return res.status(409).json({ success: false, message: 'User already exists.' });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await pool.query(
      `INSERT INTO user_accounts (username, password, name) VALUES ($1, $2, $3) RETURNING *`,
      [username, hashedPassword, name] 
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Registered Successfully', 
      user: newUser.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

app.post('/login', async(req, res) => {
  if (req.session.user) {
    return res.status(200).json({ 
      success: true, 
      message: 'Session Restored', 
      user: req.session.user 
    });
  }
  
  const { username, password } = req.body; // Note: We don't get 'name' from body, we get it from DB

  try {
    const result = await pool.query('SELECT * FROM user_accounts WHERE username = $1', [username]);
    if (result.rows.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const user = result.rows[0];
    const isMatch = await comparePassword(password, user.password);

    if (isMatch) {
        req.session.user = {
          id: user.id,
          username: user.username,
          name: user.name
        };
        res.status(200).json({ 
          success: true, 
          message: 'Login Successfully', 
          user: req.session.user 
        });
    } else {
      res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Could not log out" });
    }
    res.clearCookie('connect.sid', { path: '/' }); 
    res.status(200).json({ success: true, message: "Logout successful" });
  });
});

// ✅ 3. SECURE COOKIES
app.use(session({
  secret: process.env.SESSION_SECRET || 'my_super_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    // Secure: true on Render (HTTPS), false on Localhost
    secure: process.env.NODE_ENV === 'production', 
    // SameSite: 'none' required for Vercel -> Render connection
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', 
    maxAge: 1000 * 60 * 60 * 24 // 24 Hours
  }
}));

app.get('/get-list', async (req, res) => {
  try {
    // We select List details AND count the matching Items
    const query = `
      SELECT list.id, list.title, list.status, COUNT(items.id) as task_count 
      FROM list 
      LEFT JOIN items ON list.id = items.list_id 
      GROUP BY list.id 
      ORDER BY list.id ASC
    `;
    
    const result = await pool.query(query);
    
    res.status(200).json({ success: true, list: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

app.post('/add-list', async (req, res) => {
  const { listTitle } = req.body;
  await pool.query(`INSERT INTO list (title, status) VALUES ($1, $2)`, [listTitle, "pending"]);
  /*list.push({
      id: list.length + 1,
      title: listTitle,
      status: "pending"
  });*/
  const list = await pool.query('SELECT * FROM list');
  res.status(200).json({ succes: true, message: "Added", list: list.rows });
});

/*app.post for html <form> only */
app.delete('/delete-list', async (req, res) => {
  const { L_id } = req.body;
  await pool.query(`DELETE FROM list WHERE id = $1`, [L_id]);
  // FIX: Removed 'list' variable which caused crash
  res.status(200).json({success: true, message: "List deleted"}); 
});


/*app.post for html <form> only */
app.put('/edit-list/:id', async (req, res) => {
  const { id } = req.params;
  const { listTitle, status } = req.body;

  try {
    const response = await pool.query(
      `UPDATE list 
       SET 
         title = COALESCE($1, title), 
         status = COALESCE($2, status) 
       WHERE id = $3 
       RETURNING *`,
      [listTitle || null, status || null, id]
    );

    if (response.rowCount === 0) {
        return res.status(404).json({ success: false, message: "List not found" });
    }

    res.status(200).json({ success: true, message: "Updated", list: response.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

app.get('/get-items/:id', async (req, res) => {
  const itemsResult = await pool.query('SELECT * FROM items');
  const items = itemsResult.rows;
  const listId = req.params.id;
  const filtered = items.filter(
    item => item.list_id == listId
  );
  if(filtered.length === 0){
    res.status(200).json({
      succes: false,
      message: "List not found",
      items: []
    });
  }
  res.status(200).json({succes: true, items: filtered});
});



app.post('/add-item/:id', async (req, res) => {
  const { id } = req.params;
  const { itemdescription } = req.body;
  await pool.query(`INSERT INTO items (description,list_id) VALUES ($1, $2)`, [itemdescription,id]);
  res.status(200).json({success: true, message: "Item added"});
});

/*app.post for html <form> only */
app.put('/edit-item/:id', async (req, res) => {
  const { id } = req.params;
  const { itemdescription, status } = req.body;

  try {
    const response = await pool.query(
      `UPDATE items 
       SET 
         description = COALESCE($1, description), 
         status = COALESCE($2, status) 
       WHERE id = $3 
       RETURNING *`,
      [itemdescription || null, status || null, id] // 👈 CRITICAL FIX: Convert undefined to null
    );

    if (response.rowCount === 0) {
        return res.status(404).json({ success: false, message: "Item not found" });
    }
    
    res.status(200).json({ success: true, message: "Updated", item: response.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/*app.post for html <form> only */
app.delete('/delete-item', async(req, res) => {
  const { I_id } = req.body;
  await pool.query(`DELETE FROM items WHERE id = $1`, [I_id]);
  // FIX: Removed 'list' variable
  res.status(200).json({success: true, message: "Item deleted"});
});




app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

