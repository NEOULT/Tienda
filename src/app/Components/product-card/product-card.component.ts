import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import { CartService } from 'src/app/Services/cart-service.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule, TruncatePipe],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.css']
})
export class ProductCardComponent {
  @Input() product: any; // Recibe los datos del producto
  @Input() showActions: boolean = true; // Controla si muestra botones

  constructor(private cartService: CartService) {}

  // Función para manejar agregar al carrito
  addToCart() {
    this.cartService.addToCart(this.product);
  }
}
