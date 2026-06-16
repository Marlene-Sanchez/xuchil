"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import HeaderXuchil from "@/components/HeaderXuchil";
import Modal from "@/components/Modal";
import styles from "../user/User.module.css"; 

interface SystemUser {
  id: number;
  displayName: string;
  contactInfo: string | null;
  role?: "empleado" | "temporal";
  isActive?: boolean;
}

const CreateUserPage = () => {
  const router = useRouter();
  const [userType, setUserType] = useState<"permanente" | "temporal">("permanente");
  const [loading, setLoading] = useState(false);
  
  const [usersList, setUsersList] = useState<SystemUser[]>([
    {
      id: 101,
      displayName: "Alejandro Ruiz",
      contactInfo: "alejandro.ruiz@xuchil.com",
      role: "empleado",
      isActive: true,
    },
    {
      id: 102,
      displayName: "Sofía Hernández (Marlene Design)",
      contactInfo: "951-123-4567",
      role: "temporal",
      isActive: true,
    }
  ]);

  const [tempFullName, setTempFullName] = useState("");
  const [tempEmail, setTempEmail] = useState("");
  const [tempPhone, setTempPhone] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [tempDurationDays, setTempDurationDays] = useState("7");
  const [tempRoleId, setTempRoleId] = useState("");


  const [permName, setPermName] = useState("");
  const [permLastNameP, setPermLastNameP] = useState("");
  const [permLastNameM, setPermLastNameM] = useState("");
  const [permPhone, setPermPhone] = useState("");
  const [permEmail, setPermEmail] = useState("");
  const [permPassword, setPermPassword] = useState("");
  const [permConfirmPassword, setPermConfirmPassword] = useState("");

  const [notificationModal, setNotificationModal] = useState({
    open: false,
    title: "",
    message: "",
    error: false,
  });

  useEffect(() => {
    loadSystemUsers();
  }, []);

 const loadSystemUsers = async () => {
    try {
      const response = await fetch("/api/users", { credentials: "include" });

      if (response.ok) {
        const dataAuthUsers = await response.json();
        
        if (dataAuthUsers && dataAuthUsers.length > 0) {
          const usuariosMapeados = dataAuthUsers.map((user: any) => {
            const nombreReal = user.worker?.fullName || user.fullName || "Trabajador sin nombre";
            const contactoReal = user.email || (user.worker?.phone ? `Tel: ${user.worker.phone}` : "Sin contacto");
            
            const esTemporal = user.worker?.roleId === null || user.role === "temporal";

            return {
              id: user.id, 
              displayName: nombreReal,
              contactInfo: contactoReal,
              role: esTemporal ? "temporal" : "empleado",
              isActive: user.isActive ?? user.worker?.isActive ?? true
            };
          });

          setUsersList(usuariosMapeados);
          return;
        }
      }

      setUsersList([
        { id: 101, displayName: "Alejandro Ruiz (Mock)", contactInfo: "alejandro.ruiz@xuchil.com", role: "empleado", isActive: true },
        { id: 102, displayName: "Sofía Hernández (Mock)", contactInfo: "951-123-4567", role: "temporal", isActive: true }
      ]);
    } catch (e) {
      console.error("Error al mapear con la estructura AuthUser:", e);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isTemp = userType === "temporal";
      
      const bodyPayload = isTemp
        ? {
            fullName: tempFullName.trim(),
            phone: tempPhone.trim() || null,
            email: tempEmail.trim(),
            password: tempPassword || undefined,
            temporaryDurationDays: Number.parseInt(tempDurationDays, 10) || 7,
            roleId: null
          }
        : {
            fullName: `${permName.trim()} ${permLastNameP.trim()} ${permLastNameM.trim()}`.trim(),
            phone: permPhone.trim() || null,
            email: permEmail.trim(),
            password: permPassword,
            temporaryDurationDays: null,
            roleId: 1 // Rol permanente
          };

      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(bodyPayload),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setNotificationModal({
          open: true,
          title: "Error al crear usuario",
          message: payload?.error || "No se pudo completar el registro.",
          error: true,
        });
        return;
      }

      setNotificationModal({
        open: true,
        title: "Registro Exitoso",
        message: "El usuario y su perfil de trabajador se crearon correctamente.",
        error: false,
      });


      setTempFullName(""); setTempEmail(""); setTempPhone(""); setTempPassword(""); setTempRoleId(""); setTempDurationDays("7");
      setPermName(""); setPermLastNameP(""); setPermLastNameM(""); setPermPhone(""); setPermEmail(""); setPermPassword(""); setPermConfirmPassword("");
      
      await loadSystemUsers();
    } catch {
      setNotificationModal({ open: true, title: "Error de red", message: "Hubo un problema de conexión.", error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: number) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setNotificationModal({
          open: true,
          title: "No se pudo desactivar",
          message: payload?.error || "El servidor rechazó el cambio de estado.",
          error: true,
        });
        return;
      }

      setNotificationModal({
        open: true,
        title: "Estado Actualizado",
        message: "El usuario ha sido desactivado con éxito.",
        error: false,
      });

      await loadSystemUsers();
    } catch (e) {
      console.error("Failed to toggle status:", e);
    }
  };

  return (
    <div className="page" style={{ minHeight: "100vh", paddingBottom: "60px" }}>
      <HeaderXuchil />
      
      <div style={{ padding: "20px", maxWidth: "480px", margin: "0 auto" }}>
        
        <button 
          onClick={() => router.push("/user")}
          style={{ background: "none", border: "none", color: "#1C352D", cursor: "pointer", marginBottom: "15px", fontWeight: "bold", fontSize: "0.9rem" }}
        >
          ← Volver al Perfil
        </button>

        <h1 style={{ textAlign: "center", color: "#1C352D", marginBottom: "20px", fontSize: "1.8rem" }}>
          Administración de Personal
        </h1>

        <div style={{ display: "flex", gap: "10px", marginBottom: "25px" }}>
          <button
            type="button"
            onClick={() => setUserType("permanente")}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "8px",
              border: userType === "permanente" ? "2px solid #1C352D" : "1px solid #cbd5e1",
              backgroundColor: userType === "permanente" ? "#e6f4ea" : "#fff",
              color: "#1C352D",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            Permanente
          </button>
          <button
            type="button"
            onClick={() => setUserType("temporal")}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "8px",
              border: userType === "temporal" ? "2px solid #1C352D" : "1px solid #cbd5e1",
              backgroundColor: userType === "temporal" ? "#e6f4ea" : "#fff",
              color: "#1C352D",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            Temporal
          </button>
        </div>

        <form onSubmit={handleRegister} style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
          
          {userType === "permanente" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <h3 style={{ margin: "0 0 10px 0", color: "#1C352D", fontSize: "1.1rem" }}>Crear nuevo usuario</h3>
              
              <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Nombre:</label>
              <input type="text" value={permName} onChange={(e) => setPermName(e.target.value)} className={styles.guestInput} required />
              
              <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Apellido Paterno:</label>
              <input type="text" value={permLastNameP} onChange={(e) => setPermLastNameP(e.target.value)} className={styles.guestInput} required />
              
              <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Apellido Materno:</label>
              <input type="text" value={permLastNameM} onChange={(e) => setPermLastNameM(e.target.value)} className={styles.guestInput} />
              
              <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Teléfono:</label>
              <input type="text" value={permPhone} onChange={(e) => setPermPhone(e.target.value)} className={styles.guestInput} />
              
              <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Correo:</label>
              <input type="email" value={permEmail} onChange={(e) => setPermEmail(e.target.value)} className={styles.guestInput} required />
              
              <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Contraseña:</label>
              <input type="password" value={permPassword} onChange={(e) => setPermPassword(e.target.value)} className={styles.guestInput} required />
              
              <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Confirmar Contraseña:</label>
              <input type="password" value={permConfirmPassword} onChange={(e) => setPermConfirmPassword(e.target.value)} className={styles.guestInput} required />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <h3 style={{ margin: "0 0 10px 0", color: "#1C352D", fontSize: "1.1rem" }}>Nuevo trabajador temporal</h3>
              
              <input type="text" placeholder="Nombre completo *" value={tempFullName} onChange={(e) => setTempFullName(e.target.value)} className={styles.guestInput} required />
              <input type="email" placeholder="Correo electrónico *" value={tempEmail} onChange={(e) => setTempEmail(e.target.value)} className={styles.guestInput} required />
              <input type="text" placeholder="Teléfono" value={tempPhone} onChange={(e) => setTempPhone(e.target.value)} className={styles.guestInput} />
              <input type="password" placeholder="Contraseña temporal (opcional)" value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} className={styles.guestInput} />
              
              <label style={{ fontSize: "0.8rem", color: "#666", marginBottom: "-6px" }}>Duración en días *</label>
              <input type="number" min="1" value={tempDurationDays} onChange={(e) => setTempDurationDays(e.target.value)} className={styles.guestInput} required />
              
              <label style={{ fontSize: "0.8rem", color: "#666", marginBottom: "-6px" }}>Role ID opcional</label>
              <input type="number" value={tempRoleId} onChange={(e) => setTempRoleId(e.target.value)} className={styles.guestInput} />
            </div>
          )}

          <div style={{ marginTop: "20px" }}>
            <Button
              size="regular"
              action="primary"
              type="submit"
              style={{ width: "100%" }}
            >
              {loading ? "Procesando..." : userType === "permanente" ? "Crear usuario" : "Crear trabajador temporal"}
            </Button>
          </div>
        </form>

        <div style={{ marginTop: "35px" }}>
          <h2 style={{ fontSize: "1.2rem", color: "#1C352D", fontWeight: "bold", marginBottom: "15px" }}>
            Personal Registrado
          </h2>
          
          {usersList && usersList.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {usersList.map((user) => {
                if (!user) return null;
                const esEmpleado = user.role !== "temporal";
                const estaActivo = user.isActive !== false;

                return (
                  <div
                    key={user.id || Math.random()}
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderLeft: esEmpleado ? "6px solid #1C352D" : "6px solid #d97706",
                      borderRadius: "12px",
                      padding: "16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      opacity: estaActivo ? 1 : 0.4,
                      transition: "opacity 0.2s ease"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ 
                          fontWeight: "bold", 
                          color: "#1C352D", 
                          fontSize: "0.95rem", 
                          textDecoration: estaActivo ? "none" : "line-through" 
                        }}>
                          {user.displayName}
                        </span>
                        <span style={{
                          fontSize: "10px",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontWeight: "bold",
                          backgroundColor: esEmpleado ? "#e6f4ea" : "#fef3c7",
                          color: esEmpleado ? "#1C352D" : "#b45309"
                        }}>
                          {esEmpleado ? "Permanente" : "Temporal"}
                        </span>
                        {!estaActivo && (
                          <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold", backgroundColor: "#fee2e2", color: "#991b1b" }}>
                            Inactivo
                          </span>
                        )}
                      </div>
                      {user.contactInfo && (
                        <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "4px" }}>
                          {user.contactInfo}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleUserStatus(user.id)}
                      disabled={!estaActivo}
                      style={{
                        backgroundColor: estaActivo ? "#fee2e2" : "#cbd5e1",
                        color: estaActivo ? "#991b1b" : "#64748b",
                        border: "none",
                        borderRadius: "8px",
                        padding: "6px 12px",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        cursor: estaActivo ? "pointer" : "not-allowed"
                      }}
                    >
                      {estaActivo ? "Desactivar" : "Desactivado"}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ fontSize: "0.9rem", color: "#64748b", textAlign: "center" }}>No hay usuarios registrados</p>
          )}
        </div>

      </div>

      <Modal
        open={notificationModal.open}
        title={notificationModal.title}
        message={notificationModal.message}
        confirmText="Aceptar"
        onlyConfirm
        onConfirm={() => setNotificationModal((prev) => ({ ...prev, open: false }))}
        danger={notificationModal.error}
      />
    </div>
  );
};

export default CreateUserPage;