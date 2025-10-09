import Cita from "../models/cita.model.js";

// Crear cita
export const crearCita = async (req, res) => {
  try {
    const cita = await Cita.create(req.body);
    res.status(201).json(cita);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Obtener todas
export const obtenerCitas = async (req, res) => {
  try {
    const citas = await Cita.findAll();
    res.json(citas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Una cita por ID
export const obtenerCita = async (req, res) => {
  try {
    const cita = await Cita.findByPk(req.params.id);
    if (!cita) return res.status(404).json({ error: "Cita no encontrada" });
    res.json(cita);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Actualizar
export const actualizarCita = async (req, res) => {
  try {
    const cita = await Cita.findByPk(req.params.id);
    if (!cita) return res.status(404).json({ error: "Cita no encontrada" });
    await cita.update(req.body);
    res.json(cita);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Cancelar
export const cancelarCita = async (req, res) => {
  try {
    const cita = await Cita.findByPk(req.params.id);
    if (!cita) return res.status(404).json({ error: "Cita no encontrada" });
    await cita.update({
      estado: "cancelada",
      cancelado_por: req.user?.id_usuario || null,
      cancel_motivo: req.body.motivo,
    });
    res.json({ msg: "Cita cancelada", cita });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
