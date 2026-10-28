const express = require('express');
const app = express();
const cors = require('cors'); 
const port = 3000;


app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/api/products', (req, res) => {
    const products = [
        { 
            id: 1, name: 'mie gacoan', harga: 3000 
        },
        { 
            id: 2, name: 'udang bakar', harga: 2000
        }
    ];
    res.json(products);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
}
);
