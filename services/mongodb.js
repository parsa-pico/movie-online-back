const mongodb = require("mongodb");

const mongodbEndpoint = process.env.MONGO_URL;
const dataBase = "queue";

module.exports = class DB {
  static client;

  static getClient() {
    if (!this.client) {
      this.client = new mongodb.MongoClient(mongodbEndpoint);
    }
    return this;
  }

  static async connect() {
    try {
      await this.client.connect();
      await this.client.db("queue").command({ ping: 1 });
      console.log("connected to mongodb service ");
    } catch (error) {
      console.log(error);
      if (this.client) await this.client.close();
    }
  }
  static getCollection(db = dataBase, collection) {
    return this.client.db(db).collection(collection);
  }
  static async countCollection(mycollection, db = dataBase) {
    const collection = this.getCollection(db, mycollection);
    return await collection.countDocuments();
  }
  static async insertOne(mycollection, data, db = dataBase) {
    const collection = this.getCollection(db, mycollection);
    return await collection.insertOne(data);
  }
  static async insertMany(mycollection, dataArray, db = dataBase) {
    const collection = this.getCollection(db, mycollection);
    return await collection.insertMany(dataArray);
  }

  static async findOne(mycollection, queryObj, options, db = dataBase) {
    const collection = this.getCollection(db, mycollection);
    return await collection.findOne(queryObj, options);
  }
  static async find(mycollection, queryObj, db = dataBase) {
    const collection = this.getCollection(db, mycollection);

    return await collection.find(queryObj);
  }
  static async updateOne(
    mycollection,
    queryObj,
    data,
    upsert = false,
    db = dataBase
  ) {
    const collection = this.getCollection(db, mycollection);
    return await collection.updateOne(
      queryObj,
      { $set: data },
      {
        upsert,
      }
    );
  }
  static async updateMany(mycollection, queryObj, data, db = dataBase) {
    const collection = this.getCollection(db, mycollection);
    return await collection.updateMany(queryObj, { $set: data });
  }
  static async deleteOne(mycollection, queryObj, db = dataBase) {
    const collection = this.getCollection(db, mycollection);
    return await collection.deleteOne(queryObj);
  }
  static async deleteMany(mycollection, queryObj, db = dataBase) {
    const collection = this.getCollection(db, mycollection);
    return await collection.deleteMany(queryObj);
  }
  static async findOneAndDelete(mycollection, queryObj, db = dataBase) {
    const collection = this.getCollection(db, mycollection);
    return await collection.findOneAndDelete(queryObj);
  }
};

// module.exports = {
//   getCollection,
//   insertOne,
//   findOne,
//   find,
//   updateOne,
//   updateMany,
//   deleteMany,
//   deleteOne,
//   countCollection,
//   findOneAndDelete,
//   client,
//   connect,
//   insertMany,
//   dataBase,
// };
