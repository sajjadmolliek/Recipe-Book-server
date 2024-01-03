const express = require("express");
const cors = require("cors");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// middleWare
app.use(cors());
app.use(express.json());

// MongoDB COde:

const uri = `mongodb+srv://${process.env.DB_U_NAME}:${process.env.DB_PASS}@cluster0.rsgizg7.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Database For All Recipe Adding By Admin
    const AddRecipeCollection = client
      .db("AddRecipeDB")
      .collection("Recipes");
    // Database For Add Recipe in the cart
    const AddCartRecipeCollection = client
      .db("CartRecipeDB")
      .collection("CartData");
    const AddCartReviews = client.db("CartRecipeDB").collection("Reviews");

    // --------------------------------AddRecipeCollection Data Collection Server--------------------------------------

    //<------------------Payments Info Database----------------->

    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    // Insert Reviews Data Into Database:
    app.post("/reviews", async (req, res) => {
      const Reviews = req.body;
      const result = await AddCartReviews.insertOne(Reviews);
      res.send(result);
    });
    // Read Id Specific Review From Database:
    app.get("/reviewsGet/:id", async (req, res) => {
      const id = req.params.id;
      const query = { proId:id };
      const result = await AddCartReviews.find(query).toArray();
      res.send(result);
    });

    // Insert General Data Into Database:
    app.post("/addRecipe", async (req, res) => {
      const addingRecipes = req.body;
      const result = await AddRecipeCollection.insertOne(addingRecipes);
      res.send(result);
    });
    // Read All General Recipe From Database:
    app.get("/addRecipe", async (req, res) => {
      const cursor = AddRecipeCollection.find();
      const result = await cursor.toArray();

      res.send(result);
    });
    // Read Id Specific General Recipe From Database:
    app.get("/reviewRecipes/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await AddRecipeCollection.findOne(query);
      res.send(result);
    });
    // Read All General Recipe From Database:
    app.get("/addRecipes", async (req, res) => {
      const cursor = AddRecipeCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    // Read All General Recipe From Database:
    app.get("/addRecipes/:brand_name", async (req, res) => {
      const Recipes = req.params;
      const query = { brand_name: Recipes.brand_name };
      const cursor = AddRecipeCollection.find(query);
      const result = await cursor.toArray();

      res.send(result);
    });
    // POST and Read From Database:
    app.post("/addRecipes", async (req, res) => {
      try {
        const Recipes = req.body; // This contains the brand_name sent from the frontend

        // Use the brand_name to query your MongoDB collection
        const query = { brand_name: Recipes.brand_name };
        const cursor = AddRecipeCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        console.error("Error querying the database:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // Read With Id From All Cart Recipe From Database:
    app.get("/addRecipe/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await AddRecipeCollection.findOne(query);
      res.send(result);
    });

    // Update Data in Database
    app.patch("/addRecipe/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const query = { _id: new ObjectId(id) };

      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: data.name,
          brand_name: data.brand_name,
          type: data.type,
          price: data.price,
          description: data.description,
          rating: data.rating,
          photo: data.photo,
        },
      };
      const result = await AddRecipeCollection.updateOne(
        query,
        updateDoc,
        options
      );
      res.send(result);
    });

    // Insert Cart Data Into Database:
    app.post("/cartRecipe", async (req, res) => {
      const addingCartRecipes = req.body;
      const result = await AddCartRecipeCollection.insertOne(
        addingCartRecipes
      );
      res.send(result);
    });

    // Read All Cart Recipe From Database:
    app.get("/cartRecipe", async (req, res) => {
      const cursor = AddCartRecipeCollection.find();
      const result = await cursor.toArray();

      res.send(result);
    });

    // Delete Data From Database
    app.delete("/cartRecipe/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await AddCartRecipeCollection.deleteOne(query);
      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello I am REST API");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
