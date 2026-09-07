"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import styles from "./CreateUser.module.css";

const CreateUser = () => {
  const router = useRouter();

  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [secondLastName, setSecondLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [modal, setModal] = useState({
    open: false,
    title: "",
    message: "",
    error: false,
  });

  const dummyUsers = [
    {
      name: "Antonio",
      lastName: "López",
      phone: "+52 9511234567",
      email: "antonio@xuchil.com",
      username: "antonio123",
    },
    {
      name: "Administrador",
      lastName: "Xuchil",
      phone: "+52 9519998877",
      email: "admin@xuchilnatural.com",
      username: "admin123",
    },
  ];

  const isPasswordValid = (pwd: string) =>
    /[a-z]/.test(pwd) &&
    /[A-Z]/.test(pwd) &&
    /\d/.test(pwd) &&
    pwd.length >= 8;

  const isEmailValid = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isPhoneValid = (phone: string) =>
    phone.replace(/\D/g, "").length >= 10;

  const handleCreateUser = () => {
    if (
      !name ||
      !lastName ||
      !secondLastName ||
      !phone ||
      !email ||
      !username ||
      !password ||
      !confirmPassword
    ) {
      return setModal({
        open: true,
        title: "Campos incompletos",
        message: "Por favor completa todos los campos.",
        error: true,
      });
    }

    if (!isPhoneValid(phone)) {
      return setModal({
        open: true,
        title: "Teléfono inválido",
        message: "El número debe tener al menos 10 dígitos.",
        error: true,
      });
    }

    if (!isEmailValid(email)) {
      return setModal({
        open: true,
        title: "Correo inválido",
        message: "Ingresa un correo electrónico válido.",
        error: true,
      });
    }

    if (password !== confirmPassword) {
      return setModal({
        open: true,
        title: "Contraseñas no coinciden",
        message: "La contraseña y su confirmación deben ser iguales.",
        error: true,
      });
    }

    if (!isPasswordValid(password)) {
      return setModal({
        open: true,
        title: "Contraseña inválida",
        message: "Debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.",
        error: true,
      });
    }

    const duplicate = dummyUsers.find(
      (user) =>
        user.name === name ||
        user.lastName === lastName ||
        user.phone === phone ||
        user.email === email ||
        user.username === username
    );

    if (duplicate) {
      return setModal({
        open: true,
        title: "Usuario duplicado",
        message:
          "Ya existe un usuario con alguno de los siguientes datos: nombre, apellido, teléfono, correo o usuario.",
        error: true,
      });
    }

    setModal({
      open: true,
      title: "Usuario creado ✅",
      message: "El nuevo usuario ha sido registrado exitosamente.",
      error: false,
    });
  };

  const handleModalClose = () => {
    setModal({ ...modal, open: false });
    if (!modal.error) router.push("/user");
  };

  const datos = [
    { id: "nombre", label: "Nombre", type: "text", placeholder: "Nombre", value: name, set: setName },
    { id: "apellido-paterno", label: "Apellido paterno", type: "text", placeholder: "Apellido paterno", value: lastName, set: setLastName },
    { id: "apellido-materno", label: "Apellido materno", type: "text", placeholder: "Apellido materno", value: secondLastName, set: setSecondLastName },
    { id: "telefono", label: "Teléfono", type: "tel", placeholder: "+52 951 000 00 00", value: phone, set: setPhone },
    { id: "correo", label: "Correo electrónico", type: "email", placeholder: "correo@ejemplo.com", value: email, set: setEmail },
    { id: "usuario", label: "Usuario", type: "text", placeholder: "Nombre de usuario", value: username, set: setUsername },
  ];

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

        <h1 className={styles.title}>Crear usuario</h1>
      </header>

      <p className={styles.sectionLabel}>Datos del usuario</p>

      <section className={styles.card}>
        {datos.map((campo) => (
          <div className={styles.field} key={campo.id}>
            <label className={styles.label} htmlFor={campo.id}>
              {campo.label}
            </label>
            <input
              id={campo.id}
              type={campo.type}
              inputMode={campo.type === "tel" ? "tel" : undefined}
              className={styles.input}
              placeholder={campo.placeholder}
              value={campo.value}
              onChange={(e) => campo.set(e.target.value)}
            />
          </div>
        ))}
      </section>

      <p className={styles.sectionLabel}>Contraseña</p>

      <section className={styles.card}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">
            Contraseña
          </label>
          <div className={styles.passwordWrap}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className={styles.input}
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className={styles.reveal}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className={styles.hint}>
            Al menos 8 caracteres, una mayúscula, una minúscula y un número.
          </p>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="confirm-password">
            Confirmar contraseña
          </label>
          <div className={styles.passwordWrap}>
            <input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              className={styles.input}
              placeholder="Repite la contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              className={styles.reveal}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      </section>

      <div className={styles.actions}>
        <Button size="regular" action="outline" onClick={() => router.push("/user")}>
          Cancelar
        </Button>
        <Button size="regular" action="primary" onClick={handleCreateUser}>
          Crear usuario
        </Button>
      </div>

      <Modal
        open={modal.open}
        title={modal.title}
        message={modal.message}
        confirmText="Aceptar"
        onlyConfirm
        onConfirm={handleModalClose}
        danger={modal.error}
      />
    </div>
  );
};

export default CreateUser;
