import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

// ─── Angular Material ──────────────────────────────────────
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDividerModule } from '@angular/material/divider';
import { MatRippleModule } from '@angular/material/core';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatStepperModule } from '@angular/material/stepper';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ScrollingModule } from '@angular/cdk/scrolling';

// ─── Shared Components ────────────────────────────────────
import { StatsCardComponent } from '../components/stats-card/stats-card.component';
import { CourseCardComponent } from '../components/course-card/course-card.component';
import { ProgressRingComponent } from '../components/progress-ring/progress-ring.component';
import { SkeletonLoaderComponent } from '../shared/loaders/skeleton-loader/skeleton-loader.component';
import { ModuleProgressComponent } from '../components/module-progress/module-progress.component';

const MATERIAL_MODULES = [
  MatButtonModule, MatCardModule, MatIconModule, MatInputModule, MatFormFieldModule,
  MatSelectModule, MatProgressBarModule, MatProgressSpinnerModule, MatChipsModule,
  MatBadgeModule, MatMenuModule, MatTooltipModule, MatSnackBarModule, MatDialogModule,
  MatTabsModule, MatSidenavModule, MatListModule, MatExpansionModule, MatTableModule,
  MatPaginatorModule, MatSortModule, MatDividerModule, MatRippleModule, MatSliderModule,
  MatSlideToggleModule, MatCheckboxModule, MatRadioModule, MatDatepickerModule,
  MatNativeDateModule, MatAutocompleteModule, MatStepperModule, MatToolbarModule,
  ScrollingModule
];

const SHARED_COMPONENTS = [
  StatsCardComponent,
  CourseCardComponent,
  ProgressRingComponent,
  SkeletonLoaderComponent,
  ModuleProgressComponent,
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    ...MATERIAL_MODULES,
    ...SHARED_COMPONENTS,
  ],
  exports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    ...MATERIAL_MODULES,
    ...SHARED_COMPONENTS,
  ]
})
export class SharedModule {}
