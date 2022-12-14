const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 8000
require('dotenv').config();
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ihoeb4c.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const usersCollection = client.db('starBuy').collection('users');
const productsCollection = client.db('starBuy').collection('products');


async function run() {
    try {
        // users Api

        app.get('/users', async (req, res) => {
            const query = {}
            const result = await usersCollection.find(query).toArray();
            res.send(result)
        })
        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user?.email };
            const existingUser = await usersCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: "user already existed." })
            }
            const result = await usersCollection.insertOne(user)
            res.send(result)
        })

        // Products api 

        app.get('/myProducts', async (req, res) => {
            const email = req.query.email;
            const query = { seller: email }
            const result = await productsCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/products', async (req, res) => {
            const query = { status: "unsold" }
            const result = await productsCollection.find(query).toArray();
            res.send(result)
        })

        app.post('/products', async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product)
            res.send(result)
        })

    }
    finally {

    }
}

run().catch((err) => console.log(err))


app.get('/', (req, res) => {
    res.send('star buy server is running')
})

app.listen(port, () => {
    console.log('server running on port', port)
})