const express = require("express");
const router = new express.Router();
const userdb = require("../models/userSchema");
const bcrypt = require("bcryptjs");
const Authenticate = require("../middleware/Authenticate");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

const secretKey = process.env.SECRET_KEY;
// email config
const transporter = nodemailer.createTransport({
  // secure:false,
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// user registeration
router.post("/register", async (req, res) => {
  // console.log(req.body);

  const { name, email, password, cpassword } = req.body;
  if (!name || !email || !password || !cpassword) {
    res.status(422).json({
      error: "fill all the details",
    });
  }

  try {
    const preuser = await userdb.findOne({
      email: email,
    });
    if (preuser) {
      // console.log("User already exists");
      res.status(522).json({
        status: 522,
        error: "This email is already exists",
      });
    } else if (password !== cpassword) {
      res.status(422).json({
        status:422,
        error: "Password and Confirm Password Not Match",
      });
    } else {
      const finalUser = new userdb({
        name,
        email,
        password,
        cpassword,
      });

      // Password Hashing
      const storeData = await finalUser.save();

      res.status(201).json({
        status: 201,
        storeData,
      });
    }
  } catch (error) {
    res.status(422).json(error);
  }
});

//Create Login api
router.post("/login", async (req, res) => {
  // console.log(req.body);
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(422).json({
      error: "fill all the details",
    });
  }

  try {
    const userValid = await userdb.findOne({ // Checking email is exixts or not
      email: email,
    });

    if (userValid) { // User is valid
      const isMatch = await bcrypt.compare(password, userValid.password); // checking password from database

      if (!isMatch) { // Password did not match
        res.status(501).json({
          status:501,
          error: "Incorrect password",
        });
      } else { // Password matched
        // token generate
        const token = await userValid.generateAuthToken();
        console.log("Token generated", token);
        // cookiegenerate
        res.cookie("usercookie", token, {
          expires: new Date(Date.now() + 9000000),
          httpOnly: true,
        });

        const result = {
          userValid,
          token,
        };
        res.status(201).json({
          status: 201,
          result,
        });
      }
    }else{ // Invalid user
      res.status(502).json({
          status:502,
          error: "Invalid user",
      });
    }
  } catch (error) {
    res.status(401).json({ status: 401, error });
  }
});

// valid user
router.get("/validuser", Authenticate, async (req, res) => {
  try {
    const validUser = await userdb.findOne({
      _id: req.userId,
    });
    res.status(201).json({
      status: 201,
      validUser,
    });
  } catch (error) {
    res.status(401).json({
      status: 401,
      error,
    });
  }
});

// logout api
router.get("/logout", Authenticate, async (req, res) => {
  try {
    req.rootUser.tokens = req.rootUser.tokens.filter((curelem) => {
      return curelem.token !== req.token; // return all token values that does not match except one token value that match
    });
    res.clearCookie("usercookie", {
      path: "/",
    });
    req.rootUser.save();
    res.status(201).json({
      status: 201,
    });
  } catch (error) {
    res.status(401).json({
      status: 401,
      error,
    });
  }
});

// send email link for Reset Password
router.post("/sendpasswordlink", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(401).json({
      status: 401,
      message: "Enter Your Email",
    });
  }
  try {
    const userFind = await userdb.findOne({
      email: email,
    });

    // token generate for reset password
    const token = jwt.sign(
      {
        _id: userFind._id,
      },
      secretKey,
      {
        expiresIn: "300s",
      }
    );

    const setusertoken = await userdb.findByIdAndUpdate(
      {
        _id: userFind._id,
      },
      {
        verifytoken: token,
      },
      {
        new: true,
      }
    );
    if (setusertoken) {
      const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: "Sending Email for Reset Password",
        text: `This Link Valid For 5 Minutes http://localhost:3001/forgotpassword/${userFind._id}/${token}`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("[Error]", error);
          res.status(401).json({
            status: 401,
            message: "Email Not Send",
          });
        } else {
          console.log("Email Sent", info.response);
          res.status(201).json({
            status: 201,
            message: "Email Sent Successfully",
          });
        }
      });
    }
  } catch (error) {
    res.status(401).json({
      status: 401,
      message: "Invalid User",
    });
  }
});

// Verify user for forgot password time
router.get("/forgotpassword/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  try {
    const validUser = await userdb.findOne({ _id: id, verifytoken: token });
    const verifyToken = jwt.verify(token, secretKey);
    if (validUser && verifyToken._id) {
      res.status(201).json({ status: 201, validUser });
    } else {
      res.status(401).json({ status: 401, message: "User Not Exists" });
    }

  } catch (error) {
    console.log('nahi gaya');
    res.status(401).json({ status: 401, error });
  }
});

// Password Changed
router.post("/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;
  try {
    const validUser = await userdb.findOne({ _id: id, verifytoken: token });
    const verifyToken = jwt.verify(token, secretKey);
    if (validUser && verifyToken._id) {
      const newPassword = await bcrypt.hash(password, 12);
      const setNewPass = await userdb.findByIdAndUpdate(
        { _id: id },
        { password: newPassword }
      );
      setNewPass.save();
      res.status(201).json({ status: 201, setNewPass });
    } else {
      res.status(401).json({ status: 401, message: "User Not Exists" });
    }
  } catch (error) {
    res.status(401).json({ status: 401, error });
  }
});
module.exports = router;
