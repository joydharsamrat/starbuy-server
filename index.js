const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 8000;
require("dotenv").config();
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ihoeb4c.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const usersCollection = client.db("starBuy").collection("users");
const productsCollection = client.db("starBuy").collection("products");

async function run() {
  try {
    // users Api

    app.get("/users", async (req, res) => {
      const query = {};
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user?.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already existed." });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // Products api

    app.get("/latestProducts", async (req, res) => {
      const query = { status: "unsold" };
      const options = { sort: { created_at: -1 } };
      const result = await productsCollection
        .find(query, options)
        .limit(6)
        .toArray();
      res.send(result);
    });

    app.get("/myOrders", async (req, res) => {
      const email = req.query.email;
      const query = { buyer: email };
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/myProducts", async (req, res) => {
      const email = req.query.email;
      const query = { seller: email };
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/products", async (req, res) => {
      const query = { status: "unsold" };
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });

    app.put("/products", async (req, res) => {
      const id = req.body.id;
      const buyer = req.body.buyer;
      console.log(id);
      const query = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          buyer: buyer,
          status: "sold",
        },
      };
      const options = { upsert: true };
      const result = await productsCollection.updateOne(
        query,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.post("/products", async (req, res) => {
      const product = req.body;
      req.body.created_at = new Date();
      const result = await productsCollection.insertOne(product);
      res.send(result);
    });

    app.get("/auth/linkedin/callback", async (req, res) => {
      // Retrieve the authorization code from the query parameters
      const { code } = req.query;

      // Exchange the authorization code for an access token
      const tokenResponse = await fetch(
        "https://www.linkedin.com/oauth/v2/accessToken",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `grant_type=authorization_code&code=${code}&client_id=${process.env.LINKEDIN_CLIENT_ID}&client_secret=${process.env.LINKEDIN_CLIENT_SECRET}&redirect_uri=http://localhost:8000/auth/linkedin/callback`,
        }
      );

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Fetch LinkedIn user profile data and email address
      const userProfileResponse = await fetch(
        "https://api.linkedin.com/v2/me",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const userEmailResponse = await fetch(
        "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const userProfileData = await userProfileResponse.json();
      const userEmailData = await userEmailResponse.json();

      const email = userEmailData.elements[0]["handle~"].emailAddress;
      const firstName = userProfileData.localizedFirstName;
      const lastName = userProfileData.localizedLastName;
      const linkedInProfileUrl = userProfileData.profileUrl;

      console.log(
        userProfileData.id,
        email,
        firstName,
        lastName,
        linkedInProfileUrl
      );

      // Handle user data and authentication in your application
      // Send the user data back to the client
      res.json({
        uid: userProfileData.id,
        email,
        firstName,
        lastName,
        linkedInProfileUrl,
      });
    });
  } finally {
  }
}

run().catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("star buy server is running");
});

app.listen(port, () => {
  console.log("server running on port", port);
});
