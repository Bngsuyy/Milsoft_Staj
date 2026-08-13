CREATE TABLE "Users" (
    "Id" RAW(16) PRIMARY KEY,
    "Username" VARCHAR2(50 CHAR) NOT NULL,
    "Email" VARCHAR2(100 CHAR) NOT NULL,
    "PasswordHash" VARCHAR2(255 CHAR) NOT NULL,
    "FirstName" VARCHAR2(50 CHAR) NOT NULL,
    "LastName" VARCHAR2(50 CHAR) NOT NULL,
    "CreatedAt" TIMESTAMP(7) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "UpdatedAt" TIMESTAMP(7) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "IsActive" NUMBER(1) DEFAULT 1 NOT NULL,
    CONSTRAINT "UQ_Users_Username" UNIQUE ("Username"),
    CONSTRAINT "UQ_Users_Email" UNIQUE ("Email"),
    CONSTRAINT "CK_Users_IsActive" CHECK ("IsActive" IN (0, 1))
);

CREATE TABLE "Categories" (
    "Id" RAW(16) PRIMARY KEY,
    "Name" VARCHAR2(100 CHAR) NOT NULL,
    "Description" VARCHAR2(500 CHAR),
    "Color" VARCHAR2(7 CHAR) DEFAULT '#007bff' NOT NULL,
    "CreatedAt" TIMESTAMP(7) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "UserId" RAW(16) NOT NULL,
    CONSTRAINT "FK_Categories_Users_UserId"
        FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE,
    CONSTRAINT "UQ_Categories_UserId_Name" UNIQUE ("UserId", "Name"),
    CONSTRAINT "CK_Categories_Color" CHECK (REGEXP_LIKE("Color", '^#[0-9A-Fa-f]{6}$'))
);

CREATE TABLE "Tasks" (
    "Id" RAW(16) PRIMARY KEY,
    "Title" VARCHAR2(200 CHAR) NOT NULL,
    "Description" VARCHAR2(2000 CHAR),
    "Priority" NUMBER(10) DEFAULT 2 NOT NULL,
    "Status" NUMBER(10) DEFAULT 0 NOT NULL,
    "DueDate" TIMESTAMP(7),
    "CompletedAt" TIMESTAMP(7),
    "CreatedAt" TIMESTAMP(7) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "UpdatedAt" TIMESTAMP(7) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "UserId" RAW(16) NOT NULL,
    "CategoryId" RAW(16),
    CONSTRAINT "FK_Tasks_Users_UserId"
        FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Tasks_Categories_CategoryId"
        FOREIGN KEY ("CategoryId") REFERENCES "Categories" ("Id") ON DELETE SET NULL,
    CONSTRAINT "CK_Tasks_Priority" CHECK ("Priority" BETWEEN 1 AND 5),
    CONSTRAINT "CK_Tasks_Status" CHECK ("Status" BETWEEN 0 AND 3)
);

CREATE TABLE "TaskAttachments" (
    "Id" RAW(16) PRIMARY KEY,
    "TaskId" RAW(16) NOT NULL,
    "FileName" VARCHAR2(255 CHAR) NOT NULL,
    "FilePath" VARCHAR2(500 CHAR) NOT NULL,
    "FileSize" NUMBER(19) NOT NULL,
    "ContentType" VARCHAR2(100 CHAR) NOT NULL,
    "UploadedAt" TIMESTAMP(7) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "FK_TaskAttachments_Tasks_TaskId"
        FOREIGN KEY ("TaskId") REFERENCES "Tasks" ("Id") ON DELETE CASCADE,
    CONSTRAINT "CK_TaskAttachments_FileSize" CHECK ("FileSize" > 0)
);

CREATE TABLE "TaskComments" (
    "Id" RAW(16) PRIMARY KEY,
    "TaskId" RAW(16) NOT NULL,
    "UserId" RAW(16) NOT NULL,
    "Comment" VARCHAR2(2000 CHAR) NOT NULL,
    "CreatedAt" TIMESTAMP(7) DEFAULT CURRENT_TIMESTAMP NOT NULL,
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
    "CreatedAt", "UpdatedAt", "IsActive"
) VALUES (
    HEXTORAW('11111111111111111111111111111111'),
    'demouser',
    'demo@example.com',
    '$2a$11$dPWaszZ8p.60zHUUpZRNr.1.2gaCXoeYz1FqAR/U.ZYttsmttFNmS',
    'Demo',
    'User',
    TO_TIMESTAMP('2025-08-18 07:00:00', 'YYYY-MM-DD HH24:MI:SS'),
    TO_TIMESTAMP('2025-08-18 07:00:00', 'YYYY-MM-DD HH24:MI:SS'),
    1
);

COMMIT;
