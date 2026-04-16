namespace BairroNow.Api.Services;

public interface IOffensiveWordFilter
{
    bool Contains(string text);
    string[] FindMatches(string text);
}
