import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { CoursePlayerComponent } from './course-player.component';
import { VideoPlayerComponent } from '../../../components/video-player/video-player.component';
import { AiChatWidgetComponent } from '../../../components/ai-chat-widget/ai-chat-widget.component';
import { LessonViewerComponent } from '../../../components/lesson-viewer/lesson-viewer.component';

const routes: Routes = [
  { path: '', component: CoursePlayerComponent },
  { path: 'lesson/:lessonId', component: CoursePlayerComponent }
];

@NgModule({
  declarations: [CoursePlayerComponent],
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    VideoPlayerComponent,
    AiChatWidgetComponent,
    LessonViewerComponent,
  ]
})
export class CoursePlayerModule {}
