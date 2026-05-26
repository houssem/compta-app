import { TestBed, ComponentFixture } from '@angular/core/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { of, throwError } from 'rxjs'
import { LoginComponent } from './login.component'
import { AuthService } from '../../core/auth/auth.service'

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>
  let component: LoginComponent
  let authServiceSpy: jasmine.SpyObj<AuthService>

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login'])
    await TestBed.configureTestingModule({
      imports: [LoginComponent, RouterTestingModule, TranslateModule.forRoot()],
      providers: [{ provide: AuthService, useValue: authServiceSpy }, TranslateService]
    }).compileComponents()
    fixture = TestBed.createComponent(LoginComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('onSubmit() calls authService.login with form values', () => {
    authServiceSpy.login.and.returnValue(of(void 0))
    component.email = 'admin@facturation.dev'
    component.password = 'password123'
    component.onSubmit()
    expect(authServiceSpy.login).toHaveBeenCalledWith('admin@facturation.dev', 'password123')
  })

  it('onSubmit() sets errorMessage on login failure', () => {
    authServiceSpy.login.and.returnValue(throwError(() => ({ error: { message: 'Email ou mot de passe incorrect' } })))
    component.email = 'bad@test.com'
    component.password = 'wrong'
    component.onSubmit()
    expect(component.errorMessage).toBe('Email ou mot de passe incorrect')
  })

  it('onSubmit() clears errorMessage on login success', () => {
    authServiceSpy.login.and.returnValue(of(void 0))
    component.errorMessage = 'previous error'
    component.email = 'admin@facturation.dev'
    component.password = 'password123'
    component.onSubmit()
    expect(component.errorMessage).toBe('')
  })
})
