using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace MissionControl.Api.Tests;

public sealed class MissionsApiTests(MySqlFixture fixture) : IClassFixture<MySqlFixture>
{
    [Fact]
    public async Task ListsTheExampleMissions()
    {
        using var client = fixture.CreateClient();
        using var response = await client.GetAsync("/api/missions");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var missions = await response.Content.ReadFromJsonAsync<MissionResponse[]>();
        Assert.NotNull(missions);
        Assert.Contains(missions, mission =>
            mission.Name == "Orbital Relay"
            && mission.Status == "PLANNED"
            && mission.LaunchDate == new DateOnly(2027, 3, 12)
        );
    }

    [Fact]
    public async Task CreatesAndRetrievesAMissionWithNoLaunchDate()
    {
        using var client = fixture.CreateClient();
        using var response = await client.PostAsJsonAsync(
            "/api/missions",
            new MissionRequest("Artemis", "READY", null)
        );

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<MissionResponse>();
        Assert.NotNull(created);
        Assert.True(created.Id > 0);
        Assert.Equal($"/api/missions/{created.Id}", response.Headers.Location?.OriginalString);

        var retrieved = await client.GetFromJsonAsync<MissionResponse>(response.Headers.Location);
        Assert.Equal(new MissionResponse(created.Id, "Artemis", "READY", null), retrieved);
    }

    [Fact]
    public async Task UpdatesAMissionAndPersistsItsLaunchDate()
    {
        using var client = fixture.CreateClient();
        using var creation = await client.PostAsJsonAsync(
            "/api/missions",
            new MissionRequest("Voyager", "PLANNED", null)
        );
        Assert.Equal(HttpStatusCode.Created, creation.StatusCode);
        var created = await creation.Content.ReadFromJsonAsync<MissionResponse>();
        Assert.NotNull(created);

        using var update = await client.PutAsJsonAsync(
            $"/api/missions/{created.Id}",
            new MissionRequest("Voyager II", "ACTIVE", new DateOnly(2027, 4, 5))
        );
        Assert.Equal(HttpStatusCode.OK, update.StatusCode);
        var retrieved = await client.GetFromJsonAsync<MissionResponse>($"/api/missions/{created.Id}");
        Assert.Equal(new MissionResponse(created.Id, "Voyager II", "ACTIVE", new DateOnly(2027, 4, 5)), retrieved);
    }

    [Fact]
    public async Task DeletesAMissionSoItCanNoLongerBeRetrieved()
    {
        using var client = fixture.CreateClient();
        using var creation = await client.PostAsJsonAsync(
            "/api/missions",
            new MissionRequest("Retired mission", "COMPLETED", null)
        );
        Assert.Equal(HttpStatusCode.Created, creation.StatusCode);
        var created = await creation.Content.ReadFromJsonAsync<MissionResponse>();
        Assert.NotNull(created);

        using var deletion = await client.DeleteAsync($"/api/missions/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deletion.StatusCode);
        using var lookup = await client.GetAsync($"/api/missions/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, lookup.StatusCode);
        using var repeatedDeletion = await client.DeleteAsync($"/api/missions/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, repeatedDeletion.StatusCode);
    }

    [Fact]
    public async Task RejectsABlankMissionName()
    {
        using var client = fixture.CreateClient();
        using var response = await client.PostAsJsonAsync(
            "/api/missions",
            new MissionRequest("   ", "READY", null)
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var problem = await response.Content.ReadFromJsonAsync<ValidationResponse>();
        Assert.NotNull(problem);
        Assert.Contains("name", problem.Errors.Keys);
    }

    public static TheoryData<string?, string?, string> InvalidMissions => new()
    {
        { null, "READY", "name" },
        { "", "READY", "name" },
        { new string('A', 121), "READY", "name" },
        { "Invalid status", null, "status" },
        { "Invalid status", "", "status" },
        { "Invalid status", "UNKNOWN", "status" }
    };

    [Theory]
    [MemberData(nameof(InvalidMissions))]
    public async Task RejectsInvalidMissionData(string? name, string? status, string invalidField)
    {
        using var client = fixture.CreateClient();
        using var response = await client.PostAsJsonAsync(
            "/api/missions",
            new MissionRequest(name, status, null)
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ValidationResponse>();
        Assert.NotNull(problem);
        Assert.Contains(invalidField, problem.Errors.Keys);
    }

    [Fact]
    public async Task ReportsHealthyWhenMySqlIsReachable()
    {
        using var client = fixture.CreateClient();
        using var response = await client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Healthy", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task DescribesTheMissionApiInOpenApi()
    {
        using var client = fixture.CreateClient();
        using var response = await client.GetAsync("/openapi/v1.json");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var document = await response.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
        var operations = document.GetProperty("paths").GetProperty("/api/missions");
        Assert.True(operations.TryGetProperty("get", out _));
        Assert.True(operations.TryGetProperty("post", out _));
    }

    [Fact]
    public async Task AcceptsAMissionNameOfExactly120Characters()
    {
        using var client = fixture.CreateClient();
        using var response = await client.PostAsJsonAsync(
            "/api/missions",
            new MissionRequest(new string('A', 120), "PLANNED", null)
        );

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var retrieved = await client.GetFromJsonAsync<MissionResponse>(response.Headers.Location);
        Assert.NotNull(retrieved);
        Assert.Equal(new string('A', 120), retrieved.Name);
    }

    [Fact]
    public async Task RejectsAnInvalidUpdateWithoutChangingTheMission()
    {
        using var client = fixture.CreateClient();
        using var creation = await client.PostAsJsonAsync(
            "/api/missions",
            new MissionRequest("Preserved mission", "READY", new DateOnly(2027, 2, 3))
        );
        Assert.Equal(HttpStatusCode.Created, creation.StatusCode);
        var created = await creation.Content.ReadFromJsonAsync<MissionResponse>();
        Assert.NotNull(created);

        using var update = await client.PutAsJsonAsync(
            $"/api/missions/{created.Id}",
            new MissionRequest(" ", "UNKNOWN", null)
        );
        Assert.Equal(HttpStatusCode.BadRequest, update.StatusCode);
        var retrieved = await client.GetFromJsonAsync<MissionResponse>($"/api/missions/{created.Id}");
        Assert.Equal(
            new MissionResponse(created.Id, "Preserved mission", "READY", new DateOnly(2027, 2, 3)),
            retrieved
        );
    }

    [Theory]
    [InlineData("GET")]
    [InlineData("PUT")]
    [InlineData("DELETE")]
    public async Task ReportsNotFoundForAMissingMission(string method)
    {
        using var client = fixture.CreateClient();
        using var request = new HttpRequestMessage(new HttpMethod(method), "/api/missions/2147483647");
        if (method == "PUT")
        {
            request.Content = JsonContent.Create(new MissionRequest("Missing", "READY", null));
        }

        using var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CanClearAnExistingLaunchDate()
    {
        using var client = fixture.CreateClient();
        using var creation = await client.PostAsJsonAsync(
            "/api/missions",
            new MissionRequest("Rescheduled mission", "PLANNED", new DateOnly(2027, 5, 6))
        );
        Assert.Equal(HttpStatusCode.Created, creation.StatusCode);
        var created = await creation.Content.ReadFromJsonAsync<MissionResponse>();
        Assert.NotNull(created);

        using var update = await client.PutAsJsonAsync(
            $"/api/missions/{created.Id}",
            new MissionRequest("Rescheduled mission", "PLANNED", null)
        );
        Assert.Equal(HttpStatusCode.OK, update.StatusCode);
        var retrieved = await client.GetFromJsonAsync<MissionResponse>($"/api/missions/{created.Id}");
        Assert.NotNull(retrieved);
        Assert.Null(retrieved.LaunchDate);
    }

    private sealed record ValidationResponse(Dictionary<string, string[]> Errors);
    private sealed record MissionRequest(string? Name, string? Status, DateOnly? LaunchDate);
    private sealed record MissionResponse(int Id, string Name, string Status, DateOnly? LaunchDate);
}
