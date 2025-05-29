import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthComponent } from './auth/auth.component';
import { loginGuard } from './auth/loginGuard.component';
import { LandingpageComponent } from './Views/landingpage/landingpage.component';
import { authGuard } from './auth/authGuard.component';
import { ProductCatalogComponent } from './Views/product-catalog/product-catalog.component';
import { CartComponent } from './Components/cart-component/cart-component.component';

const routes: Routes = [

  { path: 'auth', component: AuthComponent, canActivate: [loginGuard]},
  { path: 'landing', component: LandingpageComponent, canActivate: [authGuard] },
  { path: 'products', component: ProductCatalogComponent, canActivate: [authGuard] },
  { path: 'cart', component: CartComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/landing', pathMatch: 'full' },
  { path: '**', redirectTo: '/landing' }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
