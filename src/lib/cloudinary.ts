import config from "../config";

import{v2 as Cloudinary} from 'cloudinary'

Cloudinary.config({
  cloud_name: config.CLOUDINARY_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_AIP_SCERET
});

export const cloudinary = Cloudinary


