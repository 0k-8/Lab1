/**
 * Типізація відповідей публічного API dummyjson.com.
 * Описані лише ті поля, які реально використовуються у роботі.
 */

export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  stock: number;
  brand?: string;
  thumbnail?: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

/** Тіло запиту на створення товару (POST /products/add). */
export interface NewProduct {
  title: string;
  price: number;
}

/** Відповідь сервера на створення товару. */
export interface CreatedProduct extends NewProduct {
  id: number;
}

/** Відповідь сервера на видалення товару (DELETE /products/:id). */
export interface DeletedProduct {
  id: number;
  title: string;
  isDeleted: boolean;
  deletedOn: string;
}
