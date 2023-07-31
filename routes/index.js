const express = require('express');
const navigation = express.Router();

//authentication middleware
const { ensureAuthenticated } = require('../middleware/authorization.js')

//home page
navigation.get('/', ensureAuthenticated, (req, res) => {
  res.render('pages/calendar')
})
navigation.get('/calendar', ensureAuthenticated, (req, res) => {
  res.render('pages/calendar')
})
navigation.get('/print', ensureAuthenticated, (req, res) => {
  res.render('pages/print')
})
navigation.get('/create', ensureAuthenticated, (req, res) => {
  res.render('pages/create')
})
navigation.get('/my-tasks', ensureAuthenticated, (req, res) => {
  res.render('pages/my-tasks')
})
navigation.get('/prayer-wall', ensureAuthenticated, (req, res) => {
  res.render('pages/prayer-manager')
})
navigation.get('/refresh', ensureAuthenticated, (req, res) => {
  res.render('pages/refresh')
})
navigation.get('/upload-guide', ensureAuthenticated, (req, res) => {
  res.render('pages/guide')
})

navigation.get('/login', (req, res) => {
  res.render('pages/login', {error: null})
})





navigation.get('/logout', (req, res) => {
  try {
      req.session.user = null;
      req.session.access_token = null;
      req.session.refresh_token = null;
      res.redirect('/')
    } catch(err) {
      res.status(500).send({error: 'internal server error'})
  }
})

navigation.get('/dashboard', (req, res) => {
  res.render('pages/helpdesk-dashboard')
})

module.exports = navigation;