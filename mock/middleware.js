// mock/middleware.js
module.exports = (req, _res, next) => {
  if (req.method === 'POST' && req.path === '/clients') {
    if (!req.body) { next(); return }
    const year = new Date().getFullYear()
    const rand = Math.floor(Math.random() * 9000) + 1000
    req.body.id = `clnt_${Date.now()}`
    req.body.reference = `CUST-${year}-${rand}`
    req.body.createdAt = new Date().toISOString()
  }
  next()
}
