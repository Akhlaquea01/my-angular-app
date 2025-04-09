import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SupplierScoringComponent } from './components/supplier-scoring/supplier-scoring.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ SupplierScoringComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'my-angular-app';
}
