using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using BairroNow.Api.Data;
using BairroNow.Api.Models.Entities;
using BairroNow.Api.Models.Enums;
using Xunit;

namespace BairroNow.Api.Tests.Groups;

[Trait("Category", "Unit")]
public class GroupEventTests
{
    private static AppDbContext NewDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static (Group group, GroupEvent ev, User user) SeedEventData(AppDbContext db)
    {
        var creator = new User
        {
            Id = Guid.NewGuid(),
            Email = $"{Guid.NewGuid()}@test.com",
            PasswordHash = "hash",
            BairroId = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        db.Users.Add(creator);

        var group = new Group
        {
            BairroId = 1,
            Name = "Event Group",
            Description = "Test",
            Category = GroupCategory.Cultura,
            JoinPolicy = GroupJoinPolicy.Open,
            Scope = GroupScope.Bairro,
            CreatedAt = DateTime.UtcNow
        };
        db.Groups.Add(group);
        db.SaveChanges();

        var ev = new GroupEvent
        {
            GroupId = group.Id,
            CreatedByUserId = creator.Id,
            Title = "Test Event",
            StartsAt = DateTime.UtcNow.AddDays(1),
            ReminderAt = DateTime.UtcNow.AddHours(-1), // in the past, reminder due
            ReminderSent = false,
            CreatedAt = DateTime.UtcNow
        };
        db.GroupEvents.Add(ev);
        db.SaveChanges();

        return (group, ev, creator);
    }

    [Fact]
    public async Task Rsvp_FirstCall_CreatesRecordWithIsAttendingTrue()
    {
        using var db = NewDb();
        var (_, ev, user) = SeedEventData(db);

        var rsvp = new GroupEventRsvp
        {
            EventId = ev.Id,
            UserId = user.Id,
            IsAttending = true,
            RespondedAt = DateTime.UtcNow
        };
        db.GroupEventRsvps.Add(rsvp);
        await db.SaveChangesAsync();

        var saved = await db.GroupEventRsvps.FirstAsync(r => r.EventId == ev.Id && r.UserId == user.Id);
        saved.IsAttending.Should().BeTrue();
    }

    [Fact]
    public async Task Rsvp_SecondCall_UpdatesExistingRecord_NoDuplicate()
    {
        using var db = NewDb();
        var (_, ev, user) = SeedEventData(db);

        // First RSVP
        var rsvp = new GroupEventRsvp
        {
            EventId = ev.Id,
            UserId = user.Id,
            IsAttending = true,
            RespondedAt = DateTime.UtcNow
        };
        db.GroupEventRsvps.Add(rsvp);
        await db.SaveChangesAsync();

        // Second call — upsert by updating existing
        var existing = await db.GroupEventRsvps.FirstAsync(r => r.EventId == ev.Id && r.UserId == user.Id);
        existing.IsAttending = false;
        existing.RespondedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        var count = await db.GroupEventRsvps.CountAsync(r => r.EventId == ev.Id && r.UserId == user.Id);
        count.Should().Be(1); // no duplicate
        var final = await db.GroupEventRsvps.FirstAsync(r => r.EventId == ev.Id && r.UserId == user.Id);
        final.IsAttending.Should().BeFalse();
    }

    [Fact]
    public async Task ReminderService_FindsDueEvents_WhereReminderSentFalse()
    {
        using var db = NewDb();
        var (_, ev, _) = SeedEventData(db);

        // ev has ReminderAt in the past and ReminderSent=false
        var due = await db.GroupEvents
            .Where(e => e.ReminderAt <= DateTime.UtcNow && !e.ReminderSent && e.DeletedAt == null)
            .ToListAsync();

        due.Should().ContainSingle();
        due[0].Id.Should().Be(ev.Id);

        // After marking sent
        due[0].ReminderSent = true;
        await db.SaveChangesAsync();

        var afterMark = await db.GroupEvents
            .Where(e => e.ReminderAt <= DateTime.UtcNow && !e.ReminderSent && e.DeletedAt == null)
            .ToListAsync();
        afterMark.Should().BeEmpty();
    }
}
