import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

// Cette fonction prend un buffer (le fichier image) et l'upload sur Cloudinary
export const uploadStream = (buffer: Buffer): Promise<any> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "products", // Organise les uploads dans un dossier "products" sur Cloudinary
        // f_auto et q_auto demandent à Cloudinary de choisir le meilleur format (ex: webp) et la meilleure qualité automatiquement
        transformation: [{ fetch_format: "auto", quality: "auto" }],
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    // On transforme le buffer en un stream lisible que Cloudinary peut consommer
    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);
    readableStream.pipe(stream);
  });
};
