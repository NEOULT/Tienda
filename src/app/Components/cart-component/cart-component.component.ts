import { Component, OnInit } from '@angular/core';
import { CartService } from '../../Services/cart-service.service';
import { ApiWrapperService } from '../../core/api-wrapper.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart-component.component.html',
  styleUrls: ['./cart-component.component.css']
})
export class CartComponent implements OnInit {
  cartItems: any[] = [];
  totalPrice: number = 0;
  loading = true;
  showModal = false

  constructor(
    private cartService: CartService,
    private apiWrapper: ApiWrapperService
  ) {}

  ngOnInit(): void {
    this.loadCart();
  }

  async loadCart() {
    this.loading = true;
    try {
      const cartProducts = this.cartService.cartItems.getValue();

      // Obtener detalles completos de los productos
      const itemsWithDetails = await Promise.all(
        cartProducts.map(async (item: any) => {
          const product = await this.apiWrapper.getProduct(item.productId).toPromise();
          return {
            ...item,
            product: product,
            subtotal: product.price * item.quantity
          };
        })
      );

      this.cartItems = itemsWithDetails;
      this.totalPrice = itemsWithDetails.reduce((sum, item) => sum + item.subtotal, 0);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      this.loading = false;
    }
  }

  async updateQuantity(productId: string, quantity: number) {
  const item = this.cartItems.find((item) => item.product.id === productId);

  if (!item) return;

  // Verifica que la cantidad no exceda el stock disponible
  if (quantity > item.product.quantity) {
    alert(`No puedes añadir más de ${item.product.quantity} unidades de este producto.`);
    return;
  }

  if (quantity < 1) {
    await this.removeItem(productId);
    return;
  }

  await this.cartService.updateQuantity(productId, quantity);
  this.loadCart();
}
  async removeItem(productId: string) {
    await this.cartService.removeFromCart(productId);
    this.loadCart();
  }

  async clearCart() {
    await this.cartService.clearCart();
    this.loadCart();
  }

  // Método para mostrar el modal
 async showThankYouModal() {
    this.showModal = true;
    try {
      // Actualizar el stock de los productos comprados
      for (const item of this.cartItems) {
        const updatedProduct = {
          ...item.product,
          quantity: item.product.quantity - item.quantity // Reducir el stock
        };
        console.log('Producto actualizado:', updatedProduct);


        // Actualizar el producto en el servidor
        await this.apiWrapper.updateProduct(updatedProduct).toPromise();
      }

      // Vaciar el carrito después de la compra
      await this.cartService.clearCart();
      this.loadCart(); // Recargar el carrito para reflejar los cambios
    } catch (error) {
      console.error('Error al procesar la compra:', error);
    }
  }

  closeModal() {
    this.showModal = false;
  }
}
