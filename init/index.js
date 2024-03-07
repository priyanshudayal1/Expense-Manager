const mongoose = require("mongoose");
const User = require("../models/user");

const data = [
  {
    username: "piyush",
    password: "piyush123"
  },
  {
    username: "rinshu",
    password: "rinshu123"
  }
];

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect("mongodb://localhost:27017/expense");
}

const initDB = async () => {
  await User.deleteMany({});
  await User.insertMany(data);
  const newUser = new User({
    username: 'bob',
    password: 'bob123'
  });
  newUser.save();
  console.log("data was initialized");
};

initDB();