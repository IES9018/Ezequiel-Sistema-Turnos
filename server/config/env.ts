export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "Falta JWT_SECRET en el entorno. Definilo en .env (arnés v3: prohibido hardcodear secrets).",
    );
  }
  return secret;
}
