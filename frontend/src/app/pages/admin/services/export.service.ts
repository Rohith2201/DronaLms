import { Injectable } from '@angular/core';
import { ExportOptions } from '../models/admin.models';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  /**
   * Download data as CSV file
   */
  downloadCSV<T extends Record<string, any>>(data: T[], filename: string, columnMapping?: Record<keyof T, string>): void {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    const csv = this.convertToCSV(data, columnMapping);
    this.downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
  }

  /**
   * Download data as Excel file (CSV format compatible with Excel)
   */
  downloadExcel<T extends Record<string, any>>(data: T[], filename: string, columnMapping?: Record<keyof T, string>): void {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    const csv = this.convertToCSV(data, columnMapping);
    // Using CSV with BOM for Excel compatibility
    const BOM = '\uFEFF';
    this.downloadFile(BOM + csv, `${filename}.xlsx`, 'application/vnd.ms-excel;charset=utf-8;');
  }

  /**
   * Generic export method
   */
  export<T extends Record<string, any>>(data: T[], options: ExportOptions, columnMapping?: Record<keyof T, string>): void {
    const filename = options.filename || `export_${Date.now()}`;
    
    if (options.format === 'CSV') {
      this.downloadCSV(data, filename, columnMapping);
    } else if (options.format === 'EXCEL') {
      this.downloadExcel(data, filename, columnMapping);
    }
  }

  /**
   * Convert array of objects to CSV string
   */
  private convertToCSV<T extends Record<string, any>>(data: T[], columnMapping?: Record<keyof T, string>): string {
    if (!data || data.length === 0) return '';

    const firstItem = data[0];
    const keys = Object.keys(firstItem) as (keyof T)[];
    
    // Create headers
    const headers = keys.map(key => {
      if (columnMapping && columnMapping[key]) {
        return this.escapeCSV(columnMapping[key]);
      }
      return this.escapeCSV(String(key));
    });

    // Create rows
    const rows = data.map(item => {
      return keys.map(key => {
        const value = item[key];
        return this.escapeCSV(this.formatValue(value));
      });
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Escape CSV special characters
   */
  private escapeCSV(value: string): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    const stringValue = String(value);
    
    // If value contains comma, newline, or quote, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
  }

  /**
   * Format value for CSV
   */
  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  /**
   * Trigger file download
   */
  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);
  }

  /**
   * Export enrolled users data
   */
  exportEnrolledUsers(users: any[], format: 'CSV' | 'EXCEL' = 'CSV'): void {
    const columnMapping = {
      name: 'Student Name',
      email: 'Email',
      progress: 'Progress (%)',
      score: 'Score',
      completionStatus: 'Status',
      enrolledAt: 'Enrolled Date',
      lastAccessedAt: 'Last Accessed',
      completedAt: 'Completed Date',
      timeSpent: 'Time Spent (min)'
    };

    const filename = `enrolled_users_${Date.now()}`;
    
    if (format === 'CSV') {
      this.downloadCSV(users, filename, columnMapping);
    } else {
      this.downloadExcel(users, filename, columnMapping);
    }
  }

  /**
   * Export course analytics data
   */
  exportCourseAnalytics(analytics: any, format: 'CSV' | 'EXCEL' = 'CSV'): void {
    const data = [{
      'Course ID': analytics.courseId,
      'Course Title': analytics.courseTitle,
      'Total Enrolled': analytics.totalEnrolled,
      'Active Learners': analytics.activeLearnersCount,
      'Completion Rate': `${analytics.completionRate}%`,
      'Average Score': analytics.averageScore,
      'Average Rating': analytics.averageRating,
      'Total Revenue': `$${analytics.totalRevenue}`,
      'Not Started': analytics.progressDistribution?.notStarted || 0,
      'In Progress': analytics.progressDistribution?.inProgress || 0,
      'Completed': analytics.progressDistribution?.completed || 0
    }];

    const filename = `course_analytics_${analytics.courseId}_${Date.now()}`;
    
    if (format === 'CSV') {
      this.downloadCSV(data, filename);
    } else {
      this.downloadExcel(data, filename);
    }
  }

  /**
   * Export all courses data
   */
  exportCourses(courses: any[], format: 'CSV' | 'EXCEL' = 'CSV'): void {
    const columnMapping = {
      id: 'Course ID',
      title: 'Title',
      category: 'Category',
      level: 'Level',
      status: 'Status',
      enrollmentCount: 'Enrollments',
      rating: 'Rating',
      completionRate: 'Completion Rate (%)',
      price: 'Price',
      revenue: 'Revenue',
      instructorName: 'Instructor',
      createdAt: 'Created Date'
    };

    const filename = `courses_export_${Date.now()}`;
    
    if (format === 'CSV') {
      this.downloadCSV(courses, filename, columnMapping);
    } else {
      this.downloadExcel(courses, filename, columnMapping);
    }
  }
}
