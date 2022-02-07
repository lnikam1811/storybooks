const path = require("path")
const express = require("express")
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const morgan = require("morgan")
const { engine } = require("express-handlebars")
const methodOverride = require("method-override")
const passport = require("passport")
const session = require("express-session")
const MongoStore = require("connect-mongo")
const connectDB = require("./config/db")

//Extra security packages
const helmet = require("helmet")
const cors = require("cors")
const xss = require("xss-clean")

//Load config
dotenv.config({ path: "./config/config.env" })

//passport config
require("./config/passport")(passport)

connectDB()

const app = express()

//body parser
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
// extra packages
app.use(helmet())
app.use(cors())
app.use(xss())

//Method Override
app.use(
  methodOverride(function (req, res) {
    if (req.body && typeof req.body === "object" && "_method" in req.body) {
      // look in urlencoded POST bodies and delete it
      let method = req.body._method
      delete req.body._method
      return method
    }
  })
)

//logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"))
}

//Handlebars helpers
const {
  formatDate,
  truncate,
  stripTags,
  editIcon,
  select,
} = require("./helper/hbs")

//handlebars
app.engine(
  ".hbs",
  engine({
    helpers: {
      formatDate,
      truncate,
      stripTags,
      editIcon,
      select,
    },
    defaultLayout: "main",
    extname: ".hbs",
  })
)
app.set("view engine", ".hbs")

//Sessions
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  })
)

//passport middlerware
app.use(passport.initialize())
app.use(passport.session())

//Set global variables
app.use(function (req, res, next) {
  res.locals.user = req.user || null
  next()
})

//static files
app.use(express.static(path.join(__dirname, "public")))

//routes
app.use("/", require("./routes/index"))
app.use("/auth", require("./routes/auth"))
app.use("/stories", require("./routes/stories"))

const port = process.env.PORT || 5000

app.listen(
  port,
  console.log(
    `Server is running in ${process.env.NODE_ENV} mode on port ${port}`
  )
)
