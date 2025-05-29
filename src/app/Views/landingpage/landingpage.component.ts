import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiWrapperService } from '../../core/api-wrapper.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductCardComponent } from '../../Components/product-card/product-card.component';
import { OnInit } from '@angular/core';
import { CartService } from 'src/app/Services/cart-service.service';


@Component({
  selector: 'app-landingpage',
  templateUrl: './landingpage.component.html',
  styleUrls: ['./landingpage.component.css'],
  standalone: true,
  imports: [
    FormsModule, // Importa FormsModule para usar [(ngModel)]
    CommonModule, // Importa CommonModule para usar *ngIf, *ngFor, etc.
    ProductCardComponent, // Importa el componente de tarjeta de producto
]
})
export class LandingpageComponent implements OnInit {
  isAdmin: boolean = false;
  currentUser: any;
  image: File = new File([], ''); // Inicializa la variable image como un objeto File vacío
  products: any[] = []; // Inicializa la lista de productos
  categories: any[] = []; // Inicializa la lista de categorías
  cartItemCount: number = 0; // Inicializa el contador de artículos en el carrito

  constructor(
    private router: Router,
    private modalService: NgbModal, // Inyecta NgbModal
    private apiWrapper: ApiWrapperService, // Inyecta ApiWrapperService
    private cartService: CartService // Inyecta CartService
  )  {
    this.checkUserRole();
  }

  ngOnInit() {
    this.apiWrapper.getDestacateProducts().subscribe(
      (response) => {
        this.products = response; // Asigna la respuesta a la lista de productos
      },
      (error) => {
        console.error('Error al obtener productos:', error);
      }
    );
    this.loadCategories(); // Carga las categorías al iniciar
    this.loadProductsByCategory(4); // Carga los productos de la categoría 1 al iniciar

    this.cartService.currentCartItems.subscribe(items => {
      this.cartItemCount = items.reduce((total, item) => total + item.quantity, 0);
    });
    this.cartService.loadCartFromServer(); // Carga el carrito desde el servidor
  }

  navigateProducts() {
    this.router.navigate(['/products']);
  }

  navigateCart() {
    this.router.navigate(['/cart']);
  }

  checkUserRole() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.currentUser = user;
    this.isAdmin = user.role === 'admin';
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.router.navigate(['/auth']);
  }

  openProductModal(content: any) {
    this.modalService.open(content, { size: 'lg' }); // Abre modal grande
  }

  onSubmitProduct(form: any) {
    console.log('Formulario enviado:', form.value);
    console.log('Archivo de imagen:', this.image);

      this.apiWrapper.addProductWithImage(form.value, this.image).subscribe(
        (response) => {
          console.log('Producto creado:', response);
          form.reset(); // Reinicia el formulario
          this.modalService.dismissAll(); // Cierra el modal
        },
        (error) => {
          console.error('Error al crear producto:', error);
        }
      );
  }

  loadCategories() {
     this.apiWrapper.getCategories().subscribe(

      (response) => {
        this.categories = response; // Asigna la respuesta a la lista de categorías
        console.log('Categorías:', response);
      },
      (error) => {
        console.error('Error al obtener categorías:', error);
      }
    );
  }

  loadProductsByCategory(categoryId: number) {
    this.apiWrapper.getProductsByCategory(categoryId).subscribe(
      (response) => {
        //this.products = response; // Asigna la respuesta a la lista de productos
        console.log('Productos por categoría:', response);
      },
      (error) => {
        console.error('Error al obtener productos por categoría:', error);
      }
    );
  }

  onSelectedImage(event: any) {
    const file = event.target.files[0];

    if (file) {
     this.image = file; // Guarda el archivo de imagen
    } else {
      console.log('No se seleccionó ningún archivo.');
    }
  }
}
