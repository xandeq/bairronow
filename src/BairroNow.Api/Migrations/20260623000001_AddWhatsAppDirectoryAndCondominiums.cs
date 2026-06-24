using System;
using BairroNow.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BairroNow.Api.Migrations;

// Wave P — Diretório de grupos de WhatsApp + Condomínios (diferencial Meu Vizinho).
// NOTA: migration escrita à mão. O dotnet-ef design-time é bloqueado nesta máquina
// pela política Windows Application Control (Smart App Control, 0x800711C7) ao
// carregar o assembly recém-compilado. Em CI/Linux o EF gera idêntico. As operações
// abaixo refletem exatamente a config em AppDbContext.OnModelCreating (Wave P).
[DbContext(typeof(AppDbContext))]
[Migration("20260623000001_AddWhatsAppDirectoryAndCondominiums")]
public partial class AddWhatsAppDirectoryAndCondominiums : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Condominiums",
            columns: table => new
            {
                Id = table.Column<int>(type: "int", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                BairroId = table.Column<int>(type: "int", nullable: false),
                Name = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                AddressLine = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                Cep = table.Column<string>(type: "nvarchar(9)", maxLength: 9, nullable: true),
                CoverImageUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                UnitsCount = table.Column<int>(type: "int", nullable: true),
                Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                SindicoUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                SindicoRole = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                CreatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                IsManagedByPlatform = table.Column<bool>(type: "bit", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Condominiums", x => x.Id);
                table.ForeignKey("FK_Condominiums_Bairros_BairroId", x => x.BairroId, "Bairros", "Id", onDelete: ReferentialAction.Restrict);
                table.ForeignKey("FK_Condominiums_Users_SindicoUserId", x => x.SindicoUserId, "Users", "Id", onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateTable(
            name: "WhatsAppGroups",
            columns: table => new
            {
                Id = table.Column<int>(type: "int", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                BairroId = table.Column<int>(type: "int", nullable: false),
                CondominiumId = table.Column<int>(type: "int", nullable: true),
                Name = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                InviteUrl = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                Kind = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                CoverImageUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                MemberCountApprox = table.Column<int>(type: "int", nullable: true),
                Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                IsManagedByPlatform = table.Column<bool>(type: "bit", nullable: false),
                ClickCount = table.Column<int>(type: "int", nullable: false),
                SubmittedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                VerifiedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                VerifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                RejectionReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_WhatsAppGroups", x => x.Id);
                table.ForeignKey("FK_WhatsAppGroups_Bairros_BairroId", x => x.BairroId, "Bairros", "Id", onDelete: ReferentialAction.Restrict);
                table.ForeignKey("FK_WhatsAppGroups_Condominiums_CondominiumId", x => x.CondominiumId, "Condominiums", "Id", onDelete: ReferentialAction.SetNull);
                table.ForeignKey("FK_WhatsAppGroups_Users_SubmittedByUserId", x => x.SubmittedByUserId, "Users", "Id", onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateTable(
            name: "CondominiumClaims",
            columns: table => new
            {
                Id = table.Column<int>(type: "int", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                CondominiumId = table.Column<int>(type: "int", nullable: false),
                UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                RequestedRole = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                Justification = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                EvidenceUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                ReviewedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                ReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                ReviewNote = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_CondominiumClaims", x => x.Id);
                table.ForeignKey("FK_CondominiumClaims_Condominiums_CondominiumId", x => x.CondominiumId, "Condominiums", "Id", onDelete: ReferentialAction.Cascade);
                table.ForeignKey("FK_CondominiumClaims_Users_UserId", x => x.UserId, "Users", "Id", onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex("IX_Condominiums_BairroId_Status", "Condominiums", new[] { "BairroId", "Status" });
        migrationBuilder.CreateIndex("IX_Condominiums_SindicoUserId", "Condominiums", "SindicoUserId");
        migrationBuilder.CreateIndex("IX_WhatsAppGroups_BairroId_Status", "WhatsAppGroups", new[] { "BairroId", "Status" });
        migrationBuilder.CreateIndex("IX_WhatsAppGroups_CondominiumId", "WhatsAppGroups", "CondominiumId");
        migrationBuilder.CreateIndex("IX_WhatsAppGroups_SubmittedByUserId", "WhatsAppGroups", "SubmittedByUserId");
        migrationBuilder.CreateIndex("IX_CondominiumClaims_CondominiumId_Status", "CondominiumClaims", new[] { "CondominiumId", "Status" });
        migrationBuilder.CreateIndex("IX_CondominiumClaims_UserId", "CondominiumClaims", "UserId");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "CondominiumClaims");
        migrationBuilder.DropTable(name: "WhatsAppGroups");
        migrationBuilder.DropTable(name: "Condominiums");
    }
}
