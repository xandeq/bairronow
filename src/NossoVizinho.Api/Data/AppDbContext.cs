using Microsoft.EntityFrameworkCore;
using NossoVizinho.Api.Models.Entities;

namespace NossoVizinho.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Bairro> Bairros => Set<Bairro>();
    public DbSet<Verification> Verifications => Set<Verification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(256);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.Property(e => e.DisplayName).HasMaxLength(100);
            entity.Property(e => e.PhotoUrl).HasMaxLength(500);
            entity.Property(e => e.Bio).HasMaxLength(160);
            entity.Property(e => e.IsVerified).HasDefaultValue(false);
            entity.Property(e => e.IsAdmin).HasDefaultValue(false);
            entity.Property(e => e.AcceptedTermsVersion).HasMaxLength(20);
            entity.HasOne(e => e.Bairro)
                .WithMany()
                .HasForeignKey(e => e.BairroId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.Property(e => e.EmailConfirmed).HasDefaultValue(false);
            entity.Property(e => e.FailedLoginAttempts).HasDefaultValue(0);
            entity.Property(e => e.AcceptedPrivacyPolicyVersion).HasDefaultValue(1);
        });

        // RefreshToken
        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Token).IsRequired();
            entity.HasIndex(e => e.Token);
            entity.Property(e => e.CreatedByIp).IsRequired().HasMaxLength(45);
            entity.Property(e => e.RevokedByIp).HasMaxLength(45);
            entity.Property(e => e.IsRevoked).HasDefaultValue(false);
            entity.HasOne(e => e.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // AuditLog
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).UseIdentityColumn();
            entity.Property(e => e.Action).IsRequired().HasMaxLength(200);
            entity.Property(e => e.EntityType).HasMaxLength(100);
            entity.Property(e => e.EntityId).HasMaxLength(100);
            entity.Property(e => e.UserEmail).HasMaxLength(256);
            entity.Property(e => e.IpAddress).IsRequired().HasMaxLength(45);
            entity.Property(e => e.Details).HasMaxLength(2000);
            entity.Property(e => e.Timestamp).HasDefaultValueSql("GETUTCDATE()");
            entity.HasIndex(e => e.Timestamp);
        });

        // Bairro
        modelBuilder.Entity<Bairro>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Nome).IsRequired().HasMaxLength(120);
            entity.Property(e => e.Cidade).IsRequired().HasMaxLength(120);
            entity.Property(e => e.Uf).IsRequired().HasMaxLength(2);
            entity.Property(e => e.Slug).IsRequired().HasMaxLength(140);
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        // Verification
        modelBuilder.Entity<Verification>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Cep).IsRequired().HasMaxLength(9);
            entity.Property(e => e.Logradouro).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Numero).HasMaxLength(20);
            entity.Property(e => e.ProofFilePath).IsRequired().HasMaxLength(500);
            entity.Property(e => e.ProofSha256).IsRequired().HasMaxLength(64);
            entity.HasIndex(e => e.ProofSha256);
            entity.HasIndex(e => new { e.UserId, e.Status });
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
            entity.Property(e => e.RejectionReason).HasMaxLength(500);
            entity.Property(e => e.SubmittedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Bairro)
                .WithMany()
                .HasForeignKey(e => e.BairroId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasQueryFilter(v => !v.IsDeleted);
        });
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        foreach (var entry in ChangeTracker.Entries<User>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = now;
                entry.Entity.UpdatedAt = now;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = now;
            }
        }
        return await base.SaveChangesAsync(cancellationToken);
    }
}
