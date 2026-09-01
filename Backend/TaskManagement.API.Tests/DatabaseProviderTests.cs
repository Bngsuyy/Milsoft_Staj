using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using Xunit;

namespace TaskManagement.API.Tests;

public sealed class DatabaseProviderTests
{
    [Theory]
    [InlineData("PostgreSQL")]
    [InlineData("Oracle")]
    public void ProviderModel_GeneratesCompleteCreateScript(string provider)
    {
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();

        if (provider == "PostgreSQL")
        {
            optionsBuilder.UseNpgsql(
                "Host=localhost;Database=provider_model_test;Username=test;Password=EXAMPLE_PASSWORD");
        }
        else
        {
            optionsBuilder.UseOracle(
                "User Id=test;Password=EXAMPLE_PASSWORD;Data Source=localhost:1521/XEPDB1");
        }

        using var context = new ApplicationDbContext(optionsBuilder.Options);
        var script = context.Database.GenerateCreateScript();

        Assert.False(string.IsNullOrWhiteSpace(script));
        Assert.Contains("Users", script, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("Categories", script, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("Tasks", script, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("TaskComments", script, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("TaskAttachments", script, StringComparison.OrdinalIgnoreCase);
    }
}
