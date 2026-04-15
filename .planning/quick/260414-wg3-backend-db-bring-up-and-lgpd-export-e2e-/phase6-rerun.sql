SET QUOTED_IDENTIFIER ON;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412183923_Phase6PolishDeploy'
)
BEGIN
    ALTER TABLE [Verifications] ADD [DocumentDeletedAt] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412183923_Phase6PolishDeploy'
)
BEGIN
    ALTER TABLE [Verifications] ADD [OcrText] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412183923_Phase6PolishDeploy'
)
BEGIN
    ALTER TABLE [Users] ADD [DeleteRequestedAt] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412183923_Phase6PolishDeploy'
)
BEGIN
    ALTER TABLE [Users] ADD [DeletedAt] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412183923_Phase6PolishDeploy'
)
BEGIN
    ALTER TABLE [Users] ADD [DigestOptOut] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412183923_Phase6PolishDeploy'
)
BEGIN
    ALTER TABLE [Users] ADD [GoogleId] nvarchar(450) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412183923_Phase6PolishDeploy'
)
BEGIN
    ALTER TABLE [Users] ADD [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412183923_Phase6PolishDeploy'
)
BEGIN
    ALTER TABLE [Users] ADD [LastExportAt] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412183923_Phase6PolishDeploy'
)
BEGIN
    ALTER TABLE [Users] ADD [TotpBackupCodes] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412183923_Phase6PolishDeploy'
)
BEGIN
    ALTER TABLE [Users] ADD [TotpEnabled] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412183923_Phase6PolishDeploy'
)
BEGIN
    ALTER TABLE [Users] ADD [TotpSecret] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412183923_Phase6PolishDeploy'
)
BEGIN
    CREATE TABLE [MagicLinkTokens] (
        [Id] int NOT NULL IDENTITY,
        [UserId] uniqueidentifier NOT NULL,
        [TokenHash] nvarchar(128) NOT NULL,
        [ExpiresAt] datetime2 NOT NULL,
        [Used] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        CONSTRAINT [PK_MagicLinkTokens] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_MagicLinkTokens_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412183923_Phase6PolishDeploy'
)
BEGIN
    CREATE TABLE [VerificationVouches] (
        [Id] int NOT NULL IDENTITY,
        [VoucheeId] uniqueidentifier NOT NULL,
        [VoucherId] uniqueidentifier NOT NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        CONSTRAINT [PK_VerificationVouches] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_VerificationVouches_Users_VoucheeId] FOREIGN KEY ([VoucheeId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_VerificationVouches_Users_VoucherId] FOREIGN KEY ([VoucherId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412183923_Phase6PolishDeploy'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_Users_GoogleId] ON [Users] ([GoogleId]) WHERE [GoogleId] IS NOT NULL');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412183923_Phase6PolishDeploy'
)
BEGIN
    CREATE INDEX [IX_MagicLinkTokens_TokenHash] ON [MagicLinkTokens] ([TokenHash]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412183923_Phase6PolishDeploy'
)
BEGIN
    CREATE INDEX [IX_MagicLinkTokens_UserId] ON [MagicLinkTokens] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412183923_Phase6PolishDeploy'
)
BEGIN
    CREATE UNIQUE INDEX [IX_VerificationVouches_VoucheeId_VoucherId] ON [VerificationVouches] ([VoucheeId], [VoucherId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412183923_Phase6PolishDeploy'
)
BEGIN
    CREATE INDEX [IX_VerificationVouches_VoucherId] ON [VerificationVouches] ([VoucherId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412183923_Phase6PolishDeploy'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260412183923_Phase6PolishDeploy', N'8.0.25');
END;
GO

COMMIT;