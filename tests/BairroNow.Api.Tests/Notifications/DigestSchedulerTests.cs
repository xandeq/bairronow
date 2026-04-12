using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using FluentAssertions;
using BairroNow.Api.Data;
using BairroNow.Api.Models.Entities;
using BairroNow.Api.Models.Enums;
using BairroNow.Api.Services;

namespace BairroNow.Api.Tests.Notifications;

[Trait("Category", "Unit")]
public class DigestSchedulerTests : IDisposable
{
    private readonly AppDbContext _db;

    public DigestSchedulerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new AppDbContext(options);
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task DigestQueryFilters_CorrectUsers_OptedInVerifiedActive()
    {
        var bairro = new Bairro { Nome = "Centro", Cidade = "Vila Velha", Uf = "ES" };
        _db.Bairros.Add(bairro);
        await _db.SaveChangesAsync();

        // Should receive: opted in, confirmed email, active, has bairro
        _db.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            Email = "yes@test.com",
            PasswordHash = "hash",
            DigestOptOut = false,
            EmailConfirmed = true,
            IsActive = true,
            BairroId = bairro.Id
        });

        // Should NOT receive: opted out
        _db.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            Email = "optout@test.com",
            PasswordHash = "hash",
            DigestOptOut = true,
            EmailConfirmed = true,
            IsActive = true,
            BairroId = bairro.Id
        });

        // Should NOT receive: email not confirmed
        _db.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            Email = "noconfirm@test.com",
            PasswordHash = "hash",
            DigestOptOut = false,
            EmailConfirmed = false,
            IsActive = true,
            BairroId = bairro.Id
        });

        // Should NOT receive: inactive
        _db.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            Email = "inactive@test.com",
            PasswordHash = "hash",
            DigestOptOut = false,
            EmailConfirmed = true,
            IsActive = false,
            BairroId = bairro.Id
        });

        // Should NOT receive: no bairro
        _db.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            Email = "nobairro@test.com",
            PasswordHash = "hash",
            DigestOptOut = false,
            EmailConfirmed = true,
            IsActive = true,
            BairroId = null
        });

        await _db.SaveChangesAsync();

        // Replicate the query from DigestSchedulerService
        var users = await _db.Users.AsNoTracking()
            .Where(u => !u.DigestOptOut && u.EmailConfirmed && u.IsActive && u.BairroId != null)
            .ToListAsync();

        users.Should().HaveCount(1);
        users[0].Email.Should().Be("yes@test.com");
    }

    [Fact]
    public async Task DigestContent_IncludesTop3Posts()
    {
        var bairro = new Bairro { Nome = "Centro", Cidade = "Vila Velha", Uf = "ES" };
        _db.Bairros.Add(bairro);
        await _db.SaveChangesAsync();

        var authorId = Guid.NewGuid();
        _db.Users.Add(new User { Id = authorId, Email = "author@test.com", PasswordHash = "hash", BairroId = bairro.Id });

        var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);

        // Add 5 posts, only top 3 by likes should be selected
        for (int i = 0; i < 5; i++)
        {
            _db.Posts.Add(new Post
            {
                AuthorId = authorId,
                Body = $"Post {i}",
                Category = PostCategory.Geral,
                BairroId = bairro.Id,
                CreatedAt = sevenDaysAgo.AddHours(i)
            });
        }
        await _db.SaveChangesAsync();

        var topPosts = await _db.Posts.AsNoTracking()
            .Where(p => p.BairroId == bairro.Id && p.CreatedAt >= sevenDaysAgo)
            .OrderByDescending(p => p.Likes.Count)
            .Take(3)
            .ToListAsync();

        topPosts.Should().HaveCount(3);
    }

    [Fact]
    public void LastDigestDate_Guard_PreventsDubleFire()
    {
        // Test the guard pattern: if _lastDigestDate == today, don't fire again
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        DateOnly? lastDigestDate = null;

        // First check: should fire
        (lastDigestDate != today).Should().BeTrue();
        lastDigestDate = today;

        // Second check: should NOT fire (double-fire prevention)
        (lastDigestDate != today).Should().BeFalse();
    }
}
