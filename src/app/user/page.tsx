"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import HeaderXuchil from "@/components/HeaderXuchil";
import Modal from "@/components/Modal";
import styles from "./User.module.css";

interface UserData {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  position: string;
  expiresAt: string | null;
  hours: string;
}

const UserProfile = () => {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [role, setRole] = useState<"user" | "admin" | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showTemporaryForm, setShowTemporaryForm] = useState(false);
  const [tempFullName, setTempFullName] = useState("");
  const [tempEmail, setTempEmail] = useState("");
  const [tempPhone, setTempPhone] = useState("");
  const [tempRoleId, setTempRoleId] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [tempDurationDays, setTempDurationDays] = useState("7");
  const [tempLoading, setTempLoading] = useState(false);
  const [creationModal, setCreationModal] = useState({
    open: false,
    title: "",
    message: "",
    error: false,
  });

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const response = await fetch("/api/users/me", { credentials: "include" });
        if (!response.ok) {
          router.push("/login");
          return;
        }

        const authUser = await response.json();
        if (!mounted) return;

        setRole(authUser.isAdmin ? "admin" : "user");
        setUserData({
          name: authUser.worker?.fullName ?? "",
          email: authUser.email,
          phone: authUser.worker?.phone ?? "No especificado",
          avatar: authUser.worker?.profilePhotoUrl ?? "",
          position: authUser.worker?.role?.name ?? "Operador",
          expiresAt: authUser.worker?.expiresAt ?? null,
          hours: "",
        });
      } catch {
        router.push("/login");
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [router]);

  const handleCreateTemporaryWorker = async () => {
    if (!tempFullName.trim() || !tempEmail.trim() || !tempDurationDays.trim()) {
      setCreationModal({
        open: true,
        title: "Campos incompletos",
        message: "Completa nombre, correo y duración en días.",
        error: true,
      });
      return;
    }

    const parsedDuration = Number.parseInt(tempDurationDays, 10);
    if (!Number.isInteger(parsedDuration) || parsedDuration <= 0) {
      setCreationModal({
        open: true,
        title: "Duración inválida",
        message: "La duración debe ser un número mayor que cero.",
        error: true,
      });
      return;
    }

    setTempLoading(true);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
            fullName: tempFullName.trim(),
            phone: tempPhone.trim() || null,
            email: tempEmail.trim(),
            profilePhotoUrl: null,
            roleId: tempRoleId.trim() ? Number.parseInt(tempRoleId, 10) : null,
            temporaryDurationDays: parsedDuration,
            password: tempPassword || undefined,
          }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setCreationModal({
          open: true,
          title: "Error al crear usuario temporal",
          message: payload?.error || "No se pudo registrar el usuario temporal.",
          error: true,
        });
        return;
      }

      const expiresAt = payload?.expiresAt
        ? new Date(payload.expiresAt)
        : new Date(Date.now() + parsedDuration * 24 * 60 * 60 * 1000);
      const formattedExpiresAt = Number.isNaN(expiresAt.getTime())
        ? `${parsedDuration} días`
        : expiresAt.toLocaleDateString("es-MX");

      setCreationModal({
        open: true,
        title: "Usuario temporal creado",
        message: `El usuario fue registrado correctamente.\n\nContraseña temporal: ${payload?.temporaryPassword ?? "No disponible"}\nVence: ${formattedExpiresAt}`,
        error: false,
      });

      setTempFullName("");
      setTempEmail("");
      setTempPhone("");
      setTempRoleId("");
      setTempDurationDays("7");
      setShowTemporaryForm(false);
    } catch {
      setCreationModal({
        open: true,
        title: "Error al crear usuario temporal",
        message: "Ocurrió un problema de red al registrar el usuario.",
        error: true,
      });
    } finally {
      setTempLoading(false);
    }
  };

  const confirmLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.push("/login");
  };

  const closeCreationModal = () => {
    setCreationModal((current) => ({ ...current, open: false }));
  };

  if (!role || !userData) return null;

  return (
    <div className={`page ${styles.pageWrapper}`}>
      <HeaderXuchil />

      <div className={styles.actionButtonRight}>
        <Button
          size="small"
          action="secondary"
          onClick={() => router.push("/edit_user")}
        >
          Editar
        </Button>
      </div>

      <div className={styles.headerContainer}>
        <h1>Perfil de usuario</h1>
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.profileCard}>
          <img
            className={styles.avatar}
            src={userData.avatar || "/globe.svg"}
            alt="Avatar del usuario"
          />

          <h2 className={styles.profileName}>{userData.name}</h2>
          <p className={styles.profilePosition}>{userData.position}</p>
          {userData.expiresAt && (
            <p className={styles.profileHours}>
              Vigencia: {new Date(userData.expiresAt).toLocaleDateString("es-MX")}
            </p>
          )}
          <p className={styles.profileHours}>{userData.hours}</p>

          <div className={styles.infoGroup}>
            <p className={styles.infoLabel}>Correo electrónico:</p>
            <p className={styles.infoValue}>{userData.email}</p>

            <p className={styles.infoLabel}>Teléfono:</p>
            <p className={styles.infoValue}>{userData.phone}</p>
          </div>
        </div>

        {role === "admin" && (
          <div className={styles.guestSection}>
            <button
              className={styles.guestToggle}
              onClick={() => router.push("/create_user")}
            >
              <span>Crear usuario permanente</span>
              <span>↗</span>
            </button>
            <Button
              className={styles.guestToggle}
              size="small"
              action="primary"
              onClick={() => setShowTemporaryForm((current) => !current)}
              style={{ width: "100%", marginTop: "8px" }}
            >
              {showTemporaryForm ? "Ocultar alta temporal" : "Crear temporal"}
            </Button>
          </div>
        )}

        {role === "admin" && showTemporaryForm && (
          <div className={styles.guestSection} style={{ maxWidth: 420 }}>
            <div className={styles.guestContent}>
              <h3 className={styles.guestFormTitle} style={{ fontSize: "1rem" }}>
                Nuevo trabajador temporal
              </h3>

              <input
                type="text"
                placeholder="Nombre completo *"
                value={tempFullName}
                onChange={(e) => setTempFullName(e.target.value)}
                className={styles.guestInput}
              />
              <input
                type="email"
                placeholder="Correo electrónico *"
                value={tempEmail}
                onChange={(e) => setTempEmail(e.target.value)}
                className={styles.guestInput}
              />
              <input
                type="text"
                placeholder="Teléfono"
                value={tempPhone}
                onChange={(e) => setTempPhone(e.target.value)}
                className={styles.guestInput}
              />
              <input
                type="password"
                placeholder="Contraseña temporal (opcional)"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                className={styles.guestInput}
              />
              <input
                type="number"
                min="1"
                step="1"
                placeholder="Duración en días *"
                value={tempDurationDays}
                onChange={(e) => setTempDurationDays(e.target.value)}
                className={styles.guestInput}
              />
              <input
                type="number"
                placeholder="Role ID opcional"
                value={tempRoleId}
                onChange={(e) => setTempRoleId(e.target.value)}
                className={styles.guestInput}
              />

              <Button
                size="small"
                action="primary"
                onClick={handleCreateTemporaryWorker}
                style={{ width: "100%" }}
              >
                {tempLoading ? "Creando..." : "Crear trabajador temporal"}
              </Button>
            </div>
          </div>
        )}

        <div className={styles.logoutWrapper}>
          <Button
            size="regular"
            action="negative"
            onClick={() => setShowLogoutModal(true)}
          >
            Cerrar sesión
          </Button>
        </div>
      </div>

      <Modal
        open={showLogoutModal}
        title="¿Cerrar sesión?"
        message="Esto cerrará tu sesión actual. ¿Deseas continuar?"
        confirmText="Cerrar sesión"
        cancelText="Cancelar"
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        danger
      />

      <Modal
        open={creationModal.open}
        title={creationModal.title}
        message={creationModal.message}
        confirmText="Aceptar"
        onlyConfirm
        onConfirm={closeCreationModal}
        danger={creationModal.error}
      />
    </div>
  );
};

export default UserProfile;