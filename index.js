const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;

// middleware
// app.use(cors());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://ta-fashion.web.app",
      "https://ta-fashion.firebaseapp.com",
    ],
  })
);
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dc9spgo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    // Start

    const productsCollection = client.db("taFashion").collection("products");

    app.get("/Products", async (req, res) => {
      const {
        search = "",
        priceRange,
        sortBy = "",
        brand = "",
        category = "",
      } = req.query;
      const page = parseInt(req.query.page);
      // console.log(req.query);
      const resultsPerPage = parseInt(9);

      const query = {};
      if (search) {
        query.$or = [
          { ProductName: { $regex: search, $options: "i" } },
          { BrandName: { $regex: search, $options: "i" } },
        ];
      }

      // Add Brand Filter
      if (brand) {
        query.BrandName = brand;
      }

      // Add Category Filter
      if (category) {
        query.Category = category;
      }

      // Split and parse price range
      const [minPrice, maxPrice] = priceRange
        ? priceRange.split("-").map(parseFloat)
        : [null, null];
      // Filtering by Price Range
      if (minPrice && maxPrice) {
        query.Price = {
          $gte: parseFloat(minPrice),
          $lte: parseFloat(maxPrice),
        };
      } else if (minPrice) {
        query.Price = { $gte: parseFloat(minPrice) };
      } else if (maxPrice) {
        query.Price = { $lte: parseFloat(maxPrice) };
      }

      // Sorting
      let sortOptions = {};
      if (sortBy === "price-asc") {
        sortOptions = { Price: 1 }; // Sort by Price: Low to High
      } else if (sortBy === "price-desc") {
        sortOptions = { Price: -1 }; // Sort by Price: High to Low
      } else if (sortBy === "date-desc") {
        sortOptions = { CreationDateTime: -1 }; // Sort by Date Added: Newest first
      }

      const result = await productsCollection
        .find(query)
        .sort(sortOptions)
        .skip(page * resultsPerPage)
        .limit(resultsPerPage)
        .toArray();
      res.send(result);
    });

    app.get("/productCount", async (req, res) => {
      const count = await productsCollection.estimatedDocumentCount();
      res.send({ count });
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("ta is running");
});
app.listen(port, () => {
  console.log(`ta fashion Server is running on port ${port}`);
});
