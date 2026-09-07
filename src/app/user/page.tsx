"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pencil, ChevronRight } from "lucide-react";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import styles from "./User.module.css";

const UserProfile = () => {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [role, setRole] = useState<"user" | "admin" | null>(null);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem("role") as "user" | "admin" | null;
    const storedUserData = localStorage.getItem("userData");

    if (!storedRole || !storedUserData) {
      router.push("/login");
    } else {
      setRole(storedRole);
      setUserData(JSON.parse(storedUserData));
    }
  }, []);

  const confirmLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("role");
    localStorage.removeItem("userData");
    router.push("/login");
  };

  if (!role || !userData) return null;

  const iniciales = (userData.name || userData.email || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p: string) => p.charAt(0).toUpperCase())
    .join("");

  return (
    <div className={styles.wrapper}>
      <header className={styles.head}>
        <h1 className={styles.title}>Perfil de usuario</h1>

        <div className={styles.editBtn}>
          <Button
            size="small"
            action="outline"
            onClick={() => router.push("/edit_user")}
          >
            <Pencil size={15} />
            Editar
          </Button>
        </div>
      </header>

      <section className={styles.card}>
        <div className={styles.identity}>
          {userData.avatar ? (
            <img
              className={styles.avatar}
              src={userData.avatar}
              alt={`Foto de ${userData.name}`}
            />
          ) : (
            <span className={styles.avatarFallback} aria-hidden="true">
              {iniciales}
            </span>
          )}

          <div className={styles.identityText}>
            <h2 className={styles.name}>{userData.name}</h2>
            {!!userData.position && (
              <p className={styles.position}>{userData.position}</p>
            )}
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.infoRow}>
          <p className={styles.infoLabel}>Correo electrónico</p>
          <p className={styles.infoValue}>{userData.email}</p>
        </div>

        <div className={styles.infoRow}>
          <p className={styles.infoLabel}>Teléfono</p>
          {userData.phone ? (
            <p className={styles.infoValue}>{userData.phone}</p>
          ) : (
            <button
              type="button"
              className={styles.infoAdd}
              onClick={() => router.push("/edit_user")}
            >
              Agregar
            </button>
          )}
        </div>
      </section>

      {role === "admin" && (
        <button
          type="button"
          className={styles.menuRow}
          onClick={() => router.push("/create_user")}
        >
          <span className={styles.menuText}>Gestión de usuarios</span>
          <ChevronRight size={18} className={styles.menuChevron} />
        </button>
      )}

      <button
        type="button"
        className={styles.logout}
        onClick={() => setShowLogoutModal(true)}
      >
        Cerrar sesión
      </button>

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
    </div>
  );
};

export default UserProfile;
