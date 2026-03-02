import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  ReactiveFormsModule, 
  FormBuilder, 
  FormGroup, 
  Validators 
} from '@angular/forms';
import { 
  MAT_DIALOG_DATA, 
  MatDialogRef, 
  MatDialogModule 
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { AdminCoursesService } from '../../services/admin-courses.service';
import { AdminCourse, CourseFormData } from '../../models/admin.models';

interface DialogData {
  mode: 'create' | 'edit';
  course?: AdminCourse;
}

@Component({
  selector: 'app-course-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './course-dialog.component.html',
  styleUrls: ['./course-dialog.component.scss']
})
export class CourseDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private coursesService = inject(AdminCoursesService);
  
  dialogRef = inject(MatDialogRef<CourseDialogComponent>);
  data: DialogData = inject(MAT_DIALOG_DATA);

  courseForm!: FormGroup;
  loading = signal(false);
  separatorKeysCodes: number[] = [ENTER, COMMA];

  categories = ['Web Development', 'Mobile Development', 'Data Science', 'Machine Learning', 'Cloud Computing', 'DevOps', 'Cybersecurity', 'UI/UX Design', 'Business', 'Marketing'];
  levels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
  statuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

  tags = signal<string[]>([]);

  get isEditMode(): boolean {
    return this.data.mode === 'edit';
  }

  get dialogTitle(): string {
    return this.isEditMode ? 'Edit Course' : 'Create New Course';
  }

  ngOnInit(): void {
    this.initializeForm();
    
    if (this.isEditMode && this.data.course) {
      this.populateForm(this.data.course);
    }
  }

  initializeForm(): void {
    this.courseForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(2000)]],
      thumbnailUrl: [''],
      previewVideoUrl: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      category: ['', Validators.required],
      level: ['BEGINNER', Validators.required],
      status: ['DRAFT', Validators.required]
    });
  }

  populateForm(course: AdminCourse): void {
    this.courseForm.patchValue({
      title: course.title,
      description: course.description || '',
      thumbnailUrl: course.thumbnailUrl || '',
      previewVideoUrl: course.previewVideoUrl || '',
      price: course.price || 0,
      category: course.category || '',
      level: course.level || 'BEGINNER',
      status: course.status || 'DRAFT'
    });

    if (course.tags) {
      this.tags.set([...course.tags]);
    }
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    
    if (value && !this.tags().includes(value)) {
      this.tags.update(tags => [...tags, value]);
    }

    event.chipInput!.clear();
  }

  removeTag(tag: string): void {
    this.tags.update(tags => tags.filter(t => t !== tag));
  }

  onSubmit(): void {
    if (this.courseForm.invalid) {
      this.courseForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const formData: CourseFormData = {
      ...this.courseForm.value,
      tags: this.tags()
    };

    const operation = this.isEditMode
      ? this.coursesService.updateCourse(this.data.course!.id, formData)
      : this.coursesService.createCourse(formData);

    operation.subscribe({
      next: (result) => {
        this.loading.set(false);
        this.dialogRef.close(result);
      },
      error: (error) => {
        this.loading.set(false);
        console.error('Failed to save course:', error);
        alert('Failed to save course. Please try again.');
      }
    });
  }

  onCancel(): void {
    if (this.courseForm.dirty) {
      const confirm = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirm) return;
    }
    this.dialogRef.close();
  }

  getErrorMessage(fieldName: string): string {
    const control = this.courseForm.get(fieldName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (control.errors['minlength']) {
      const minLength = control.errors['minlength'].requiredLength;
      return `Minimum ${minLength} characters required`;
    }
    if (control.errors['maxlength']) {
      const maxLength = control.errors['maxlength'].requiredLength;
      return `Maximum ${maxLength} characters allowed`;
    }
    if (control.errors['min']) {
      return `Minimum value is ${control.errors['min'].min}`;
    }

    return 'Invalid input';
  }

  getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      title: 'Title',
      description: 'Description',
      price: 'Price',
      category: 'Category',
      level: 'Level',
      status: 'Status'
    };
    return labels[fieldName] || fieldName;
  }
}
