"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import styles from "./EditUser.module.css";

const EditProfile = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userData, setUserData] = useState<any>(null);
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentUsername, setCurrentUsername] = useState("");

  useEffect(() => {
    const storedUserData = localStorage.getItem("userData");
    const username = localStorage.getItem("currentUser");

    if (storedUserData && username) {
      const parsedData = JSON.parse(storedUserData);
      setUserData(parsedData);
      setCurrentUsername(username);

      const nameParts = parsedData.name.split(" ");
      setName(nameParts[0] || "");
      setLastName(nameParts.slice(1).join(" ") || "");

      setEmail(parsedData.email || "");
      setPhone(parsedData.phone || "");
      setAvatarPreview(parsedData.avatar || "");
    } else {
      router.push("/login");
    }
  }, []);

  const handleImageUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match('image.*')) {
        alert('Por favor selecciona una imagen (JPEG, PNG, etc.)');
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen es demasiado grande (máximo 2MB)');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarPreview(result);
        setAvatar(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const username = localStorage.getItem("currentUser");
    if (!username) {
      router.push("/login");
      return;
    }

    const updatedUserData = {
      ...userData,
      name: `${name} ${lastName}`.trim(),
      email,
      phone,
      avatar: avatar || avatarPreview,
    };

    localStorage.setItem("userData", JSON.stringify(updatedUserData));

    localStorage.setItem(`userProfile_${username}`, JSON.stringify({
      name: `${name} ${lastName}`.trim(),
      email,
      phone,
      avatar: avatar || avatarPreview,
      position: userData.position,
      hours: userData.hours
    }));

    setShowSuccessModal(true);
  };

  const handleConfirm = () => {
    setShowSuccessModal(false);
    router.push("/user");
  };

  const iniciales = `${name} ${lastName}`
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("") || "?";

  return (
    <div className={styles.wrapper}>
      <header className={styles.head}>
        <button
          type="button"
          className={styles.back}
          onClick={() => router.push("/user")}
          aria-label="Volver al perfil"
        >
          <ArrowLeft size={20} />
        </button>

        <h1 className={styles.title}>Editar perfil</h1>
      </header>

      <section className={styles.card}>
        <div className={styles.identity}>
          {avatarPreview ? (
            <img
              className={styles.avatar}
              src={avatarPreview}
              alt="Foto de perfil"
            />
          ) : (
            <span className={styles.avatarFallback} aria-hidden="true">
              {iniciales}
            </span>
          )}

          <div className={styles.identityText}>
            <p className={styles.identityName}>
              {`${name} ${lastName}`.trim() || "Sin nombre"}
            </p>

            <input
              type="file"
              id="avatar-upload"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageChange}
              className={styles.hidden}
            />

            <div className={styles.photoBtn}>
              <Button
                size="small"
                action="outline"
                onClick={handleImageUploadClick}
              >
                Cambiar foto
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="nombre">
            Nombre
          </label>
          <input
            id="nombre"
            type="text"
            className={styles.input}
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="apellido">
            Apellido
          </label>
          <input
            id="apellido"
            type="text"
            className={styles.input}
            placeholder="Apellido"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="correo">
            Correo electrónico
          </label>
          <input
            id="correo"
            type="email"
            className={styles.input}
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="telefono">
            Teléfono
          </label>
          <input
            id="telefono"
            type="tel"
            inputMode="tel"
            className={styles.input}
            placeholder="+52 951 000 00 00"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      </section>

      <div className={styles.actions}>
        <Button size="regular" action="outline" onClick={() => router.push("/user")}>
          Cancelar
        </Button>
        <Button size="regular" action="primary" onClick={handleSave}>
          Guardar
        </Button>
      </div>

      <Modal
        open={showSuccessModal}
        title="¡Cambios guardados!"
        message="Tu perfil ha sido actualizado exitosamente."
        confirmText="Aceptar"
        onlyConfirm
        onConfirm={handleConfirm}
      />
    </div>
  );
};

export default EditProfile;
