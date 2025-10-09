import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Páginas públicas
import Home from "./pages/Home";
import Servicios from "./pages/Servicios";
import QuienesSomos from "./pages/QuienesSomos";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Perfil from "./pages/Perfil";
import Citas from './pages/Citas';
import PacienteDashboard from "./pages/paciente/Dashboard";

// Admin
import PrivateRoute from "./components/PrivateRoute.jsx";
import AdminLayout from "./pages/admin/AdminLayout";
import Overview from "./pages/admin/Overview";
import Usuarios from "./pages/admin/Usuarios";
import Roles from "./pages/admin/Roles";
import Seguridad from "./pages/admin/Seguridad";
import Configuracion from "./pages/admin/Configuracion";

// Optometrista
import OptoLayout from "./pages/opto/OptoLayout";
import AgendaDiaria from "./pages/opto/AgendaDiaria";
import FichasMedicas from "./pages/opto/FichasMedicas";
import CRM from "./pages/opto/CRM";
import Pacientes from "./pages/opto/Pacientes";

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -8 },
};
const pageTransition = { duration: 0.25, ease: "easeOut" };

export default function App() {
  const location = useLocation();

  return (
    <>
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
        >
          <Routes location={location}>
            {/* Públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/servicios" element={<Servicios />} />
            <Route path="/quienes-somos" element={<QuienesSomos />} />

            {/* Login SOLO (pantalla completa dentro del propio componente) */}
            <Route path="/login" element={<Login />} />

            {/* Registro separado */}
            <Route path="/registro" element={<Register />} />

            {/* Perfil (protegido, cualquier rol logueado) */}
            <Route
              path="/perfil"
              element={
                <PrivateRoute>
                  <Perfil />
                </PrivateRoute>
              }
            />
            <Route
                path="/paciente"
                element={
                  <PrivateRoute roles={[3]}>
                    <PacienteDashboard />
                  </PrivateRoute>
                }
              />
            <Route path="/citas" element={<Citas />} />
            {/* Dashboard Admin (rol 1) */}
            <Route
              path="/admin"
              element={
                <PrivateRoute roles={[1]}>
                  <AdminLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<Overview />} />
              <Route path="usuarios" element={<Usuarios />} />
              <Route path="roles" element={<Roles />} />
              <Route path="seguridad" element={<Seguridad />} />
              <Route path="configuracion" element={<Configuracion />} />
            </Route>

            {/* Dashboard Optometrista (rol 2) */}
            <Route
              path="/optometrista"
              element={
                <PrivateRoute roles={[2]}>
                  <OptoLayout />
                </PrivateRoute>
              }
            >
              
              <Route path="agenda" element={<AgendaDiaria />} />
              <Route path="fichas" element={<FichasMedicas />} />
              <Route path="crm" element={<CRM />} />
              <Route path="pacientes" element={<Pacientes />} />
            </Route>
          </Routes>
        </motion.div>
      </AnimatePresence>
      <Footer />
    </>
  );
}
