import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root' // Singleton global
})
export class ApiWrapperService {
  private baseUrl = 'http://localhost:3000'; // Cambia esto a la URL de tu API
  private cloudinaryUrl = 'https://api.cloudinary.com/v1_1/dwsenpnue/image/upload'; // URL de la API de imágenes
  private uploadPreset = 'api_tienda'; // Nombre del preset de subida

  constructor(private http: HttpClient) { }

  // Métodos genéricos para cualquier endpoint
  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${endpoint}`);
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/${endpoint}`, body);
  }

  put<T>(endpoint: string, id: number, body: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}/${endpoint}/${id}`, body);
  }

  delete<T>(endpoint: string, id: number): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}/${endpoint}/${id}`);
  }

  // --- Métodos específicos para Fake Store API (opcionales) ---
  getProducts() {
    return this.get<any[]>('products');
  }

  getProductsPagination(page: number, limit: number) {
    return this.get<any[]>(`products?_start=${page}&_limit=${limit}`);
  }

  getDestacateProducts() {
    return this.get<any[]>('products?_limit=3');
  }

  getProduct(id: string) {
    return this.get<any>(`products/${id}`);
  }

  getProductsByCategory(categoryId: number | string): Observable<any> {
    // _like hace match parcial (útil si categoryId puede ser string o number)
    return this.get<any>(`products?categoryId=${categoryId}`);
  }

   // Nuevos métodos para el carrito
   getUserCart(userId: string): Observable<any> {
    return this.get(`cart?userId=${userId}`);
  }

  createCart(cartData: any): Observable<any> {
    return this.post(`cart`, cartData);
  }

  updateCart(cartData: any): Observable<any> {
    return this.put(`cart`,cartData.id, cartData);
  }

   // Método integrado para crear producto con imagen
   addProductWithImage(product: any, imageFile: File): Observable<any> {
    return this.uploadImageToCloudinary(imageFile).pipe(
      switchMap((cloudinaryResponse: any) => {
        const productWithImage = {
          ...product,
          image: cloudinaryResponse.secure_url, // URL de Cloudinary
          quantity: product.quantity || 0, // Valores por defecto
          supplierId: product.supplierId || 1,
          createdAt: new Date().toISOString() // Fecha actual
        };
        return this.http.post(`${this.baseUrl}/products`, productWithImage);
      })
    );
  }

  updateProduct(product: any) {
    return this.put<any>(`products`, product.id, product);
  }

  deleteProduct(id: number) {
    return this.delete<any>(`products/${id}`, id);
  }

  private uploadImageToCloudinary(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);

    return this.http.post(this.cloudinaryUrl, formData);
  }

  getCategories() {
    return this.get<any[]>('categories');
  }

}
