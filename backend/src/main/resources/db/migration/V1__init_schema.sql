CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_roles (
    user_id UUID NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE TABLE courses (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    level VARCHAR(50),
    published BOOLEAN NOT NULL DEFAULT FALSE,
    instructor_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_courses_instructor FOREIGN KEY (instructor_id) REFERENCES users(id)
);

CREATE TABLE modules (
    id UUID PRIMARY KEY,
    course_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    position INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_modules_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT uk_module_position_per_course UNIQUE (course_id, position)
);

CREATE TABLE lessons (
    id UUID PRIMARY KEY,
    module_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(30) NOT NULL,
    video_url TEXT,
    pdf_url TEXT,
    content_text TEXT,
    duration_seconds INT,
    position INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_lessons_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    CONSTRAINT uk_lesson_position_per_module UNIQUE (module_id, position)
);

CREATE TABLE enrollments (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL,
    course_id UUID NOT NULL,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    progress_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completion_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_enrollments_student FOREIGN KEY (student_id) REFERENCES users(id),
    CONSTRAINT fk_enrollments_course FOREIGN KEY (course_id) REFERENCES courses(id),
    CONSTRAINT uk_student_course_enrollment UNIQUE (student_id, course_id)
);

CREATE TABLE quizzes (
    id UUID PRIMARY KEY,
    module_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    max_score NUMERIC(8,2) NOT NULL,
    time_limit_minutes INT,
    passing_score NUMERIC(8,2) NOT NULL,
    generated_by_ai BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_quizzes_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

CREATE TABLE questions (
    id UUID PRIMARY KEY,
    quiz_id UUID NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(30) NOT NULL,
    options_json JSONB,
    correct_answer TEXT,
    points NUMERIC(8,2) NOT NULL DEFAULT 1,
    position INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_questions_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    CONSTRAINT uk_question_position_per_quiz UNIQUE (quiz_id, position)
);

CREATE TABLE submissions (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL,
    quiz_id UUID,
    submission_type VARCHAR(30) NOT NULL,
    title VARCHAR(255),
    answer_json JSONB,
    score NUMERIC(8,2),
    feedback TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    graded_at TIMESTAMPTZ,
    graded_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_submissions_student FOREIGN KEY (student_id) REFERENCES users(id),
    CONSTRAINT fk_submissions_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE SET NULL,
    CONSTRAINT fk_submissions_grader FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE certificates (
    id UUID PRIMARY KEY,
    enrollment_id UUID NOT NULL UNIQUE,
    certificate_number VARCHAR(100) NOT NULL UNIQUE,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    file_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_certificates_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX idx_modules_course_id ON modules(course_id);
CREATE INDEX idx_lessons_module_id ON lessons(module_id);
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_quizzes_module_id ON quizzes(module_id);
CREATE INDEX idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX idx_submissions_student_id ON submissions(student_id);
CREATE INDEX idx_submissions_quiz_id ON submissions(quiz_id);
CREATE INDEX idx_submissions_graded_by ON submissions(graded_by);
CREATE INDEX idx_certificates_certificate_number ON certificates(certificate_number);

INSERT INTO roles (code, description)
VALUES ('ADMIN', 'System administrator'),
       ('INSTRUCTOR', 'Course instructor'),
       ('STUDENT', 'Platform learner')
ON CONFLICT (code) DO NOTHING;
