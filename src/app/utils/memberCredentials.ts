// Generar username automático desde el nombre
export function generateUsername(name: string): string {
  const parts = name.toLowerCase().split(' ');
  if (parts.length >= 2) {
    return parts[0][0] + parts[parts.length - 1]; // Primera letra del nombre + apellido
  }
  return name.toLowerCase().replace(/\s+/g, '');
}

// Generar password por defecto
export function generateDefaultPassword(): string {
  return 'member123';
}
