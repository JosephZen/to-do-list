import express from 'express';

const app = express();
app.use(express.json());

const PORT = 3000;

app.get('/', (req, res) => {
  res.send(`Hello Traveler! Welcome to the UMA Musume server.`);
});


app.get('/NTR', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Oguri Cap</title>
        <style>
            body {
                /* Flexbox is used here to perfectly center the content */
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh; /* Takes up full viewport height */
                margin: 0;
                background-color: #ffffff;
                overflow: hidden; /* Optional: Hides scrollbars if text is too big */
            }
            h1 {
                font-size: 200px;
                font-family: Arial, sans-serif;
                margin: 0;
                
                /* This creates the Red and Green color effect */
                background: linear-gradient(to right, red, green);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                color: transparent;
            }
        </style>
    </head>
    <body>
        <h1>NTR as in Narita Top Road</h1>
    </body>
    </html>
  `);
});


const list= [
  {
    id: 1,
    title: "Assignments",
    status: "pending"
  },
  {
    id: 2,
    title: "Daily Chores",
    status: "pending"
  }
]

const items = [
  {
    id: 1,
    list_id: 1,
    description: "Programming",
    status: "pending"
  },
  {
    id: 2,
    list_id: 1,
    description: "Web Dev",
    status: "pending"
  },
  {
    id: 3,
    list_id: 2,
    description: "Wash Dish",
    status: "pending"
  },
  {
    id: 4,
    list_id: 2,
    description: "Clean the room",
    status: "pending"
  }
]


app.get('/get-list', (req, res) => {
  res.status(200).json({succes: true, list});
});

app.post('/add-list',express.json(), (req, res) => {
  const { listTitle } = req.body;

  list.push({
    id: list.length + 1,
    title: listTitle,
    status: "pending"
  });
  res.status(200).json({succes: true, list, message: "Title Succesfully added"});
});

app.get('/edit-list', (req, res) => {
  res.status(200).json({succes: true, list});
});

app.get('/delete-list', (req, res) => {
  res.status(200).json({succes: true, list});
});

app.get('/get-items/:id', (req, res) => {
  
  const listId = req.params.id;
  const filtered = items.filter(
    item => item.list_id == listId
  );

  if(filtered.length === 0){
    res.status(200).json({
      succes: false,
      message: "List not found"
    });
  }


  res.status(200).json({succes: true, items: filtered});
});

app.get('/add-item', (req, res) => {

  res.status(200).json({succes: true, list});
});

app.get('/edit-item', (req, res) => {
  res.status(200).json({succes: true, list});
});

app.get('/delete-item', (req, res) => {
  res.status(200).json({succes: true, list});
});



app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});