using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BairroNow.Api.Migrations
{
    /// <inheritdoc />
    public partial class Phase5MapGroups : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "ApprovedLat",
                table: "Verifications",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "ApprovedLng",
                table: "Verifications",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ShowOnMap",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<double>(
                name: "CentroidLat",
                table: "Bairros",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "CentroidLng",
                table: "Bairros",
                type: "float",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Groups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BairroId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    JoinPolicy = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Scope = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Rules = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    CoverImageUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Groups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Groups_Bairros_BairroId",
                        column: x => x.BairroId,
                        principalTable: "Bairros",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PointsOfInterest",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BairroId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Category = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    Lat = table.Column<double>(type: "float", nullable: false),
                    Lng = table.Column<double>(type: "float", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PointsOfInterest", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PointsOfInterest_Bairros_BairroId",
                        column: x => x.BairroId,
                        principalTable: "Bairros",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PointsOfInterest_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "GroupEvents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GroupId = table.Column<int>(type: "int", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Location = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    StartsAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndsAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ReminderAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ReminderSent = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupEvents_Groups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GroupEvents_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "GroupMembers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GroupId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    NotificationPreference = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupMembers_Groups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GroupMembers_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "GroupPosts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GroupId = table.Column<int>(type: "int", nullable: false),
                    AuthorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    Body = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    IsFlagged = table.Column<bool>(type: "bit", nullable: false),
                    IsPublished = table.Column<bool>(type: "bit", nullable: false),
                    EditedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupPosts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupPosts_Groups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GroupPosts_Users_AuthorId",
                        column: x => x.AuthorId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "GroupEventRsvps",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EventId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IsAttending = table.Column<bool>(type: "bit", nullable: false),
                    RespondedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupEventRsvps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupEventRsvps_GroupEvents_EventId",
                        column: x => x.EventId,
                        principalTable: "GroupEvents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GroupEventRsvps_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "GroupComments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GroupPostId = table.Column<int>(type: "int", nullable: false),
                    AuthorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ParentCommentId = table.Column<int>(type: "int", nullable: true),
                    Body = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupComments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupComments_GroupComments_ParentCommentId",
                        column: x => x.ParentCommentId,
                        principalTable: "GroupComments",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_GroupComments_GroupPosts_GroupPostId",
                        column: x => x.GroupPostId,
                        principalTable: "GroupPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GroupComments_Users_AuthorId",
                        column: x => x.AuthorId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "GroupPostImages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GroupPostId = table.Column<int>(type: "int", nullable: false),
                    Url = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Order = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupPostImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupPostImages_GroupPosts_GroupPostId",
                        column: x => x.GroupPostId,
                        principalTable: "GroupPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GroupPostLikes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GroupPostId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupPostLikes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupPostLikes_GroupPosts_GroupPostId",
                        column: x => x.GroupPostId,
                        principalTable: "GroupPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GroupPostLikes_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GroupComments_AuthorId",
                table: "GroupComments",
                column: "AuthorId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupComments_GroupPostId",
                table: "GroupComments",
                column: "GroupPostId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupComments_ParentCommentId",
                table: "GroupComments",
                column: "ParentCommentId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupEventRsvps_EventId_UserId",
                table: "GroupEventRsvps",
                columns: new[] { "EventId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GroupEventRsvps_UserId",
                table: "GroupEventRsvps",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupEvents_CreatedByUserId",
                table: "GroupEvents",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupEvents_GroupId",
                table: "GroupEvents",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupMembers_GroupId_UserId",
                table: "GroupMembers",
                columns: new[] { "GroupId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GroupMembers_UserId",
                table: "GroupMembers",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupPostImages_GroupPostId",
                table: "GroupPostImages",
                column: "GroupPostId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupPostLikes_GroupPostId_UserId",
                table: "GroupPostLikes",
                columns: new[] { "GroupPostId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GroupPostLikes_UserId",
                table: "GroupPostLikes",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupPosts_AuthorId",
                table: "GroupPosts",
                column: "AuthorId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupPosts_GroupId",
                table: "GroupPosts",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_Groups_BairroId",
                table: "Groups",
                column: "BairroId");

            migrationBuilder.CreateIndex(
                name: "IX_PointsOfInterest_BairroId",
                table: "PointsOfInterest",
                column: "BairroId");

            migrationBuilder.CreateIndex(
                name: "IX_PointsOfInterest_CreatedByUserId",
                table: "PointsOfInterest",
                column: "CreatedByUserId");

            // FTS index on Groups using existing ftListings DEFAULT catalog (created in Phase 4)
            migrationBuilder.Sql(
                "IF NOT EXISTS (SELECT * FROM sys.fulltext_indexes WHERE object_id = OBJECT_ID('Groups')) " +
                "EXEC('CREATE FULLTEXT INDEX ON Groups(Name, Description) KEY INDEX PK_Groups ON ftListings;');",
                suppressTransaction: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GroupComments");

            migrationBuilder.DropTable(
                name: "GroupEventRsvps");

            migrationBuilder.DropTable(
                name: "GroupMembers");

            migrationBuilder.DropTable(
                name: "GroupPostImages");

            migrationBuilder.DropTable(
                name: "GroupPostLikes");

            migrationBuilder.DropTable(
                name: "PointsOfInterest");

            migrationBuilder.DropTable(
                name: "GroupEvents");

            migrationBuilder.DropTable(
                name: "GroupPosts");

            // Drop FTS index before dropping Groups table
            migrationBuilder.Sql(
                "IF EXISTS (SELECT * FROM sys.fulltext_indexes WHERE object_id = OBJECT_ID('Groups')) " +
                "EXEC('DROP FULLTEXT INDEX ON Groups;');",
                suppressTransaction: true);

            migrationBuilder.DropTable(
                name: "Groups");

            migrationBuilder.DropColumn(
                name: "ApprovedLat",
                table: "Verifications");

            migrationBuilder.DropColumn(
                name: "ApprovedLng",
                table: "Verifications");

            migrationBuilder.DropColumn(
                name: "ShowOnMap",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CentroidLat",
                table: "Bairros");

            migrationBuilder.DropColumn(
                name: "CentroidLng",
                table: "Bairros");
        }
    }
}
