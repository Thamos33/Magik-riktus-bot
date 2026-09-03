import { v2 as cloudinary } from 'cloudinary';

// Vérification de la présence des variables d'environnement requises
const requiredEnvVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(
      `❌ Variable d’environnement manquante pour Cloudinary : ${envVar}`,
    );
  }
}

/**
 * Service de configuration centralisé Cloudinary v2
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;
