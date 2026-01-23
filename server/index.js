import express from 'express';
import { pool } from './db.js';
import { hashPassword, comparePassword } from './components/hash.js';
import session from 'express-session';

const app = express();
app.use(express.json());

const PORT = 3000;


app.use(session({
  secret: 'my_super_secret_key', // Change this to a random long string
  resave: false,                 // false = cleaner, only saves if data changes
  saveUninitialized: false,      // false = prevents empty sessions for guests
  cookie: { 
    secure: false,               // Set to TRUE if using HTTPS (production)
    maxAge: 1000 * 60 * 60 * 24  // Session expires in 24 hours
  }
}));


app.post('/register', async (req, res) => {
  const { username, name, password, confirm } = req.body;
  
  if (!username || !password || !confirm, !name) {
      return res.status(400).json({ success: false, message: 'Please provide username, password, and confirm password.' });
  }

  if (password !== confirm) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
  }
  
  const userCheck = await pool.query('SELECT * FROM user_accounts WHERE username = $1', [username]);
  if (userCheck.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'User already exists.' });
  }

  const hashedPassword = await hashPassword(password);

  const newUser = await pool.query(
    `INSERT INTO user_accounts (username, password, name) VALUES ($1, $2,$3) RETURNING *`,
    [username, hashedPassword,name] 
  );
  
  res.status(201).json({ 
    success: true, 
    message: 'Registered Successfully', 
    user: newUser.rows[0]
  });
});


app.post('/login', async(req, res) => {
  if (req.session.user) {
    return res.status(200).json({ 
      success: false, 
      message: 'You are already logged in.', 
      user: req.session.user 
    });
  }
  
  const { username, password,name } = req.body;
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
        user: { 
          id: user.id, 
          username: user.username,
          name: user.name } 
      });
  } else {
    res.status(401).json({ success: false, message: 'Invalid username or password' });
  }
});


app.get('/get-session', (req, res) => {
  if (req.session.user) {
    res.status(200).json({ 
      session: true, 
      message: 'Session Active, True',
      user: {
        id: req.session.user.id,
        name: req.session.user.name // Assuming you saved it as 'username' in login
      }
    });
  } else {
    res.status(200).json({ 
      session: false,
      message: 'No Active Session, False',
      user: null 
    });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Could not log out" });
    }
    // Clear the cookie on the browser/client side
    // 'connect.sid' is the default name express-session uses
    res.clearCookie('connect.sid'); 
    res.status(200).json({ success: true, message: "Logout successful" });
  });
});

app.get('/get-list', async (req, res) => {
  const list = await pool.query('SELECT * FROM list');
  res.status(200).json({success: true, list: list.rows});
});

app.post('/add-list', async (req, res) => {
  const { listTitle } = req.body;

  const list = await pool.query('SELECT * FROM list');
  await pool.query(`INSERT INTO list (title, status) VALUES ($1, $2)`,
    [listTitle, "pending"]);
    
    /*list.push({
      id: list.length + 1,
      title: listTitle,
      status: "pending"
  });*/
  res.status(200).json({
    succes: true, 
    message: "Title Succesfully added",
    list: list.rows
  });
});
/*app.post for html <form> only */
app.put('/edit-list/:id', async (req, res) => {
  const { id } = req.params;
  const {listTitle, status} = req.body;
  /*'alternative' const {id,listTitle, status} = req.body;

  await pool.query(`UPDATE list SET title = $1, status = $2 WHERE id = $3 RETURNING *`,
    [listTitle, status, id]);
  const updatedEntry =  await pool.query(
  if (updatedEntry.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Item not found" });
  }
  */
  const updatedEntry = await pool.query(
    `UPDATE list SET title = $1, status = $2 WHERE id = $3 RETURNING *`,
    [listTitle, status, id]
  );

  if (updatedEntry.rows.length === 0) {
      return res.status(404).json({ success: false, message: "List not found" });
    }
  res.status(200).json({
      success: true,
      message: "Title successfully edited",
      data: updatedEntry.rows[0] 
    });
});

/*app.post for html <form> only */
app.delete('/delete-list', async (req, res) => {
  const { L_id } = req.body;
  const response = await pool.query(
        `DELETE FROM list WHERE id = $1`, 
        [L_id]
    );
  res.status(200).json({succes: true, list});
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
  const {itemdescription } = req.body;
  await pool.query(`INSERT INTO items (description,list_id) VALUES ($1, $2)`,
    [itemdescription,id]);
  res.status(200).json({succes: true, message: "Item succesfully added"});
});

/*app.post for html <form> only */
app.put('/edit-item/:id', async(req, res) => {
  const { id } = req.params;
  const {itemdescription } = req.body;
  /*await pool.query(
    `UPDATE items SET description = $1 WHERE id = $2`,
  [itemdescription, id]);
  */
  const response = await pool.query(
    `UPDATE items SET description = $1 WHERE id = $2`,
    [itemdescription, id]
  );
  if (response.rowCount === 0) {
        return res.status(404).json({ success: false, message: "Item not found" });
  }
  res.status(200).json({succes: true, message: "Item succesfully edited"});
});



/*app.post for html <form> only */
app.delete('/delete-item', async(req, res) => {
  const { I_id } = req.body;
  const response = await pool.query(
        `DELETE FROM items WHERE id = $1`, 
        [I_id]
    );
  res.status(200).json({succes: true, list});
});



app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

