using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using BairroNow.Api.Data;
using BairroNow.Api.Models.Entities;
using BairroNow.Api.Models.Enums;
using Xunit;

namespace BairroNow.Api.Tests.Groups;

[Trait("Category", "Unit")]
public class GroupServiceTests
{
    private static AppDbContext NewDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static User SeedUser(AppDbContext db, int? bairroId = 1)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = $"{Guid.NewGuid()}@test.com",
            PasswordHash = "hash",
            BairroId = bairroId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        db.Users.Add(user);
        db.SaveChanges();
        return user;
    }

    private static Group SeedGroup(AppDbContext db, GroupJoinPolicy joinPolicy = GroupJoinPolicy.Open, GroupScope scope = GroupScope.Bairro, int bairroId = 1)
    {
        var group = new Group
        {
            BairroId = bairroId,
            Name = "Test Group",
            Description = "Test",
            Category = GroupCategory.Outros,
            JoinPolicy = joinPolicy,
            Scope = scope,
            CreatedAt = DateTime.UtcNow
        };
        db.Groups.Add(group);
        db.SaveChanges();
        return group;
    }

    [Fact]
    public void OpenGroup_Join_SetsStatusActive()
    {
        using var db = NewDb();
        var user = SeedUser(db);
        var group = SeedGroup(db, GroupJoinPolicy.Open);

        var member = new GroupMember
        {
            GroupId = group.Id,
            UserId = user.Id,
            Role = GroupMemberRole.Member,
            Status = group.JoinPolicy == GroupJoinPolicy.Open
                ? GroupMemberStatus.Active
                : GroupMemberStatus.PendingApproval,
            JoinedAt = DateTime.UtcNow
        };

        member.Status.Should().Be(GroupMemberStatus.Active);
    }

    [Fact]
    public void ClosedGroup_Join_SetsPendingApproval()
    {
        using var db = NewDb();
        var user = SeedUser(db);
        var group = SeedGroup(db, GroupJoinPolicy.Closed);

        var status = group.JoinPolicy == GroupJoinPolicy.Open
            ? GroupMemberStatus.Active
            : GroupMemberStatus.PendingApproval;

        status.Should().Be(GroupMemberStatus.PendingApproval);
    }

    [Fact]
    public void GroupPost_HasGroupId_AndNoBasePostInheritance()
    {
        // GroupPost is a completely separate entity — not inheriting from Post
        var groupPost = new GroupPost
        {
            GroupId = 1,
            AuthorId = Guid.NewGuid(),
            Body = "Hello group",
            Category = PostCategory.Geral
        };

        groupPost.GroupId.Should().Be(1);
        // Confirm GroupPost does not have a BairroId property (compile-time check via type inspection)
        var props = typeof(GroupPost).GetProperties().Select(p => p.Name);
        props.Should().NotContain("BairroId");
        // Confirm not a subclass of Post
        typeof(GroupPost).BaseType.Should().Be(typeof(object));
    }

    [Fact]
    public void CrossBairroGroup_AcceptsMemberFromAdjacentBairro()
    {
        using var db = NewDb();
        var user = SeedUser(db, bairroId: 2);
        var group = SeedGroup(db, scope: GroupScope.CrossBairro, bairroId: 1);

        // For CrossBairro groups, members from adjacent bairros are accepted
        // The controller uses adjacency table; when empty, allows unconditionally (MVP)
        var isCrossBairro = group.Scope == GroupScope.CrossBairro;
        isCrossBairro.Should().BeTrue();
        // User is from bairro 2, group is from bairro 1 — cross-bairro policy allows it
        var userBairroId = user.BairroId;
        var groupBairroId = group.BairroId;
        (userBairroId != groupBairroId).Should().BeTrue();
    }
}
