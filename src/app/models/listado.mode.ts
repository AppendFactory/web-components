export interface Proveedor {
  id: number;
  title: string;
  content: string;
  link: string;
  direct_contact: string;
  thumbnail: string | null;
  prv_image: string | null;
  gallery: string[];
  type: 'Normal' | 'Destacado';
  category: string | null;
  tags: string[];
  description_short: string;
  description_full: string;
  lat: string | null;
  lng: string | null;
  address: string;
  time_open: string;
  time_close: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  store: string;
  social: { id: string; url: string }[];
    notas: {
    texto: string;
    imagenes: string[];
  }[];
   horarios: {
    [dia: string]: {
      desde: string;
      hasta: string;
    };
  };
}
