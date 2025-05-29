import { Component, NgModule, OnInit } from '@angular/core';
import { ApiWrapperService } from '../../core/api-wrapper.service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { CartService } from 'src/app/Services/cart-service.service';
import { Input } from '@angular/core';
import { ProductCardComponent } from 'src/app/Components/product-card/product-card.component';
import { response } from 'express';

@Component({
  selector: 'app-product-catalog',
  templateUrl: './product-catalog.component.html',
  styleUrls: ['./product-catalog.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ProductCardComponent
  ]
})
export class ProductCatalogComponent implements OnInit {
  private _allProducts: any[] = [];       // Almacenamiento interno
  filteredProducts: any[] = [];           // Productos filtrados
  displayedProducts: any[] = [];          // Productos mostrados (paginados)
  categories: any[] = [];
  loading = true;

  // Paginación
  currentPage = 1;
  itemsPerPage = 6;
  totalItems = 0;
  totalPages = 1;
  @Input() product: any; // Recibe los datos del producto

  filterForm: FormGroup;

  constructor(
    private apiService: ApiWrapperService,
    private fb: FormBuilder,
    private cartService: CartService
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      category: [''],
      minPrice: [''],
      maxPrice: [''],
      startDate: [''],
      endDate: ['']
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.setupFilterListeners();
  }

  // Función para manejar agregar al carrito
  addToCart() {
    this.cartService.addToCart(this.product);
  }

  loadData(): void {
    this.loading = true;
    this.apiService.getProducts().subscribe({
      next: (products) => {
        this._allProducts = products;
        this.applyFilters();
        this.loading = false;
        this.product = products
      },
      error: (err) => {
        console.error('Error loading products', err);
        this.loading = false;
      }
    });

    this.apiService.getCategories().subscribe(categories => {
      this.categories = categories;
    });
  }

  setupFilterListeners(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.applyFilters();
      });
  }

  applyFilters(): void {
    // 1. Aplicar filtros
    this.filteredProducts = this._allProducts.filter(product => this.passesFilters(product));

    // 2. Actualizar paginación
    this.updatePagination();
  }

  private passesFilters(product: any): boolean {
    const filters = this.filterForm.value;

    if (filters.search && !product.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.category && product.categoryId != filters.category) {
      return false;
    }
    if (filters.minPrice && product.price < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice && product.price > filters.maxPrice) {
      return false;
    }
    if (filters.startDate && new Date(product.createdAt) < new Date(filters.startDate)) {
      return false;
    }
    if (filters.endDate && new Date(product.createdAt) > new Date(filters.endDate)) {
      return false;
    }
    return true;
  }

  updatePagination(): void {
    this.totalItems = this.filteredProducts.length;
    this.totalPages = Math.max(1, Math.ceil(this.totalItems / this.itemsPerPage));

    // Ajustar página actual si es necesario
    this.currentPage = Math.min(this.currentPage, this.totalPages);

    // Paginar los resultados
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.displayedProducts = this.filteredProducts.slice(startIndex, startIndex + this.itemsPerPage);
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.currentPage = 1;
    this.applyFilters();
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : 'Sin categoría';
  }

  // Navegación de paginación
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  getPageNumbers(): number[] {
    const visiblePages = 5;
    let start = Math.max(1, this.currentPage - Math.floor(visiblePages / 2));
    let end = Math.min(this.totalPages, start + visiblePages - 1);

    // Ajustar si estamos cerca del inicio
    if (end - start + 1 < visiblePages) {
      start = Math.max(1, end - visiblePages + 1);
    }

    return Array.from({length: end - start + 1}, (_, i) => start + i);
  }
}
