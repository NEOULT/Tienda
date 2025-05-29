import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiWrapperService } from '../core/api-wrapper.service';
import { HttpClient } from '@angular/common/http';

export interface CartProduct {
  productId: string;
  quantity: number;
  price: number; // Incluye el precio si es necesario para calcular el total
}

@Injectable({
  providedIn: 'root'
})

export class CartService {
  cartItems = new BehaviorSubject<any[]>([]);
  currentCartItems = this.cartItems.asObservable();
  currentUserId: string | null = null;

  constructor(private apiWrapper: ApiWrapperService, private http: HttpClient) {
    // Cargar usuario actual
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.currentUserId = user.id;

    // Cargar carrito desde el servidor
    //this.loadCartFromServer();
  }

  loadCartFromServer() {
    if (this.currentUserId) {
      this.apiWrapper.getUserCart(this.currentUserId).subscribe({
        next: (carts) => {
          const cart = carts[0]

          if (cart && Array.isArray(cart.products)) {
            // Si el carrito existe y tiene productos, actualiza el estado local
            this.cartItems.next(cart.products);
          } else {
            // Si el carrito no tiene productos o no existe, inicializa un carrito vacío
            console.warn('Carrito vacío o no encontrado. Inicializando un nuevo carrito.');
            this.initializeCart();
          }
        },
        error: (err) => {
          console.error('Error loading cart:', err);
          // Si ocurre un error al cargar el carrito, inicializa uno vacío
          this.initializeCart();
        }
      });
    }
  }

  private initializeCart() {
    if (this.currentUserId) {
      const newCart = {
        userId: this.currentUserId,
        products: [],
        totalPrice: 0
      };

      this.apiWrapper.createCart(newCart).subscribe({
        next: (response) => {
          console.log('New cart created:', response);
        },
        error: (err) => {
          console.error('Error creating cart:', err);
        }
      });
    }
  }

  async addToCart(product: any, quantity: number = 1): Promise<void> {
    if (!this.currentUserId) return;

    try {
      const currentCarts = await this.apiWrapper.getUserCart(this.currentUserId).toPromise();
      const currentCart = currentCarts[0]
      let updatedProducts: CartProduct[] = [];
      if (currentCart && currentCart.products) {
        updatedProducts = [...currentCart.products];
        const existingProductIndex = updatedProducts.findIndex(p => p.productId === product.id);

        if (existingProductIndex !== -1) {
          updatedProducts[existingProductIndex].quantity += quantity;
        } else {
          updatedProducts.push({ productId: product.id, quantity, price: product.price });
        }
      } else {
        updatedProducts.push({ productId: product.id, quantity, price: product.price });
      }

      const updatedCart = {
        ...currentCart,
        products: updatedProducts,
        totalPrice: this.calculateTotalPrice(updatedProducts)
      };

      await this.apiWrapper.updateCart(updatedCart).toPromise();
      this.cartItems.next(updatedProducts);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  }

  async removeFromCart(productId: string): Promise<void> {
    if (!this.currentUserId) return;

    try {
      const currentCarts = await this.apiWrapper.getUserCart(this.currentUserId).toPromise();
      const currentCart = currentCarts[0]
      if (currentCart && currentCart.products) {
        const updatedProducts = currentCart.products.filter((p: CartProduct) => p.productId !== productId);
        const updatedCart = {
          ...currentCart,
          products: updatedProducts,
          totalPrice: this.calculateTotalPrice(updatedProducts)
        };

        await this.apiWrapper.updateCart(updatedCart).toPromise();
        this.cartItems.next(updatedProducts);
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  }

  async updateQuantity(productId: string, quantity: number): Promise<void> {
    if (!this.currentUserId) return;

    try {
      const currentCarts = await this.apiWrapper.getUserCart(this.currentUserId).toPromise();
      const currentCart = currentCarts[0]
      console.log('Current Cart:', currentCart);

      if (currentCart && currentCart.products) {
        const updatedProducts = currentCart.products.map((p: CartProduct) => {
          if (p.productId === productId) {
            return { ...p, quantity };
          }
          return p;
        });

        const updatedCart = {
          ...currentCart,
          products: updatedProducts,
          totalPrice: this.calculateTotalPrice(updatedProducts)
        };

        await this.apiWrapper.updateCart(updatedCart).toPromise();
        this.cartItems.next(updatedProducts);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  }

  async clearCart(): Promise<void> {
    if (!this.currentUserId) return;

    try {
      const currentCarts = await this.apiWrapper.getUserCart(this.currentUserId).toPromise();
      const currentCart = currentCarts[0]
      if (currentCart) {
        const updatedCart = {
          ...currentCart,
          products: [],
          totalPrice: 0
        };

        await this.apiWrapper.updateCart(updatedCart).toPromise();
        this.cartItems.next([]);
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  }

  private calculateTotalPrice(products: CartProduct[]): number {
    return products.reduce((total, p: CartProduct) => {
      return total + (p.price * p.quantity);
    }, 0);
  }

  getTotalItems(): number {
    return this.cartItems.getValue().reduce((total, item) => total + item.quantity, 0);
  }
}
