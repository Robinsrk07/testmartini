const { MongoClient, ServerApiVersion } = require('mongodb');

// Your MongoDB Atlas connection string
const uri = "mongodb+srv://robinsyriak07:rKOg1c9ME4RfL9EO@pinkmartini.qv1ki.mongodb.net/MARTINI?retryWrites=true&w=majority";

// Create a new MongoClient instance
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Function to connect and access the database
const connection = async () => {
  try {
    // Connect to the MongoDB cluster
    await client.connect();
    console.log("Connected to MongoDB!");

    // Access the MARTINI database
    const db = client.db("MARTINI");

    // Optional: Perform a simple query to check the connection
    const collection = db.collection("admins"); // Replace with your collection name
    const sampleData = await collection.findOne(); // Fetch a single document for testing
    console.log("Sample Data:", sampleData);

  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  } finally {
    // Close the connection
    await client.close();
  }
};

// Export the connection function
module.exports = {
  connection,
};
