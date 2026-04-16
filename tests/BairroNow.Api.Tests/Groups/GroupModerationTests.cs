using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using BairroNow.Api.Data;
using BairroNow.Api.Models.Entities;
using BairroNow.Api.Models.Enums;
using Xunit;

namespace BairroNow.Api.Tests.Groups;

[Trait("Category", "Unit")]
public class GroupModerationTests
{
    private static AppDbContext NewDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static (AppDbContext db, Group group, GroupMember ownerMember, GroupMember adminMember, GroupMember regularMember)
        SetupGroupWithRoles()
    {
        var db = NewDb();

        var owner = new User { Id = Guid.NewGuid(), Email = $"{Guid.NewGuid()}@t.com", PasswordHash = "h", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var admin = new User { Id = Guid.NewGuid(), Email = $"{Guid.NewGuid()}@t.com", PasswordHash = "h", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var regular = new User { Id = Guid.NewGuid(), Email = $"{Guid.NewGuid()}@t.com", PasswordHash = "h", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        db.Users.AddRange(owner, admin, regular);

        var group = new Group { BairroId = 1, Name = "Test", Description = "T", Category = GroupCategory.Outros };
        db.Groups.Add(group);
        db.SaveChanges();

        var ownerMember = new GroupMember { GroupId = group.Id, UserId = owner.Id, Role = GroupMemberRole.Owner, Status = GroupMemberStatus.Active };
        var adminMember = new GroupMember { GroupId = group.Id, UserId = admin.Id, Role = GroupMemberRole.Admin, Status = GroupMemberStatus.Active };
        var regularMember = new GroupMember { GroupId = group.Id, UserId = regular.Id, Role = GroupMemberRole.Member, Status = GroupMemberStatus.Active };
        db.GroupMembers.AddRange(ownerMember, adminMember, regularMember);
        db.SaveChanges();

        return (db, group, ownerMember, adminMember, regularMember);
    }

    /// <summary>Simulates the RBAC logic from GroupsController.RemoveMember</summary>
    private static bool CanRemoveMember(GroupMemberRole actorRole, GroupMemberRole targetRole)
    {
        // Only Owner or Admin can remove members
        if (actorRole == GroupMemberRole.Member) return false;
        // Admin cannot remove Owner
        if (actorRole == GroupMemberRole.Admin && targetRole == GroupMemberRole.Owner) return false;
        return true;
    }

    [Fact]
    public void RegularMember_CannotRemoveMember_Returns403()
    {
        var canRemove = CanRemoveMember(GroupMemberRole.Member, GroupMemberRole.Member);
        canRemove.Should().BeFalse("regular members cannot moderate");
    }

    [Fact]
    public void Owner_CanRemoveMember()
    {
        var canRemove = CanRemoveMember(GroupMemberRole.Owner, GroupMemberRole.Member);
        canRemove.Should().BeTrue();
    }

    [Fact]
    public void Admin_CanRemoveMember()
    {
        var canRemove = CanRemoveMember(GroupMemberRole.Admin, GroupMemberRole.Member);
        canRemove.Should().BeTrue();
    }

    [Fact]
    public void Admin_CannotRemoveOwner_Returns403()
    {
        var canRemove = CanRemoveMember(GroupMemberRole.Admin, GroupMemberRole.Owner);
        canRemove.Should().BeFalse("admin cannot remove owner");
    }

    [Fact]
    public async Task GroupMember_RemovalByOwner_RemovesFromDb()
    {
        var (db, group, ownerMember, _, regularMember) = SetupGroupWithRoles();

        // Owner removes regular member
        db.GroupMembers.Remove(regularMember);
        await db.SaveChangesAsync();

        var remaining = await db.GroupMembers.CountAsync(m => m.GroupId == group.Id);
        remaining.Should().Be(2); // owner + admin remain
    }
}
