import express from 'express';
import { Service } from '../models/Service.js';
import { verifyToken } from '../middleware/auth.js';
import { requireEmployee, validateRequired, sanitizeString } from '../middleware/validation.js';

const router = express.Router();

// GET /api/services
router.get('/', async (req, res) => {
  try {
    const services = await Service.findAll({
      order: [['id', 'ASC']],
    });
    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ message: 'Failed to fetch services' });
  }
});

function detectLanguage(text) {
  if (/[áéíóúñü¿¡]/i.test(text) || /\b(el|la|de|que|y|en|un|una|por|con|para|es)\b/i.test(text)) {
    return 'es';
  }
  return 'en';
}

// POST /api/services
router.post('/', verifyToken, requireEmployee, validateRequired(['name', 'description', 'price']), async (req, res) => {
  try {
    const { name, description, price } = req.body;

    const detectedLang = detectLanguage(`${name} ${description}`);

    const service = await Service.create({
      name: sanitizeString(name),
      description: sanitizeString(description),
      price,
      language: detectedLang,
    });

    res.status(201).json(service);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ message: 'Failed to create service' });
  }
});

// PUT /api/services/:id
router.put('/:id', verifyToken, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price } = req.body;

    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    await service.update({
      name: name ? sanitizeString(name) : service.name,
      description: description ? sanitizeString(description) : service.description,
      price: price || service.price,
    });

    res.json(service);
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ message: 'Failed to update service' });
  }
});

// DELETE /api/services/:id
router.delete('/:id', verifyToken, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const { Appointment } = await import('../models/Appointment.js');
    const appointments = await Appointment.findAll({ where: { serviceId: id } });

    const deletableAppointments = appointments.filter(a => !['pending', 'accepted'].includes(a.status));
    const remainingAppointments = appointments.filter(a => ['pending', 'accepted'].includes(a.status));

    for (const appt of deletableAppointments) {
      await appt.destroy();
    }

    if (remainingAppointments.length > 0) {
      return res.status(400).json({
        message: 'Cannot delete service: there are pending or upcoming appointments using this service.',
        remainingAppointments: remainingAppointments.map(a => ({ id: a.id, status: a.status, date: a.date, time: a.time }))
      });
    }

    await service.destroy();
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ message: 'Failed to delete service' });
  }
});

export default router;
