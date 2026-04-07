using NossoVizinho.Api.Services;

namespace NossoVizinho.Api.Tests.Services;

public class OffensiveWordFilterTests
{
    private readonly OffensiveWordFilter _filter = new();

    [Fact]
    public void Contains_returns_true_for_known_slur()
    {
        Assert.True(_filter.Contains("Voce e um idiota completo"));
    }

    [Fact]
    public void Contains_returns_false_for_clean_text()
    {
        Assert.False(_filter.Contains("Bom dia vizinhos"));
    }

    [Theory]
    [InlineData("seu imbecil!", true)]
    [InlineData("filho da puta", true)]
    [InlineData("FDP", true)]
    [InlineData("hoje vou plantar flores no jardim", false)]
    [InlineData("merda toda", true)]
    public void Contains_handles_various_inputs(string text, bool expected)
    {
        Assert.Equal(expected, _filter.Contains(text));
    }

    [Fact]
    public void FindMatches_returns_matched_terms()
    {
        var matches = _filter.FindMatches("seu idiota e imbecil");
        Assert.Contains("idiota", matches);
        Assert.Contains("imbecil", matches);
    }

    [Fact]
    public void Contains_does_not_match_substrings()
    {
        // "burro" is a slur but "burrocrata" should not match (whole-word)
        Assert.False(_filter.Contains("burrocrata"));
    }
}
