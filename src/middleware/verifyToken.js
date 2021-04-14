const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

dotenv.config();
const verifyToken = async (req, res, next) => {
  const token = req.signedCookies.token || "";
  try {
    if (!token) {
      return res.status(401).send("unauthorised");
    }
    const decrypt = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decrypt.id,
      email: decrypt.email,
    };
    next();
  } catch (err) {
    return res.status(500).json(err.toString());
  }
};

module.exports = verifyToken;
