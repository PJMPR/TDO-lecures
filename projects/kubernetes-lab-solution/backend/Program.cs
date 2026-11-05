using Microsoft.EntityFrameworkCore;
using MissionControl.Api;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<MissionDbContext>(options =>
    options.UseMySQL(
        builder.Configuration.GetConnectionString("MissionDb")
        ?? throw new InvalidOperationException("Configure ConnectionStrings:MissionDb before starting the API.")
    )
);
builder.Services.AddHealthChecks().AddDbContextCheck<MissionDbContext>();
builder.Services.AddOpenApi();
var app = builder.Build();

await using (var scope = app.Services.CreateAsyncScope())
{
    var database = scope.ServiceProvider.GetRequiredService<MissionDbContext>();
    await database.Database.EnsureCreatedAsync();
    if (!await database.Missions.AnyAsync())
    {
        database.Missions.AddRange(
            new Mission { Name = "Orbital Relay", Status = "PLANNED", LaunchDate = new DateOnly(2027, 3, 12) },
            new Mission { Name = "Europa Survey", Status = "READY", LaunchDate = new DateOnly(2027, 6, 1) }
        );
        await database.SaveChangesAsync();
    }
}

app.MapHealthChecks("/health");
app.MapOpenApi();
app.MapGet("/api/missions", async (MissionDbContext database) =>
    await database.Missions.AsNoTracking().OrderBy(mission => mission.Id).ToListAsync()
);
app.MapGet("/api/missions/{id:int}", async (int id, MissionDbContext database) =>
    await database.Missions.FindAsync(id) is { } mission
        ? Results.Ok(mission)
        : Results.NotFound()
);
app.MapPost("/api/missions", async (MissionRequest request, MissionDbContext database) =>
{
    var errors = request.GetValidationErrors();
    if (errors.Count > 0)
    {
        return Results.ValidationProblem(errors);
    }

    var mission = new Mission
    {
        Name = request.Name,
        Status = request.Status,
        LaunchDate = request.LaunchDate
    };
    database.Missions.Add(mission);
    await database.SaveChangesAsync();
    return Results.Created($"/api/missions/{mission.Id}", mission);
});
app.MapPut("/api/missions/{id:int}", async (int id, MissionRequest request, MissionDbContext database) =>
{
    var errors = request.GetValidationErrors();
    if (errors.Count > 0)
    {
        return Results.ValidationProblem(errors);
    }

    var mission = await database.Missions.FindAsync(id);
    if (mission is null)
    {
        return Results.NotFound();
    }

    mission.Name = request.Name;
    mission.Status = request.Status;
    mission.LaunchDate = request.LaunchDate;
    await database.SaveChangesAsync();
    return Results.Ok(mission);
});
app.MapDelete("/api/missions/{id:int}", async (int id, MissionDbContext database) =>
{
    var mission = await database.Missions.FindAsync(id);
    if (mission is null)
    {
        return Results.NotFound();
    }

    database.Missions.Remove(mission);
    await database.SaveChangesAsync();
    return Results.NoContent();
});
app.Run();

public partial class Program { }
