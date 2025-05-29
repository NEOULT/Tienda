import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiWrapperService } from '../core/api-wrapper.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
})
export class AuthComponent implements OnInit {
  isLoginMode: boolean = true;
  username: string = '';
  password: string = '';
  errorMessage: string = '';

  // Expresiones regulares
  private usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  private passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  constructor(
    private router: Router,
    private api: ApiWrapperService
  ) {}

  ngOnInit(): void {
    this.checkIfUserIsLoggedIn();
  }

  async checkIfUserIsLoggedIn(): Promise<void> {
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const user = JSON.parse(currentUser);
        const existingUser = await this.api.get<any>(`users/${user.id}`).toPromise();
        if (existingUser) {
          this.router.navigate(['/landingpage']);
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  }

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = '';
  }

  onSubmit(): void {
    if (!this.validateUsername() || !this.validatePassword()) return;

    if (this.isLoginMode) {
      this.login();
    } else {
      this.register();
    }
  }

  validateUsername(): boolean {
    if (!this.usernameRegex.test(this.username)) {
      this.errorMessage = 'El nombre de usuario debe tener entre 3 y 20 caracteres y solo puede contener letras, números y guiones bajos (_).';
      return false;
    }
    return true;
  }

  validatePassword(): boolean {
    if (!this.passwordRegex.test(this.password)) {
      this.errorMessage = 'La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula, un número y un carácter especial.';
      return false;
    }
    return true;
  }

  async register(): Promise<void> {
    try {
      // Verificar si el usuario ya existe
      const users = await this.api.get<any[]>(`users?username=${this.username}`).toPromise();

      if (users && users.length > 0) {
        this.errorMessage = 'El nombre de usuario ya está en uso.';
        return;
      }

      // Crear nuevo usuario
      const newUser = {
        username: this.username,
        password: this.password,
        role: 'user'
      };

      await this.api.post<any>('users', newUser).toPromise();

      this.errorMessage = 'Registro exitoso. Ahora puedes iniciar sesión.';
      this.isLoginMode = true;
    } catch (error) {
      console.error('Registration error:', error);
      this.errorMessage = 'Error en el registro. Por favor intenta nuevamente.';
    }
  }

  async login(): Promise<void> {
    try {
      // Buscar usuario por username
      const users = await this.api.get<any[]>(`users?username=${this.username}`).toPromise();

      if (!users || users.length === 0) {
        this.errorMessage = 'Nombre de usuario o contraseña incorrectos.';
        return;
      }

      const user = users[0];

      if (user.password !== this.password) {
        this.errorMessage = 'Nombre de usuario o contraseña incorrectos.';
        return;
      }

      // Guardar usuario en localStorage (sin la contraseña)
      const { password, ...userWithoutPassword } = user;
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));

      this.router.navigate(['/landing']);
    } catch (error) {
      console.error('Login error:', error);
      this.errorMessage = 'Error al iniciar sesión. Por favor intenta nuevamente.';
    }
  }
}
