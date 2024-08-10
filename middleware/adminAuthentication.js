const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.adminEmail) {
      next();
    } else {
      res.redirect('/admin/sign_in');
    }
  };
  