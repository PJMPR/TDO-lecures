using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Testcontainers.MySql;
using Xunit;

namespace MissionControl.Api.Tests;

public sealed class MySqlFixture : IAsyncLifetime
{
    private readonly MySqlContainer database = new MySqlBuilder("mysql:8.4")
        .WithDatabase("mission_control")
        .WithUsername("mission")
        .WithPassword("mission-test-password")
        .Build();

    private WebApplicationFactory<Program>? factory;

    public async Task InitializeAsync()
    {
        await database.StartAsync();
        factory = new ApiFactory(database.GetConnectionString());
    }

    public HttpClient CreateClient() =>
        (factory ?? throw new InvalidOperationException("The test database has not been initialized."))
        .CreateClient();

    public async Task DisposeAsync()
    {
        if (factory is not null)
        {
            await factory.DisposeAsync();
        }

        await database.DisposeAsync();
    }

    private sealed class ApiFactory(string connectionString) : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseContentRoot(Path.GetFullPath(
                Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "backend")
            ));
            builder.ConfigureAppConfiguration((_, configuration) =>
                configuration.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["ConnectionStrings:MissionDb"] = connectionString
                })
            );
        }
    }
}
