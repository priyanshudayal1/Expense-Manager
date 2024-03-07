const express = require("express");
const ejs = require("ejs");
const ejsMate = require("ejs-mate");
const path = require("path");
const methodOverride = require("method-override");
const User = require("./models/user");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const authenticate = require("./middleware/authentication");
const Expense = require("./models/expense");



const app = express();
const port = 5000;


app.set("view engine", "ejs");
app.engine("ejs", ejsMate);
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));


const SECRET_KEY = "mynameispiyushdayal108fromindiafootballislove";

//Connecting to the userbase
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


//Index Route
app.get("/", (req, res) => {
    res.redirect("/login");
})

//Login Route
app.get("/login", (req, res) => {
    const {isNew}=req.query;
    if (isNew){
        return res.render("login.ejs",{isNew});
    }
    res.render("login.ejs",{isNew:false});
});

//Register Page
app.get("/register", (req, res) => {
    res.render("register.ejs")
});

//Register Post Route
app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    try {
        const existingUser = await User.findOne({ username: username });
        if (existingUser) {
            res.render("error.ejs", { err: "User Already Exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = new User({ username: username, password: hashedPassword });
        const token = jwt.sign({ username: newUser.username, id: newUser._id }, SECRET_KEY);
        await newUser.save();
        const isNew=true;
        res.redirect(`/login?isNew=${isNew}`);
    } catch (err) {
        res.render("error.ejs", { err: err });
    }
});

//Login Post Request
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username: username });
        if (!user) {
            res.render("error.ejs", { err: "No User with this Username Not Exists" });
        }
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            res.render("error.ejs", { err: "Username or Password Doesn't Match...!!!" });
        }
        const token = jwt.sign({ username: user.username, id: user._id }, SECRET_KEY);
        const sortedExpenses = await Expense.find({ user: user._id }).populate("user");
        const expenses = await Expense.find({ user: user._id }).populate("user");
        const categorizedExpenses = await Expense.find({ user: user._id }).populate("user");
        res.render("home.ejs", { username: username, expenses: expenses, sortedExpenses: sortedExpenses, categorizedExpenses: categorizedExpenses });
    } catch (err) {
        res.render("error.ejs", { err: err });
    }
});


app.get("/home/:username", async (req, res) => {
    try {
        const { username } = req.params;
        let { sort, category,isAll,isSorted,isByCategory } = req.query;
        if (isAll===undefined){
            isAll=1;
        }
        console.log(isAll);
        // Assuming User is your Mongoose model for users
        const user = await User.findOne({ username });

        if (!user) {
            // Handle the case where the user is not found
            return res.render('error.ejs', { err: 'User not found' });
        }
        // Use Mongoose population to find sortedExpenses associated with the user
        const expenses = await Expense.find({ user: user._id }).populate("user");
        let sortedExpenses;
        let categorizedExpenses;
        // Common query to fetch expenses for a user with population
        const baseQuery = Expense.find({ user: user._id }).populate("user");
        const totalExpenses = expenses.reduce((acc, expense) => acc + expense.amount, 0);

        switch (sort) {
            case 'name':
                sortedExpenses = await Expense.find({ user: user._id }).populate("user").sort({ title: 1 });
                break;
            case 'date':
                sortedExpenses = await Expense.find({ user: user._id }).populate("user").sort({ date: 1 });
                break;
            case 'amount':
                sortedExpenses = await Expense.find({ user: user._id }).populate("user").sort({ amount: 1 });
                break;
            default:
                sortedExpenses = await Expense.find({ user: user._id }).populate("user");
        };
        switch (category) {
            case "food":
                categorizedExpenses = await Expense.find({ user: user._id, category: "Food" }).populate("user");
                break;
            case "transportation":
                categorizedExpenses = await Expense.find({ user: user._id, category: "Transportation" }).populate("user");
                break;
            case "utilities":
                categorizedExpenses = await Expense.find({ user: user._id, category: "Utilities" }).populate("user");
                break;
            case "entertainment":
                categorizedExpenses = await Expense.find({ user: user._id, category: "Entertainment" }).populate("user");
                break;
            case "others":
                categorizedExpenses = await Expense.find({ user: user._id, category: "Others" }).populate("user");
                break;
            case "all":
                categorizedExpenses = await Expense.find({ user: user._id }).populate("user");
                break;
            default:
                categorizedExpenses = await Expense.find({ user: user._id,category: "NO" }).populate("user");

        };
        res.render("home.ejs", { username: username, sortedExpenses: sortedExpenses, categorizedExpenses: categorizedExpenses, expenses: expenses, sort: sort,totalExpenses,isAll,isByCategory,isSorted });
    } catch (err) {
        console.error('Error retrieving sortedExpenses:', err);
        res.render('error.ejs', { err: 'Internal Server Error' });
    }
});


//User's Home Page
// app.get("/home/:username", async (req, res) => {
//     try {
//         const { username } = req.params;
//         const user = await User.findOne({ username: username });
//         Use Mongoose population to find sortedExpenses associated with the user
//         const sortedExpenses = await Expense.find({ user: user._id }).populate("user");
//         res.render("home.ejs", { username: username, sortedExpenses: sortedExpenses });
//     } catch (err) {
//         res.render("error.ejs", { err: err });
//     }
// });

//Adding New Expense Form Route
app.post("/expense/:username/new", async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username: username });
        const { title, description, amount, category, } = req.body;
        const newExpense = new Expense({ user: user._id, title: title, description: description, amount: amount, category: category });
        await newExpense.save();
        res.redirect(`/home/${username}`);
    } catch (err) {
        res.render("error.ejs", { err: err });
    }
});

//Deleting the Expense
app.delete("/expense/:username/delete/:id", async (req, res) => {
    try {
        const { id, username } = req.params;
        let expense = await Expense.findByIdAndDelete(id);
        const user = await User.findOne({ username: username });
        // Use Mongoose population to find sortedExpenses associated with the user
        const sortedExpenses = await Expense.find({ user: user._id }).populate("user");
        const expenses = await Expense.find({ user: user._id }).populate("user");
        const categorizedExpenses = await Expense.find({ user: user._id }).populate("user");
        res.render("home.ejs", { username: username, sortedExpenses: sortedExpenses,expenses,categorizedExpenses });
    } catch (err) {
        res.render("error.ejs", { err: err });
    }
});

//Logout
app.get("/logout", (req, res) => {
    res.redirect("/login");
});


app.all("*", (req, res) => {
    res.render("error.ejs", { err: "The Page that you are requesting does not exists...!!! " })
});

app.listen(port, () => {
    console.log("App listening on port 5000");
});