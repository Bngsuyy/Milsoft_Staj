BEGIN;

CREATE TABLE "Users" (
    "Id" uuid PRIMARY KEY,
    "Username" varchar(50) NOT NULL,
    "Email" varchar(100) NOT NULL,
    "PasswordHash" varchar(255) NOT NULL,
    "FirstName" varchar(50) NOT NULL,
    "LastName" varchar(50) NOT NULL,
    "ProfileImagePath" varchar(120),
    "CreatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "IsActive" boolean NOT NULL DEFAULT TRUE,
    CONSTRAINT "UQ_Users_Username" UNIQUE ("Username"),
    CONSTRAINT "UQ_Users_Email" UNIQUE ("Email")
);

CREATE TABLE "Categories" (
    "Id" uuid PRIMARY KEY,
    "Name" varchar(100) NOT NULL,
    "Description" varchar(500),
    "Color" varchar(7) NOT NULL DEFAULT '#007bff',
    "Icon" varchar(100),
    "ImageUrl" text,
    "CreatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UserId" uuid NOT NULL,
    CONSTRAINT "FK_Categories_Users_UserId"
        FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE,
    CONSTRAINT "UQ_Categories_UserId_Name" UNIQUE ("UserId", "Name"),
    CONSTRAINT "CK_Categories_Color" CHECK ("Color" ~ '^#[0-9A-Fa-f]{6}$')
);

CREATE TABLE "Tasks" (
    "Id" uuid PRIMARY KEY,
    "Title" varchar(200) NOT NULL,
    "Description" varchar(2000),
    "Priority" integer NOT NULL DEFAULT 1,
    "Status" integer NOT NULL DEFAULT 0,
    "DueDate" timestamptz,
    "CompletedAt" timestamptz,
    "CreatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UserId" uuid NOT NULL,
    "CategoryId" uuid,
    CONSTRAINT "FK_Tasks_Users_UserId"
        FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Tasks_Categories_CategoryId"
        FOREIGN KEY ("CategoryId") REFERENCES "Categories" ("Id") ON DELETE SET NULL,
    CONSTRAINT "CK_Tasks_Priority" CHECK ("Priority" BETWEEN 1 AND 5),
    CONSTRAINT "CK_Tasks_Status" CHECK ("Status" BETWEEN 0 AND 3)
);

CREATE TABLE "TaskAttachments" (
    "Id" uuid PRIMARY KEY,
    "TaskId" uuid NOT NULL,
    "FileName" varchar(255) NOT NULL,
    "FilePath" varchar(500) NOT NULL,
    "FileSize" bigint NOT NULL,
    "ContentType" varchar(100) NOT NULL,
    "UploadedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_TaskAttachments_Tasks_TaskId"
        FOREIGN KEY ("TaskId") REFERENCES "Tasks" ("Id") ON DELETE CASCADE,
    CONSTRAINT "CK_TaskAttachments_FileSize" CHECK ("FileSize" > 0)
);

CREATE TABLE "TaskComments" (
    "Id" uuid PRIMARY KEY,
    "TaskId" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "Comment" varchar(2000) NOT NULL,
    "CreatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_TaskComments_Tasks_TaskId"
        FOREIGN KEY ("TaskId") REFERENCES "Tasks" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_TaskComments_Users_UserId"
        FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

CREATE INDEX "IX_Tasks_CategoryId" ON "Tasks" ("CategoryId");
CREATE INDEX "IX_Tasks_UserId_Status" ON "Tasks" ("UserId", "Status");
CREATE INDEX "IX_Tasks_UserId_DueDate" ON "Tasks" ("UserId", "DueDate");
CREATE INDEX "IX_TaskAttachments_TaskId" ON "TaskAttachments" ("TaskId");
CREATE INDEX "IX_TaskComments_TaskId" ON "TaskComments" ("TaskId");
CREATE INDEX "IX_TaskComments_UserId" ON "TaskComments" ("UserId");

INSERT INTO "Users" (
    "Id", "Username", "Email", "PasswordHash", "FirstName", "LastName",
    "ProfileImagePath", "CreatedAt", "UpdatedAt", "IsActive"
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'demouser',
    'demo@example.com',
    '$2a$11$dPWaszZ8p.60zHUUpZRNr.1.2gaCXoeYz1FqAR/U.ZYttsmttFNmS',
    'Demo',
    'User',
    NULL,
    '2025-08-18 07:00:00+00',
    '2025-08-18 07:00:00+00',
    TRUE
);

COMMIT;
