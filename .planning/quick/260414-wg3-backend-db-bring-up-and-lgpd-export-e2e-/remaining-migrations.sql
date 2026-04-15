BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260408012526_Phase4MarketplaceChat'
)
BEGIN
    CREATE TABLE [Listings] (
        [Id] int NOT NULL IDENTITY,
        [SellerId] uniqueidentifier NOT NULL,
        [BairroId] int NOT NULL,
        [Title] nvarchar(120) NOT NULL,
        [Description] nvarchar(500) NOT NULL,
        [Price] decimal(12,2) NOT NULL,
        [CategoryCode] nvarchar(40) NOT NULL,
        [SubcategoryCode] nvarchar(40) NOT NULL,
        [Status] nvarchar(16) NOT NULL DEFAULT N'active',
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NOT NULL,
        [SoldAt] datetime2 NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_Listings] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Listings_Bairros_BairroId] FOREIGN KEY ([BairroId]) REFERENCES [Bairros] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Listings_Users_SellerId] FOREIGN KEY ([SellerId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260408012526_Phase4MarketplaceChat'
)
BEGIN
    CREATE TABLE [Conversations] (
        [Id] int NOT NULL IDENTITY,
        [ListingId] int NOT NULL,
        [BuyerId] uniqueidentifier NOT NULL,
        [SellerId] uniqueidentifier NOT NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [LastMessageAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Conversations] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Conversations_Listings_ListingId] FOREIGN KEY ([ListingId]) REFERENCES [Listings] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Conversations_Users_BuyerId] FOREIGN KEY ([BuyerId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Conversations_Users_SellerId] FOREIGN KEY ([SellerId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260408012526_Phase4MarketplaceChat'
)
BEGIN
    CREATE TABLE [ListingFavorites] (
        [Id] int NOT NULL IDENTITY,
        [ListingId] int NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [SnapshotPrice] decimal(12,2) NOT NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        CONSTRAINT [PK_ListingFavorites] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ListingFavorites_Listings_ListingId] FOREIGN KEY ([ListingId]) REFERENCES [Listings] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_ListingFavorites_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260408012526_Phase4MarketplaceChat'
)
BEGIN
    CREATE TABLE [ListingPhotos] (
        [Id] int NOT NULL IDENTITY,
        [ListingId] int NOT NULL,
        [OrderIndex] int NOT NULL,
        [StoragePath] nvarchar(500) NOT NULL,
        [ThumbnailPath] nvarchar(500) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_ListingPhotos] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ListingPhotos_Listings_ListingId] FOREIGN KEY ([ListingId]) REFERENCES [Listings] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260408012526_Phase4MarketplaceChat'
)
BEGIN
    CREATE TABLE [SellerRatings] (
        [Id] int NOT NULL IDENTITY,
        [SellerId] uniqueidentifier NOT NULL,
        [BuyerId] uniqueidentifier NOT NULL,
        [ListingId] int NOT NULL,
        [Stars] int NOT NULL,
        [Comment] nvarchar(500) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NOT NULL,
        [DeletedByAdminAt] datetime2 NULL,
        CONSTRAINT [PK_SellerRatings] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_SellerRatings_Listings_ListingId] FOREIGN KEY ([ListingId]) REFERENCES [Listings] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_SellerRatings_Users_BuyerId] FOREIGN KEY ([BuyerId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_SellerRatings_Users_SellerId] FOREIGN KEY ([SellerId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260408012526_Phase4MarketplaceChat'
)
BEGIN
    CREATE TABLE [ConversationParticipants] (
        [ConversationId] int NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [LastReadAt] datetime2 NULL,
        [SoftDeleted] bit NOT NULL,
        CONSTRAINT [PK_ConversationParticipants] PRIMARY KEY ([ConversationId], [UserId]),
        CONSTRAINT [FK_ConversationParticipants_Conversations_ConversationId] FOREIGN KEY ([ConversationId]) REFERENCES [Conversations] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_ConversationParticipants_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260408012526_Phase4MarketplaceChat'
)
BEGIN
    CREATE TABLE [Messages] (
        [Id] int NOT NULL IDENTITY,
        [ConversationId] int NOT NULL,
        [SenderId] uniqueidentifier NOT NULL,
        [Text] nvarchar(2000) NULL,
        [ImagePath] nvarchar(500) NULL,
        [SentAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_Messages] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Messages_Conversations_ConversationId] FOREIGN KEY ([ConversationId]) REFERENCES [Conversations] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Messages_Users_SenderId] FOREIGN KEY ([SenderId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260408012526_Phase4MarketplaceChat'
)
BEGIN
    CREATE INDEX [IX_ConversationParticipants_UserId_LastReadAt] ON [ConversationParticipants] ([UserId], [LastReadAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260408012526_Phase4MarketplaceChat'
)
BEGIN
    CREATE INDEX [IX_Conversations_BuyerId] ON [Conversations] ([BuyerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260408012526_Phase4MarketplaceChat'
)
BEGIN
    CREATE INDEX [IX_Conversations_LastMessageAt] ON [Conversations] ([LastMessageAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260408012526_Phase4MarketplaceChat'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Conversations_ListingId_BuyerId_SellerId] ON [Conversations] ([ListingId], [BuyerId], [SellerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260408012526_Phase4MarketplaceChat'
)
BEGIN
    CREATE INDEX [IX_Conversations_SellerId] ON [Conversations] ([SellerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260408012526_Phase4MarketplaceChat'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ListingFavorites_ListingId_UserId] ON [ListingFavorites] ([ListingId], [UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260408012526_Phase4MarketplaceChat'
)
BEGIN
    CREATE INDEX [IX_ListingFavorites_UserId] ON [ListingFavorites] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260408012526_Phase4MarketplaceChat'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ListingPhotos_ListingId_OrderIndex] ON [ListingPhotos] ([ListingId], [OrderIndex]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260408012526_Phase4MarketplaceChat'
)
BEGIN
    CREATE INDEX [IX_Listings_BairroId_Status_CreatedAt] ON [Listings] ([BairroId], [Status], [CreatedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260408012526_Phase4MarketplaceChat'
)
BEGIN
    CREATE INDEX [IX_Listings_SellerId] ON [Listings] ([SellerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260408012526_Phase4MarketplaceChat'
)
BEGIN
    CREATE INDEX [IX_Messages_ConversationId_SentAt] ON [Messages] ([ConversationId], [SentAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260408012526_Phase4MarketplaceChat'
)
BEGIN
    CREATE INDEX [IX_Messages_SenderId] ON [Messages] ([SenderId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260408012526_Phase4MarketplaceChat'
)
BEGIN
    CREATE UNIQUE INDEX [IX_SellerRatings_BuyerId_ListingId] ON [SellerRatings] ([BuyerId], [ListingId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260408012526_Phase4MarketplaceChat'
)
BEGIN
    CREATE INDEX [IX_SellerRatings_ListingId] ON [SellerRatings] ([ListingId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260408012526_Phase4MarketplaceChat'
)
BEGIN
    CREATE INDEX [IX_SellerRatings_SellerId_DeletedByAdminAt] ON [SellerRatings] ([SellerId], [DeletedByAdminAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260408012526_Phase4MarketplaceChat'
)
BEGIN

    IF SERVERPROPERTY('IsFullTextInstalled') = 1
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM sys.fulltext_catalogs WHERE name = 'ftListings')
            EXEC('CREATE FULLTEXT CATALOG ftListings AS DEFAULT;');

        IF NOT EXISTS (SELECT 1 FROM sys.fulltext_indexes fi
                       JOIN sys.objects o ON fi.object_id = o.object_id
                       WHERE o.name = 'Listings')
            EXEC('CREATE FULLTEXT INDEX ON Listings(Title, Description)
                  KEY INDEX PK_Listings ON ftListings WITH CHANGE_TRACKING AUTO;');
    END

END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260408012526_Phase4MarketplaceChat'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260408012526_Phase4MarketplaceChat', N'8.0.25');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412123215_Phase5MapGroups'
)
BEGIN
    ALTER TABLE [Verifications] ADD [ApprovedLat] float NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412123215_Phase5MapGroups'
)
BEGIN
    ALTER TABLE [Verifications] ADD [ApprovedLng] float NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412123215_Phase5MapGroups'
)
BEGIN
    ALTER TABLE [Users] ADD [ShowOnMap] bit NOT NULL DEFAULT CAST(1 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412123215_Phase5MapGroups'
)
BEGIN
    ALTER TABLE [Bairros] ADD [CentroidLat] float NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412123215_Phase5MapGroups'
)
BEGIN
    ALTER TABLE [Bairros] ADD [CentroidLng] float NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412123215_Phase5MapGroups'
)
BEGIN
    CREATE TABLE [Groups] (
        [Id] int NOT NULL IDENTITY,
        [BairroId] int NOT NULL,
        [Name] nvarchar(100) NOT NULL,
        [Description] nvarchar(500) NOT NULL,
        [Category] nvarchar(40) NOT NULL,
        [JoinPolicy] nvarchar(20) NOT NULL,
        [Scope] nvarchar(20) NOT NULL,
        [Rules] nvarchar(2000) NULL,
        [CoverImageUrl] nvarchar(500) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_Groups] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Groups_Bairros_BairroId] FOREIGN KEY ([BairroId]) REFERENCES [Bairros] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412123215_Phase5MapGroups'
)
BEGIN
    CREATE TABLE [PointsOfInterest] (
        [Id] int NOT NULL IDENTITY,
        [BairroId] int NOT NULL,
        [Name] nvarchar(120) NOT NULL,
        [Description] nvarchar(500) NULL,
        [Category] nvarchar(40) NOT NULL,
        [Lat] float NOT NULL,
        [Lng] float NOT NULL,
        [CreatedByUserId] uniqueidentifier NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_PointsOfInterest] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PointsOfInterest_Bairros_BairroId] FOREIGN KEY ([BairroId]) REFERENCES [Bairros] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_PointsOfInterest_Users_CreatedByUserId] FOREIGN KEY ([CreatedByUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412123215_Phase5MapGroups'
)
BEGIN
    CREATE TABLE [GroupEvents] (
        [Id] int NOT NULL IDENTITY,
        [GroupId] int NOT NULL,
        [CreatedByUserId] uniqueidentifier NOT NULL,
        [Title] nvarchar(200) NOT NULL,
        [Description] nvarchar(1000) NULL,
        [Location] nvarchar(300) NULL,
        [StartsAt] datetime2 NOT NULL,
        [EndsAt] datetime2 NULL,
        [ReminderAt] datetime2 NULL,
        [ReminderSent] bit NOT NULL,
        [DeletedAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_GroupEvents] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_GroupEvents_Groups_GroupId] FOREIGN KEY ([GroupId]) REFERENCES [Groups] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_GroupEvents_Users_CreatedByUserId] FOREIGN KEY ([CreatedByUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412123215_Phase5MapGroups'
)
BEGIN
    CREATE TABLE [GroupMembers] (
        [Id] int NOT NULL IDENTITY,
        [GroupId] int NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [Role] nvarchar(20) NOT NULL,
        [Status] nvarchar(20) NOT NULL,
        [NotificationPreference] nvarchar(20) NOT NULL,
        [JoinedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_GroupMembers] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_GroupMembers_Groups_GroupId] FOREIGN KEY ([GroupId]) REFERENCES [Groups] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_GroupMembers_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412123215_Phase5MapGroups'
)
BEGIN
    CREATE TABLE [GroupPosts] (
        [Id] int NOT NULL IDENTITY,
        [GroupId] int NOT NULL,
        [AuthorId] uniqueidentifier NOT NULL,
        [Category] nvarchar(40) NOT NULL,
        [Body] nvarchar(2000) NOT NULL,
        [IsFlagged] bit NOT NULL,
        [IsPublished] bit NOT NULL,
        [EditedAt] datetime2 NULL,
        [DeletedAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_GroupPosts] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_GroupPosts_Groups_GroupId] FOREIGN KEY ([GroupId]) REFERENCES [Groups] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_GroupPosts_Users_AuthorId] FOREIGN KEY ([AuthorId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412123215_Phase5MapGroups'
)
BEGIN
    CREATE TABLE [GroupEventRsvps] (
        [Id] int NOT NULL IDENTITY,
        [EventId] int NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [IsAttending] bit NOT NULL,
        [RespondedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_GroupEventRsvps] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_GroupEventRsvps_GroupEvents_EventId] FOREIGN KEY ([EventId]) REFERENCES [GroupEvents] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_GroupEventRsvps_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412123215_Phase5MapGroups'
)
BEGIN
    CREATE TABLE [GroupComments] (
        [Id] int NOT NULL IDENTITY,
        [GroupPostId] int NOT NULL,
        [AuthorId] uniqueidentifier NOT NULL,
        [ParentCommentId] int NULL,
        [Body] nvarchar(1000) NOT NULL,
        [DeletedAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_GroupComments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_GroupComments_GroupComments_ParentCommentId] FOREIGN KEY ([ParentCommentId]) REFERENCES [GroupComments] ([Id]),
        CONSTRAINT [FK_GroupComments_GroupPosts_GroupPostId] FOREIGN KEY ([GroupPostId]) REFERENCES [GroupPosts] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_GroupComments_Users_AuthorId] FOREIGN KEY ([AuthorId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412123215_Phase5MapGroups'
)
BEGIN
    CREATE TABLE [GroupPostImages] (
        [Id] int NOT NULL IDENTITY,
        [GroupPostId] int NOT NULL,
        [Url] nvarchar(500) NOT NULL,
        [Order] int NOT NULL,
        CONSTRAINT [PK_GroupPostImages] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_GroupPostImages_GroupPosts_GroupPostId] FOREIGN KEY ([GroupPostId]) REFERENCES [GroupPosts] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412123215_Phase5MapGroups'
)
BEGIN
    CREATE TABLE [GroupPostLikes] (
        [Id] int NOT NULL IDENTITY,
        [GroupPostId] int NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_GroupPostLikes] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_GroupPostLikes_GroupPosts_GroupPostId] FOREIGN KEY ([GroupPostId]) REFERENCES [GroupPosts] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_GroupPostLikes_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412123215_Phase5MapGroups'
)
BEGIN
    CREATE INDEX [IX_GroupComments_AuthorId] ON [GroupComments] ([AuthorId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412123215_Phase5MapGroups'
)
BEGIN
    CREATE INDEX [IX_GroupComments_GroupPostId] ON [GroupComments] ([GroupPostId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412123215_Phase5MapGroups'
)
BEGIN
    CREATE INDEX [IX_GroupComments_ParentCommentId] ON [GroupComments] ([ParentCommentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412123215_Phase5MapGroups'
)
BEGIN
    CREATE UNIQUE INDEX [IX_GroupEventRsvps_EventId_UserId] ON [GroupEventRsvps] ([EventId], [UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412123215_Phase5MapGroups'
)
BEGIN
    CREATE INDEX [IX_GroupEventRsvps_UserId] ON [GroupEventRsvps] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412123215_Phase5MapGroups'
)
BEGIN
    CREATE INDEX [IX_GroupEvents_CreatedByUserId] ON [GroupEvents] ([CreatedByUserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412123215_Phase5MapGroups'
)
BEGIN
    CREATE INDEX [IX_GroupEvents_GroupId] ON [GroupEvents] ([GroupId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412123215_Phase5MapGroups'
)
BEGIN
    CREATE UNIQUE INDEX [IX_GroupMembers_GroupId_UserId] ON [GroupMembers] ([GroupId], [UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412123215_Phase5MapGroups'
)
BEGIN
    CREATE INDEX [IX_GroupMembers_UserId] ON [GroupMembers] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412123215_Phase5MapGroups'
)
BEGIN
    CREATE INDEX [IX_GroupPostImages_GroupPostId] ON [GroupPostImages] ([GroupPostId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412123215_Phase5MapGroups'
)
BEGIN
    CREATE UNIQUE INDEX [IX_GroupPostLikes_GroupPostId_UserId] ON [GroupPostLikes] ([GroupPostId], [UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412123215_Phase5MapGroups'
)
BEGIN
    CREATE INDEX [IX_GroupPostLikes_UserId] ON [GroupPostLikes] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412123215_Phase5MapGroups'
)
BEGIN
    CREATE INDEX [IX_GroupPosts_AuthorId] ON [GroupPosts] ([AuthorId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412123215_Phase5MapGroups'
)
BEGIN
    CREATE INDEX [IX_GroupPosts_GroupId] ON [GroupPosts] ([GroupId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412123215_Phase5MapGroups'
)
BEGIN
    CREATE INDEX [IX_Groups_BairroId] ON [Groups] ([BairroId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412123215_Phase5MapGroups'
)
BEGIN
    CREATE INDEX [IX_PointsOfInterest_BairroId] ON [PointsOfInterest] ([BairroId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412123215_Phase5MapGroups'
)
BEGIN
    CREATE INDEX [IX_PointsOfInterest_CreatedByUserId] ON [PointsOfInterest] ([CreatedByUserId]);
END;
GO

COMMIT;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412123215_Phase5MapGroups'
)
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.fulltext_indexes WHERE object_id = OBJECT_ID('Groups')) EXEC('CREATE FULLTEXT INDEX ON Groups(Name, Description) KEY INDEX PK_Groups ON ftListings;');
END;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412123215_Phase5MapGroups'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260412123215_Phase5MapGroups', N'8.0.25');
END;
GO

COMMIT;
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
GO

