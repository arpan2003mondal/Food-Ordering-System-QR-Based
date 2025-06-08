// middleware/sessionTTL.js

function sessionTTL(req, res, next) {
  const url = req.originalUrl;

  let maxAge = 1 * 60 * 60 * 1000; // default 1 hour

  if (url.startsWith("/customer")) {
    maxAge = 3 * 60 * 60 * 1000; // 3 hours
  } else if (url.startsWith("/staff")) {
    maxAge = 12 * 60 * 60 * 1000; // 12 hours
  } else if (url.startsWith("/admin")) {
    maxAge = 1 * 60 * 60 * 1000; // 1 hour
  }

  req.sessionOptions = { maxAge };
  next();
}

export default sessionTTL;
