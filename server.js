/* CONFIGURATION */

var OpenVidu = require("openvidu-node-client").OpenVidu;
var OpenViduRole = require("openvidu-node-client").OpenViduRole;

// Check launch arguments: must receive openvidu-server URL and the secret
if (process.argv.length != 4) {
  console.log("Usage: node " + __filename + " OPENVIDU_URL OPENVIDU_SECRET");
  process.exit(-1);
}
// For demo purposes we ignore self-signed certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// Node imports
var express = require("express");
var fs = require("fs");
var session = require("express-session");
var https = require("https");
var bodyParser = require("body-parser"); // Pull information from HTML POST (express4)
var app = express(); // Create our app with express
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const methodOverride = require("method-override");

const initializePassport = require("./passport-config");
initializePassport(
  passport,
  (email) => users_new.find((user) => user.email === email),
  (id) => users_new.find((user) => user.id === id)
);

const users_new = [];

// Server configuration
// for parsing application/json
app.use(bodyParser.json());
app.set("view-engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));

app.use(
  session({
    saveUninitialized: true,
    resave: false,
    secret: "MY_SECRET",
  })
);
app.use("/public", express.static("public")); // Set the static files location
app.use(
  bodyParser.urlencoded({
    extended: "true",
  })
); // Parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // Parse application/json
app.use(
  bodyParser.json({
    type: "application/vnd.api+json",
  })
); // Parse application/vnd.api+json as json

// Listen (start app with node server.js)
var options = {
  key: fs.readFileSync("openvidukey.pem"),
  cert: fs.readFileSync("openviducert.pem"),
};

// Mock database
var users = [
  {
    user: "publisher1",
    pass: "pass",
    role: OpenViduRole.PUBLISHER,
  },
  {
    user: "publisher2",
    pass: "pass",
    role: OpenViduRole.PUBLISHER,
  },
  {
    user: "subscriber",
    pass: "pass",
    role: OpenViduRole.SUBSCRIBER,
  },
];

// Environment variable: URL where our OpenVidu server is listening
var OPENVIDU_URL = process.argv[2];
// Environment variable: secret shared with our OpenVidu server
var OPENVIDU_SECRET = process.argv[3];

// Entrypoint to OpenVidu Node Client SDK
var OV = new OpenVidu(OPENVIDU_URL, OPENVIDU_SECRET);

// Collection to pair session names with OpenVidu Session objects
var mapSessions = {};
// Collection to pair session names with tokens
var mapSessionNamesTokens = {};

/* CONFIGURATION */

/* REST API */

// Login
app.get("/", checkAuthenticated, (req, res) => {
  res.sendFile("views/index.html", { root: __dirname });
});

app.get("/login", checkNotAuthenticated, (req, res) => {
  res.render("intro.ejs");
});

app.get("/index", (req, res) => {
  res.render("index.ejs", { name: "KATY" });
});

app.get("lol", (req, res) => {
  res.render("lo.html");
});

app.post(
  "/login",
  checkNotAuthenticated,
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

app.get("/register", checkNotAuthenticated, (req, res) => {
  res.render("register.ejs");
});

app.post("/register", checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    users_new.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    });
    res.redirect("/login");
    console.log("Success create account");
  } catch {
    console.log("Failed to create account");
  }
});

app.delete("/logout", (req, res) => {
  req.logOut();
  res.redirect("/login");
});

app.post("/api-login/login", function (req, res) {
  // Retrieve params from POST body
  var user = req.body.user;
  var pass = req.body.pass;
  console.log("Logging in | {user, pass}={" + user + ", " + pass + "}");

  if (login(user, pass)) {
    // Correct user-pass
    // Validate session and return OK
    // Value stored in req.session allows us to identify the user in future requests
    console.log("'" + user + "' has logged in");
    req.session.loggedUser = user;
    res.status(200).send();
  } else {
    // Wrong user-pass
    // Invalidate session and return error
    console.log("'" + user + "' invalid credentials");
    req.session.destroy();
    res.status(401).send("User/Pass incorrect");
  }
});

// Logout
app.post("/api-login/logout", function (req, res) {
  console.log("'" + req.session.loggedUser + "' has logged out");
  req.session.destroy();
  res.status(200).send();
});

// Get token (add new user to session)
app.post("/api-sessions/get-token", function (req, res) {
  if (!isLogged(req.session)) {
    req.session.destroy();
    res.status(401).send("User not logged");
  } else {
    // The video-call to connect
    var sessionName = req.body.sessionName;

    // Role associated to this user
    var role = users.find((u) => u.user === req.session.loggedUser).role;

    // Optional data to be passed to other users when this user connects to the video-call
    // In this case, a JSON with the value we stored in the req.session object on login
    var serverData = JSON.stringify({ serverData: req.session.loggedUser });

    console.log("Getting a token | {sessionName}={" + sessionName + "}");

    // Build connectionProperties object with the serverData and the role
    var connectionProperties = {
      data: serverData,
      role: role,
    };

    if (mapSessions[sessionName]) {
      // Session already exists
      console.log("Existing session " + sessionName);

      // Get the existing Session from the collection
      var mySession = mapSessions[sessionName];

      // Generate a new token asynchronously with the recently created connectionProperties
      mySession
        .createConnection(connectionProperties)
        .then((connection) => {
          // Store the new token in the collection of tokens
          mapSessionNamesTokens[sessionName].push(connection.token);

          // Return the token to the client
          res.status(200).send({
            0: connection.token,
          });
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      // New session
      console.log("New session " + sessionName);

      // Create a new OpenVidu Session asynchronously
      OV.createSession()
        .then((session) => {
          // Store the new Session in the collection of Sessions
          mapSessions[sessionName] = session;
          // Store a new empty array in the collection of tokens
          mapSessionNamesTokens[sessionName] = [];

          // Generate a new connection asynchronously with the recently created connectionProperties
          session
            .createConnection(connectionProperties)
            .then((connection) => {
              // Store the new token in the collection of tokens
              mapSessionNamesTokens[sessionName].push(connection.token);

              // Return the Token to the client
              res.status(200).send({
                0: connection.token,
              });
            })
            .catch((error) => {
              console.error(error);
            });
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }
});

// Remove user from session
app.post("/api-sessions/remove-user", function (req, res) {
  if (!isLogged(req.session)) {
    req.session.destroy();
    res.status(401).send("User not logged");
  } else {
    // Retrieve params from POST body
    var sessionName = req.body.sessionName;
    var token = req.body.token;
    console.log(
      "Removing user | {sessionName, token}={" +
        sessionName +
        ", " +
        token +
        "}"
    );

    // If the session exists
    if (mapSessions[sessionName] && mapSessionNamesTokens[sessionName]) {
      var tokens = mapSessionNamesTokens[sessionName];
      var index = tokens.indexOf(token);

      // If the token exists
      if (index !== -1) {
        // Token removed
        tokens.splice(index, 1);
        console.log(sessionName + ": " + tokens.toString());
      } else {
        var msg = "Problems in the app server: the TOKEN wasn't valid";
        console.log(msg);
        res.status(500).send(msg);
      }
      if (tokens.length == 0) {
        // Last user left: session must be removed
        console.log(sessionName + " empty!");
        delete mapSessions[sessionName];
      }
      res.status(200).send();
    } else {
      var msg = "Problems in the app server: the SESSION does not exist";
      console.log(msg);
      res.status(500).send(msg);
    }
  }
});

/* REST API */

/* AUXILIARY METHODS */

function login(user, pass) {
  return users.find((u) => u.user === user && u.pass === pass);
}

function isLogged(session) {
  return session.loggedUser != null;
}

function getBasicAuth() {
  return (
    "Basic " + new Buffer("OPENVIDUAPP:" + OPENVIDU_SECRET).toString("base64")
  );
}

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect("/login");
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  next();
}

/* AUXILIARY METHODS */

https.createServer(options, app).listen(5000);
console.log("App listening on port 5000");
