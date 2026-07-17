const express = require('express');
const { createEditCodeGuard } = require('../middleware/requireEditCode');
const { accessSession } = require('../middleware/accessSession');

const router = express.Router();
const requireEditCode = createEditCodeGuard();

router.post('/iniciar', requireEditCode, (req, res) => {
  if (!accessSession.issue(req, res)) {
    return res.status(503).json({
      code: 'ACCESS_CODE_NOT_CONFIGURED',
      message: 'El acceso institucional no está disponible porque el código no ha sido configurado.',
    });
  }
  res.set('Cache-Control', 'no-store');
  return res.json({ message: 'Acceso institucional habilitado.' });
});

router.get('/estado', accessSession.requireApiAccess, (req, res) => {
  res.set('Cache-Control', 'no-store');
  return res.json({ authenticated: true });
});

router.post('/cerrar', (req, res) => {
  accessSession.clear(req, res);
  res.set('Cache-Control', 'no-store');
  return res.json({ message: 'Sesión cerrada.' });
});

module.exports = router;
